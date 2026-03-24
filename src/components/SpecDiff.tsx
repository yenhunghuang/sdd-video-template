import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { THEME } from "../styles/theme";

interface SpecDiffProps {
  before: string;
  after: string;
  startFrame?: number;
  transitionFrame: number;
  style?: React.CSSProperties;
  className?: string;
}

export const SpecDiff: React.FC<SpecDiffProps> = ({
  before,
  after,
  transitionFrame,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  // Phase 1: fade in
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Cross-fade transition
  const beforeOpacity = interpolate(
    frame,
    [transitionFrame - 10, transitionFrame + 5],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const afterOpacity = interpolate(
    frame,
    [transitionFrame - 5, transitionFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
        ...style,
      }}
    >
      {/* BEFORE text */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: beforeOpacity,
          left: 160,
          right: 160,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: THEME.danger,
            letterSpacing: 3,
            marginBottom: 24,
            textTransform: "uppercase" as const,
            fontWeight: 600,
            padding: "4px 16px",
            border: `1px solid ${THEME.danger}44`,
            borderRadius: 4,
          }}
        >
          BEFORE
        </div>
        <div
          style={{
            fontSize: 32,
            color: THEME.text,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.6,
            opacity: 0.85,
            textDecoration: "line-through",
            textDecorationColor: `${THEME.danger}88`,
          }}
        >
          {before}
        </div>
      </div>

      {/* AFTER text */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: afterOpacity,
          left: 160,
          right: 160,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: THEME.success,
            letterSpacing: 3,
            marginBottom: 24,
            textTransform: "uppercase" as const,
            fontWeight: 600,
            padding: "4px 16px",
            border: `1px solid ${THEME.success}44`,
            borderRadius: 4,
          }}
        >
          AFTER
        </div>
        <div
          style={{
            fontSize: 32,
            color: THEME.text,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {after}
        </div>
      </div>
    </AbsoluteFill>
  );
};
