import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { THEME } from "../styles/theme";

type BusinessSummarySceneProps = {
  impact: string;
  style?: React.CSSProperties;
};

export const BusinessSummaryScene: React.FC<BusinessSummarySceneProps> = ({
  impact,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          backgroundColor: "#1E293B",
          borderRadius: 16,
          border: "1px solid #33415566",
          borderTop: `4px solid ${THEME.accent}`,
          padding: "48px 64px",
          maxWidth: 1100,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 3,
            color: THEME.muted,
            textTransform: "uppercase",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          BUSINESS IMPACT
        </div>
        <div
          style={{
            color: THEME.accent,
            fontSize: 36,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {impact}
        </div>
      </div>
    </AbsoluteFill>
  );
};
