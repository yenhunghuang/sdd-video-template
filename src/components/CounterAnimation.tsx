import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { THEME } from "../styles/theme";

type CounterAnimationProps = {
  from: number;
  to: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatFn?: (n: number) => string;
  style?: React.CSSProperties;
  className?: string;
};

export const CounterAnimation: React.FC<CounterAnimationProps> = ({
  from,
  to,
  duration = 30,
  prefix,
  suffix,
  formatFn,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    durationInFrames: duration,
    config: { damping: 200 },
  });

  const currentValue = interpolate(progress, [0, 1], [from, to]);
  const display = formatFn
    ? formatFn(Math.round(currentValue))
    : String(Math.round(currentValue));

  return (
    <span
      className={className}
      style={{
        color: THEME.accent,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {prefix ?? ""}
      {display}
      {suffix ?? ""}
    </span>
  );
};
