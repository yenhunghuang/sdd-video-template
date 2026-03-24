import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
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
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
        position: "relative",
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
          opacity: beforeOpacity,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: THEME.muted,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          BEFORE
        </span>
        <span
          style={{
            fontSize: 28,
            color: THEME.danger,
            textDecoration: "line-through",
            fontWeight: 600,
          }}
        >
          {before}
        </span>
      </div>

      {/* AFTER text */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: afterOpacity,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: THEME.muted,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          AFTER
        </span>
        <span
          style={{
            fontSize: 28,
            color: THEME.success,
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          {after}
        </span>
      </div>
    </div>
  );
};
