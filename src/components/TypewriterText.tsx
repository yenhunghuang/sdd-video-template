import React from "react";
import { useCurrentFrame } from "remotion";
import { THEME } from "../styles/theme";

type TypewriterTextProps = {
  text: string;
  startFrame?: number;
  speed?: number;
  cursor?: boolean;
  cursorChar?: string;
  style?: React.CSSProperties;
  className?: string;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 1,
  cursor = true,
  cursorChar = "▌",
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  const charsToShow = Math.min(Math.floor(frame * speed), text.length);
  const displayText = text.slice(0, charsToShow);

  const allRevealed = charsToShow >= text.length;
  const cursorVisible =
    cursor && !(allRevealed && frame > text.length / speed + 15);
  const cursorBlinking = Math.floor(frame / 10) % 2 === 0;

  return (
    <span
      className={className}
      style={{
        color: THEME.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    >
      {displayText}
      {cursorVisible && cursorBlinking ? cursorChar : ""}
    </span>
  );
};
