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
  width?: number;
  height?: number;
};

const MODULE_WIDTH = 200;
const MODULE_HEIGHT = 80;
const GAP_X = 60;
const GAP_Y = 50;
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

  const cellWidth = MODULE_WIDTH + GAP_X;
  const cellHeight = MODULE_HEIGHT + GAP_Y;
  const gridWidth = gridCols * cellWidth - GAP_X;
  const gridHeight = gridRows * cellHeight - GAP_Y;

  const offsetX = (width - gridWidth) / 2;
  const offsetY = TITLE_HEIGHT + (height - TITLE_HEIGHT - gridHeight) / 2;

  // Build a lookup for module positions (center points)
  const moduleCenters = new Map<string, { cx: number; cy: number }>();
  for (const mod of architecture.modules) {
    const pos = getModulePosition(mod, cellWidth, cellHeight, offsetX, offsetY);
    moduleCenters.set(mod.id, {
      cx: pos.x + MODULE_WIDTH / 2,
      cy: pos.y + MODULE_HEIGHT / 2,
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

          return (
            <line
              key={`${conn.from}-${conn.to}`}
              x1={source.cx}
              y1={source.cy}
              x2={target.cx}
              y2={target.cy}
              stroke={lineColor}
              strokeWidth={2}
              markerEnd={markerId}
              opacity={0.6}
            />
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

          return (
            <g key={mod.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={MODULE_WIDTH}
                height={MODULE_HEIGHT}
                rx={8}
                ry={8}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={2}
              />
              <text
                x={pos.x + MODULE_WIDTH / 2}
                y={
                  pos.y +
                  MODULE_HEIGHT / 2 +
                  (showDescriptions && mod.description ? -6 : 5)
                }
                textAnchor="middle"
                fill={colors.text}
                fontSize={14}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={600}
              >
                {mod.label}
              </text>
              {showDescriptions && mod.description && (
                <text
                  x={pos.x + MODULE_WIDTH / 2}
                  y={pos.y + MODULE_HEIGHT / 2 + 14}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize={10}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={400}
                  opacity={0.8}
                >
                  {mod.description}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
