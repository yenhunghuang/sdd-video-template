import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolateColors,
  AbsoluteFill,
} from "remotion";
import type {
  ArchitectureDefinition,
  ModuleDefinition,
} from "../types/schemas";
import { MODULE_COLORS, GRAY, THEME } from "../styles/theme";

type ArchitectureDiagramProps = {
  architecture: ArchitectureDefinition;
  coloredModules: string[];
  highlightModules: string[];
  animationStartFrame: number;
  animationDuration?: number;
  showDescriptions?: boolean;
  moduleAnnotations?: Record<string, string>;
  width?: number;
  height?: number;
};

const BASE_MODULE_WIDTH = 200;
const BASE_MODULE_HEIGHT = 80;
const BASE_GAP_X = 60;
const BASE_GAP_Y = 50;
const MIN_MODULE_WIDTH = 120;
const MIN_MODULE_HEIGHT = 50;
const PADDING = 100;
const TITLE_HEIGHT = 60;

const getModulePosition = (
  mod: ModuleDefinition,
  cellWidth: number,
  cellHeight: number,
  offsetX: number,
  offsetY: number,
) => ({
  x: offsetX + mod.position.col * cellWidth,
  y: offsetY + mod.position.row * cellHeight,
});

const getModuleColors = (
  mod: ModuleDefinition,
  coloredModules: string[],
  highlightModules: string[],
  progress: number,
) => {
  if (highlightModules.includes(mod.id)) {
    return {
      fill: interpolateColors(
        progress,
        [0, 1],
        [GRAY.base, MODULE_COLORS[mod.category].base],
      ),
      stroke: interpolateColors(
        progress,
        [0, 1],
        [GRAY.light, MODULE_COLORS[mod.category].light],
      ),
      text: interpolateColors(progress, [0, 1], [THEME.muted, "#FFFFFF"]),
    };
  }

  if (coloredModules.includes(mod.id)) {
    return {
      fill: MODULE_COLORS[mod.category].base,
      stroke: MODULE_COLORS[mod.category].light,
      text: "#FFFFFF",
    };
  }

  return {
    fill: GRAY.base,
    stroke: GRAY.light,
    text: THEME.muted,
  };
};

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  architecture,
  coloredModules,
  highlightModules,
  animationStartFrame,
  animationDuration = 20,
  showDescriptions = false,
  moduleAnnotations,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - animationStartFrame),
    fps,
    durationInFrames: animationDuration,
    config: { damping: 200 },
  });

  // Compute grid dimensions
  const maxRow = Math.max(...architecture.modules.map((m) => m.position.row));
  const maxCol = Math.max(...architecture.modules.map((m) => m.position.col));
  const gridCols = maxCol + 1;
  const gridRows = maxRow + 1;

  // Adaptive sizing: compute module dimensions based on available space
  const availWidth = width - 2 * PADDING;
  const availHeight = height - TITLE_HEIGHT - 2 * PADDING;

  const maxCellWidth = availWidth / gridCols;
  const maxCellHeight = availHeight / gridRows;

  const moduleWidth = Math.max(
    MIN_MODULE_WIDTH,
    Math.min(BASE_MODULE_WIDTH, maxCellWidth * 0.7),
  );
  const moduleHeight = Math.max(
    MIN_MODULE_HEIGHT,
    Math.min(BASE_MODULE_HEIGHT, maxCellHeight * 0.6),
  );
  const gapX = Math.max(0, Math.min(BASE_GAP_X, maxCellWidth - moduleWidth));
  const gapY = Math.max(0, Math.min(BASE_GAP_Y, maxCellHeight - moduleHeight));

  const cellWidth = moduleWidth + gapX;
  const cellHeight = moduleHeight + gapY;
  const gridWidth = gridCols * cellWidth - gapX;
  const gridHeight = gridRows * cellHeight - gapY;

  const offsetX = (width - gridWidth) / 2;
  const offsetY = TITLE_HEIGHT + (height - TITLE_HEIGHT - gridHeight) / 2;

  // Build module grid-position lookup for manhattan distance calculation
  const modulePositions = new Map<string, { row: number; col: number }>();
  for (const mod of architecture.modules) {
    modulePositions.set(mod.id, mod.position);
  }

  // Build a lookup for module positions (center points)
  const moduleCenters = new Map<string, { cx: number; cy: number }>();
  for (const mod of architecture.modules) {
    const pos = getModulePosition(mod, cellWidth, cellHeight, offsetX, offsetY);
    moduleCenters.set(mod.id, {
      cx: pos.x + moduleWidth / 2,
      cy: pos.y + moduleHeight / 2,
    });
  }

  // Determine if a module is "active" (colored or highlighted after animation)
  const isModuleActive = (id: string) =>
    coloredModules.includes(id) ||
    (highlightModules.includes(id) && frame >= animationStartFrame);

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
      >
        {/* Arrowhead marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={THEME.muted} />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={THEME.accent} />
          </marker>
        </defs>

        {/* Title */}
        <text
          x={width / 2}
          y={40}
          textAnchor="middle"
          fill={THEME.text}
          fontSize={24}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={600}
        >
          {architecture.title}
        </text>

        {/* Connection lines (rendered below modules) */}
        {architecture.connections.map((conn) => {
          const source = moduleCenters.get(conn.from);
          const target = moduleCenters.get(conn.to);
          if (!source || !target) return null;

          const bothActive =
            isModuleActive(conn.from) && isModuleActive(conn.to);
          const lineColor = bothActive ? THEME.accent : THEME.muted;
          const markerId = bothActive
            ? "url(#arrowhead-active)"
            : "url(#arrowhead)";

          // Compute manhattan distance for curve decision
          const fromPos = modulePositions.get(conn.from);
          const toPos = modulePositions.get(conn.to);
          const manhattan =
            fromPos && toPos
              ? Math.abs(fromPos.row - toPos.row) +
                Math.abs(fromPos.col - toPos.col)
              : 0;

          // Connection label renderer
          const renderLabel = (lx: number, ly: number) => {
            if (!conn.label) return null;
            const labelPadding = 4;
            const estimatedWidth = conn.label.length * 6 + labelPadding * 2;
            return (
              <>
                <rect
                  x={lx - estimatedWidth / 2}
                  y={ly - 8}
                  width={estimatedWidth}
                  height={16}
                  fill={THEME.bg}
                  rx={3}
                />
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor="middle"
                  fill={lineColor}
                  fontSize={10}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={500}
                >
                  {conn.label}
                </text>
              </>
            );
          };

          if (manhattan > 2) {
            // Quadratic bezier for long-distance connections
            const midX = (source.cx + target.cx) / 2;
            const midY = (source.cy + target.cy) / 2;
            const dx = target.cx - source.cx;
            const dy = target.cy - source.cy;
            const len = Math.sqrt(dx * dx + dy * dy);
            const offsetAmount = len * 0.3;
            // Perpendicular direction (counter-clockwise 90°)
            const nx = -dy / len;
            const ny = dx / len;
            const cpx = midX + nx * offsetAmount;
            const cpy = midY + ny * offsetAmount;

            // Bezier midpoint at t=0.5
            const labelX =
              0.25 * source.cx + 0.5 * cpx + 0.25 * target.cx;
            const labelY =
              0.25 * source.cy + 0.5 * cpy + 0.25 * target.cy;

            return (
              <g key={`${conn.from}-${conn.to}`}>
                <path
                  d={`M ${source.cx} ${source.cy} Q ${cpx} ${cpy} ${target.cx} ${target.cy}`}
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="none"
                  markerEnd={markerId}
                  opacity={0.6}
                />
                {renderLabel(labelX, labelY)}
              </g>
            );
          }

          // Straight line for short-distance connections
          const labelMidX = (source.cx + target.cx) / 2;
          const labelMidY = (source.cy + target.cy) / 2;

          return (
            <g key={`${conn.from}-${conn.to}`}>
              <line
                x1={source.cx}
                y1={source.cy}
                x2={target.cx}
                y2={target.cy}
                stroke={lineColor}
                strokeWidth={2}
                markerEnd={markerId}
                opacity={0.6}
              />
              {renderLabel(labelMidX, labelMidY)}
            </g>
          );
        })}

        {/* Module rects + labels */}
        {architecture.modules.map((mod) => {
          const pos = getModulePosition(
            mod,
            cellWidth,
            cellHeight,
            offsetX,
            offsetY,
          );
          const colors = getModuleColors(
            mod,
            coloredModules,
            highlightModules,
            progress,
          );

          // Adaptive font size based on label length and module width
          const baseFontSize = 14;
          const maxChars = moduleWidth / (baseFontSize * 0.6);
          const labelFontSize =
            mod.label.length > maxChars
              ? Math.max(10, baseFontSize * (maxChars / mod.label.length))
              : baseFontSize;

          const baseDescFontSize = 10;
          const maxDescChars = moduleWidth / (baseDescFontSize * 0.6);
          const descFontSize =
            mod.description && mod.description.length > maxDescChars
              ? Math.max(
                  7,
                  baseDescFontSize * (maxDescChars / mod.description.length),
                )
              : baseDescFontSize;

          return (
            <g key={mod.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={moduleWidth}
                height={moduleHeight}
                rx={8}
                ry={8}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={2}
              />
              <text
                x={pos.x + moduleWidth / 2}
                y={
                  pos.y +
                  moduleHeight / 2 +
                  (showDescriptions && mod.description ? -6 : 5)
                }
                textAnchor="middle"
                fill={colors.text}
                fontSize={labelFontSize}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={600}
              >
                {mod.label}
              </text>
              {showDescriptions && mod.description && (
                <text
                  x={pos.x + moduleWidth / 2}
                  y={pos.y + moduleHeight / 2 + 14}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={descFontSize}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={400}
                  opacity={0.8}
                >
                  {mod.description}
                </text>
              )}
              {moduleAnnotations?.[mod.id] && (
                <text
                  x={pos.x + moduleWidth / 2}
                  y={pos.y + moduleHeight + 16}
                  textAnchor="middle"
                  fill={THEME.text}
                  fontSize={11}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={400}
                  opacity={0.8}
                >
                  {moduleAnnotations[mod.id]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
