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
          color: THEME.accent,
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        {impact}
      </div>
    </AbsoluteFill>
  );
};
