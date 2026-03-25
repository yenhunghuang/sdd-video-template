import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
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
const STAGGER_FRAMES = 5;

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

// --- Edge point calculation (T-006) ---
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const getEdgePoint = (
  fromCenter: Point,
  toCenter: Point,
  rect: Rect,
): Point => {
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx / rect.w > absDy / rect.h) {
    // Horizontal dominant → exit from left or right edge
    const edgeX = dx > 0 ? rect.x + rect.w : rect.x;
    return { x: edgeX, y: fromCenter.y };
  } else {
    // Vertical dominant → exit from top or bottom edge
    const edgeY = dy > 0 ? rect.y + rect.h : rect.y;
    return { x: fromCenter.x, y: edgeY };
  }
};

// --- Text width estimation (T-007) ---
const estimateTextWidth = (text: string, fontSize: number): number => {
  let w = 0;
  for (const ch of text) {
    w += ch.charCodeAt(0) > 0x7f ? fontSize * 1.2 : fontSize * 0.65;
  }
  return w;
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
  type LayerInfo = {
    category: ModuleCategory;
    modules: ModuleDefinition[];
    layerIndex: number;
    x: number;
    y: number;
    w: number;
    h: number;
    modulePositions: Array<{ mod: ModuleDefinition; x: number; y: number }>;
  };

  // First pass: compute natural widths
  const layerNaturalWidths: number[] = [];
  for (const cat of categoryOrder) {
    const mods = categoryModules.get(cat) ?? [];
    const cols = mods.length;
    const moduleAreaW = cols * MODULE_W + (cols - 1) * GAP_X;
    layerNaturalWidths.push(Math.max(moduleAreaW + 2 * LAYER_PAD_X, 300));
  }

  // T-003: Unify all layers to max width
  const maxLayerW = Math.max(...layerNaturalWidths);

  const layers: LayerInfo[] = [];
  let currentY = TITLE_HEIGHT + PADDING;

  for (let li = 0; li < categoryOrder.length; li++) {
    const cat = categoryOrder[li];
    const mods = categoryModules.get(cat) ?? [];
    const cols = mods.length;

    const moduleAreaW = cols * MODULE_W + (cols - 1) * GAP_X;
    const layerW = maxLayerW;

    // Center the layer horizontally
    const layerX = (width - layerW) / 2;
    const layerH = LAYER_PAD_Y + MODULE_H + LAYER_PAD_BOTTOM;

    // Position modules within the layer (centered in unified width)
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
      layerIndex: li,
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

  // T-006: Build module rect lookup (for edge connections)
  const moduleRects = new Map<string, Rect>();
  const moduleCenters = new Map<string, Point>();
  const moduleLayerIndex = new Map<string, number>();
  for (const layer of layers) {
    for (const mp of layer.modulePositions) {
      moduleRects.set(mp.mod.id, { x: mp.x, y: mp.y, w: MODULE_W, h: MODULE_H });
      moduleCenters.set(mp.mod.id, {
        x: mp.x + MODULE_W / 2,
        y: mp.y + MODULE_H / 2,
      });
      moduleLayerIndex.set(mp.mod.id, layer.layerIndex);
    }
  }

  // T-005: Layer entrance animation progress
  const getLayerProgress = (layerIdx: number): number => {
    return spring({
      frame: Math.max(0, frame - animationStartFrame - layerIdx * STAGGER_FRAMES),
      fps,
      durationInFrames: animationDuration,
      config: { damping: 200 },
    });
  };

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
              <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
            </marker>
            <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={THEME.accent} />
            </marker>
            <filter id="card-shadow" x="-4%" y="-4%" width="108%" height="116%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
            </filter>
            {/* T-004: ClipPaths for accent bar clipping */}
            {layers.map((layer) =>
              layer.modulePositions.map(({ mod, x, y }) => (
                <clipPath key={`clip-${mod.id}`} id={`clip-${mod.id}`}>
                  <rect x={x} y={y} width={MODULE_W} height={MODULE_H} rx={10} />
                </clipPath>
              )),
            )}
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

          {/* Pass 1: Layer backgrounds + labels */}
          {layers.map((layer) => {
            const lp = getLayerProgress(layer.layerIndex);
            const layerOpacity = interpolate(lp, [0, 1], [0, 1]);
            const layerTranslateY = interpolate(lp, [0, 1], [20, 0]);

            return (
              <g
                key={`layer-bg-${layer.category}`}
                opacity={layerOpacity}
                transform={`translate(0, ${layerTranslateY})`}
              >
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
                <text
                  x={layer.x + 16}
                  y={layer.y + 22}
                  fill={MODULE_COLORS[layer.category].light}
                  fontSize={20}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={700}
                >
                  {CATEGORY_CN[layer.category] ?? layer.category}
                </text>
                <text
                  x={layer.x + 16}
                  y={layer.y + 40}
                  fill={THEME.muted}
                  fontSize={14}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={400}
                >
                  {CATEGORY_EN[layer.category] ?? layer.category}
                </text>
              </g>
            );
          })}

          {/* Pass 2: Connection lines (between layer backgrounds and module cards) */}
          {architecture.connections.map((conn) => {
            const sourceCenter = moduleCenters.get(conn.from);
            const targetCenter = moduleCenters.get(conn.to);
            const sourceRect = moduleRects.get(conn.from);
            const targetRect = moduleRects.get(conn.to);
            if (!sourceCenter || !targetCenter || !sourceRect || !targetRect) return null;

            // T-005: Connection appears only after both endpoint layers are visible
            const srcLayerIdx = moduleLayerIndex.get(conn.from) ?? 0;
            const tgtLayerIdx = moduleLayerIndex.get(conn.to) ?? 0;
            const srcLayerProgress = getLayerProgress(srcLayerIdx);
            const tgtLayerProgress = getLayerProgress(tgtLayerIdx);
            const connProgress = Math.min(srcLayerProgress, tgtLayerProgress);

            if (connProgress < 0.01) return null;

            // T-006: Edge points instead of centers
            const sourceEdge = getEdgePoint(sourceCenter, targetCenter, sourceRect);
            const targetEdge = getEdgePoint(targetCenter, sourceCenter, targetRect);

            const bothActive = isModuleActive(conn.from) && isModuleActive(conn.to);
            const lineColor = bothActive ? THEME.accent : "#94A3B8";
            const markerId = bothActive ? "url(#arrow-active)" : "url(#arrow)";
            const lineOpacity = (bothActive ? 0.9 : 0.7) * connProgress;

            // Curve calculation
            const dx = targetEdge.x - sourceEdge.x;
            const dy = targetEdge.y - sourceEdge.y;
            const midX = (sourceEdge.x + targetEdge.x) / 2;
            const midY = (sourceEdge.y + targetEdge.y) / 2;

            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1) return null;
            const curvature = len > 400 ? 0.15 : 0.08;
            const cpx = midX + (-dy / len) * len * curvature;
            const cpy = midY + (dx / len) * len * curvature;

            // Label position
            const labelX = 0.25 * sourceEdge.x + 0.5 * cpx + 0.25 * targetEdge.x;
            const labelY = 0.25 * sourceEdge.y + 0.5 * cpy + 0.25 * targetEdge.y;

            return (
              <g key={`${conn.from}-${conn.to}`}>
                <path
                  d={`M ${sourceEdge.x} ${sourceEdge.y} Q ${cpx} ${cpy} ${targetEdge.x} ${targetEdge.y}`}
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="none"
                  markerEnd={markerId}
                  opacity={lineOpacity}
                />
                {conn.label && (
                  <>
                    <rect
                      x={labelX - estimateTextWidth(conn.label, 12) / 2 - 8}
                      y={labelY - 11}
                      width={estimateTextWidth(conn.label, 12) + 16}
                      height={22}
                      fill="#1E293B"
                      rx={4}
                      opacity={0.95 * connProgress}
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      textAnchor="middle"
                      fill={lineColor}
                      fontSize={12}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight={600}
                      opacity={0.95 * connProgress}
                    >
                      {conn.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Pass 3: Module cards (on top of connections) */}
          {layers.map((layer) => {
            const lp = getLayerProgress(layer.layerIndex);
            const layerOpacity = interpolate(lp, [0, 1], [0, 1]);
            const layerTranslateY = interpolate(lp, [0, 1], [20, 0]);

            return (
              <g
                key={`layer-cards-${layer.category}`}
                opacity={layerOpacity}
                transform={`translate(0, ${layerTranslateY})`}
              >
                {layer.modulePositions.map(({ mod, x, y }) => {
                  const colors = getModuleColors(mod, coloredModules, highlightModules, progress);

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
                      {/* Left accent bar (clipped to card shape) */}
                      <g clipPath={`url(#clip-${mod.id})`}>
                        <rect
                          x={x}
                          y={y}
                          width={4}
                          height={MODULE_H}
                          fill={accentColor}
                        />
                      </g>
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
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
