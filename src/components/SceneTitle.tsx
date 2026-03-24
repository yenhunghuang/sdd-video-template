import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { THEME } from "../styles/theme";

type SceneTitleProps = {
  title: string;
  subtitle?: string;
  startFrame?: number;
  style?: React.CSSProperties;
};

export const SceneTitle: React.FC<SceneTitleProps> = ({
  title,
  subtitle,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleScale = interpolate(titleProgress, [0, 1], [0.8, 1]);

  const subtitleProgress = spring({
    frame,
    fps,
    delay: 10,
    config: { damping: 200 },
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleScale = interpolate(subtitleProgress, [0, 1], [0.8, 1]);

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
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          color: THEME.text,
          fontSize: 64,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `scale(${subtitleScale})`,
            color: THEME.muted,
            fontSize: 28,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
