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
  ModuleCategory,
} from "../types/schemas";
import { MODULE_COLORS, THEME } from "../styles/theme";

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

// --- Layout constants ---
const MODULE_W = 220;
const MODULE_H = 76;
const GAP_X = 50;
const GAP_Y = 40;
const LAYER_PAD_X = 24;
const LAYER_PAD_Y = 44; // top (room for label)
const LAYER_PAD_BOTTOM = 16;
const PADDING = 80;
const TITLE_HEIGHT = 56;

// --- Category display names ---
const CATEGORY_CN: Record<string, string> = {
  core: "核心層",
  api: "介面層",
  data: "資料層",
  ui: "客戶端",
  infra: "基礎設施",
  external: "外部服務",
};

const CATEGORY_EN: Record<string, string> = {
  core: "Core",
  api: "API",
  data: "Data",
  ui: "Client",
  infra: "Infrastructure",
  external: "External",
};

// --- Layer background color (subtle, based on category) ---
const layerBg = (cat: ModuleCategory): string => {
  const c = MODULE_COLORS[cat].base;
  return `${c}0A`; // very faint tint
};

const layerBorder = (cat: ModuleCategory): string => {
  const c = MODULE_COLORS[cat].base;
  return `${c}30`;
};

// --- Helpers ---

const getModuleColors = (
  mod: ModuleDefinition,
  coloredModules: string[],
  highlightModules: string[],
  progress: number,
) => {
  if (highlightModules.includes(mod.id)) {
    const catColor = MODULE_COLORS[mod.category];
    return {
      fill: interpolateColors(progress, [0, 1], ["#1E293B", catColor.base + "22"]),
      stroke: interpolateColors(progress, [0, 1], ["#334155", catColor.light]),
      text: interpolateColors(progress, [0, 1], [THEME.muted, THEME.text]),
      labelColor: interpolateColors(progress, [0, 1], [THEME.muted, catColor.light]),
    };
  }

  if (coloredModules.includes(mod.id)) {
    const catColor = MODULE_COLORS[mod.category];
    return {
      fill: catColor.base + "22",
      stroke: catColor.light,
      text: THEME.text,
      labelColor: catColor.light,
    };
  }

  return {
    fill: "#1E293B",
    stroke: "#334155",
    text: THEME.muted,
    labelColor: THEME.muted,
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

  // --- Group modules by category (preserve order of first appearance) ---
  const categoryOrder: ModuleCategory[] = [];
  const categoryModules = new Map<ModuleCategory, ModuleDefinition[]>();
  for (const mod of architecture.modules) {
    if (!categoryModules.has(mod.category)) {
      categoryOrder.push(mod.category);
      categoryModules.set(mod.category, []);
    }
    categoryModules.get(mod.category)!.push(mod);
  }

  // --- Compute grid layout per category row ---
  // Each category becomes a horizontal "layer row"
  // Modules within a category are arranged in a single row

  // Compute layer dimensions
  type LayerInfo = {
    category: ModuleCategory;
    modules: ModuleDefinition[];
    x: number;
    y: number;
    w: number;
    h: number;
    modulePositions: Array<{ mod: ModuleDefinition; x: number; y: number }>;
  };

  const layers: LayerInfo[] = [];
  let currentY = TITLE_HEIGHT + PADDING;

  for (const cat of categoryOrder) {
    const mods = categoryModules.get(cat) ?? [];
    const cols = mods.length;

    // Module area width (modules + gaps between them)
    const moduleAreaW = cols * MODULE_W + (cols - 1) * GAP_X;
    const layerW = Math.max(moduleAreaW + 2 * LAYER_PAD_X, 300);

    // Center the layer horizontally
    const layerX = (width - layerW) / 2;
    const layerH = LAYER_PAD_Y + MODULE_H + LAYER_PAD_BOTTOM;

    // Position modules within the layer
    const moduleStartX = layerX + (layerW - moduleAreaW) / 2;
    const moduleY = currentY + LAYER_PAD_Y;
    const modulePositions = mods.map((mod, i) => ({
      mod,
      x: moduleStartX + i * (MODULE_W + GAP_X),
      y: moduleY,
    }));

    layers.push({
      category: cat,
      modules: mods,
      x: layerX,
      y: currentY,
      w: layerW,
      h: layerH,
      modulePositions,
    });

    currentY += layerH + GAP_Y;
  }

  // Scale everything to fit viewport if needed
  const totalContentH = currentY - GAP_Y + PADDING;
  const scale = totalContentH > height ? height / totalContentH : 1;
  const translateY = scale < 1 ? 0 : (height - totalContentH) / 2;

  // Build module center lookup (for connections)
  const moduleCenters = new Map<string, { cx: number; cy: number }>();
  for (const layer of layers) {
    for (const mp of layer.modulePositions) {
      moduleCenters.set(mp.mod.id, {
        cx: mp.x + MODULE_W / 2,
        cy: mp.y + MODULE_H / 2,
      });
    }
  }

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
        <g transform={`translate(0, ${translateY}) scale(${scale})`}>
          {/* Arrowhead markers */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={THEME.muted} />
            </marker>
            <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={THEME.accent} />
            </marker>
            <filter id="card-shadow" x="-4%" y="-4%" width="108%" height="116%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Title */}
          <text
            x={width / scale / 2}
            y={PADDING - 10}
            textAnchor="middle"
            fill={THEME.text}
            fontSize={30}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={700}
          >
            {architecture.title}
          </text>

          {/* Layer containers */}
          {layers.map((layer) => (
            <g key={`layer-${layer.category}`}>
              {/* Layer background */}
              <rect
                x={layer.x}
                y={layer.y}
                width={layer.w}
                height={layer.h}
                rx={12}
                fill={layerBg(layer.category)}
                stroke={layerBorder(layer.category)}
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
              {/* Layer label — Chinese */}
              <text
                x={layer.x + 16}
                y={layer.y + 20}
                fill={MODULE_COLORS[layer.category].light}
                fontSize={15}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={700}
              >
                {CATEGORY_CN[layer.category] ?? layer.category}
              </text>
              {/* Layer label — English */}
              <text
                x={layer.x + 16}
                y={layer.y + 36}
                fill={THEME.muted}
                fontSize={11}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={400}
              >
                {CATEGORY_EN[layer.category] ?? layer.category}
              </text>
            </g>
          ))}

          {/* Connection lines (below modules) */}
          {architecture.connections.map((conn) => {
            const source = moduleCenters.get(conn.from);
            const target = moduleCenters.get(conn.to);
            if (!source || !target) return null;

            const bothActive = isModuleActive(conn.from) && isModuleActive(conn.to);
            const lineColor = bothActive ? THEME.accent : THEME.muted;
            const markerId = bothActive ? "url(#arrow-active)" : "url(#arrow)";
            const lineOpacity = bothActive ? 0.8 : 0.4;

            // Connection path: use slight curve for all
            const dx = target.cx - source.cx;
            const dy = target.cy - source.cy;
            const midX = (source.cx + target.cx) / 2;
            const midY = (source.cy + target.cy) / 2;

            // Offset control point perpendicular to line
            const len = Math.sqrt(dx * dx + dy * dy);
            const curvature = len > 400 ? 0.15 : 0.08;
            const cpx = midX + (-dy / len) * len * curvature;
            const cpy = midY + (dx / len) * len * curvature;

            // Label position
            const labelX = 0.25 * source.cx + 0.5 * cpx + 0.25 * target.cx;
            const labelY = 0.25 * source.cy + 0.5 * cpy + 0.25 * target.cy;

            return (
              <g key={`${conn.from}-${conn.to}`}>
                <path
                  d={`M ${source.cx} ${source.cy} Q ${cpx} ${cpy} ${target.cx} ${target.cy}`}
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="none"
                  markerEnd={markerId}
                  opacity={lineOpacity}
                />
                {conn.label && (
                  <>
                    <rect
                      x={labelX - conn.label.length * 4 - 6}
                      y={labelY - 10}
                      width={conn.label.length * 8 + 12}
                      height={20}
                      fill={THEME.bg}
                      rx={4}
                      opacity={0.9}
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      textAnchor="middle"
                      fill={lineColor}
                      fontSize={11}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight={600}
                      opacity={0.9}
                    >
                      {conn.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Module cards */}
          {layers.map((layer) =>
            layer.modulePositions.map(({ mod, x, y }) => {
              const colors = getModuleColors(mod, coloredModules, highlightModules, progress);

              // Category accent bar color
              const accentColor = coloredModules.includes(mod.id) || highlightModules.includes(mod.id)
                ? interpolateColors(progress, [0, 1], [THEME.muted, MODULE_COLORS[mod.category].base])
                : THEME.muted;

              return (
                <g key={mod.id} filter="url(#card-shadow)">
                  {/* Card background */}
                  <rect
                    x={x}
                    y={y}
                    width={MODULE_W}
                    height={MODULE_H}
                    rx={10}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={1.5}
                  />
                  {/* Left accent bar */}
                  <rect
                    x={x}
                    y={y}
                    width={4}
                    height={MODULE_H}
                    rx={2}
                    fill={accentColor}
                  />
                  {/* Module label */}
                  <text
                    x={x + 18}
                    y={y + (mod.description || showDescriptions ? 28 : MODULE_H / 2 + 6)}
                    fill={colors.labelColor}
                    fontSize={15}
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight={700}
                  >
                    {mod.label}
                  </text>
                  {/* Module description */}
                  {(showDescriptions || mod.description) && mod.description && (
                    <text
                      x={x + 18}
                      y={y + 48}
                      fill={colors.text}
                      fontSize={11}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight={400}
                      opacity={0.7}
                    >
                      {mod.description.length > 28
                        ? mod.description.slice(0, 26) + "…"
                        : mod.description}
                    </text>
                  )}
                  {/* Business annotation */}
                  {moduleAnnotations?.[mod.id] && (
                    <text
                      x={x + MODULE_W / 2}
                      y={y + MODULE_H + 16}
                      textAnchor="middle"
                      fill={THEME.accent}
                      fontSize={11}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight={600}
                    >
                      {moduleAnnotations[mod.id]}
                    </text>
                  )}
                </g>
              );
            }),
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
