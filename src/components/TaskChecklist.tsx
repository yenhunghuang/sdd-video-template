import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { THEME } from "../styles/theme";

interface TaskChecklistProps {
  tasks: Array<{
    id: string;
    title: string;
    status: "completed" | "skipped";
  }>;
  startFrame?: number;
  staggerDelay?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({
  tasks,
  staggerDelay = 15,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 900,
        ...style,
      }}
    >
      {tasks.map((task, i) => {
        const taskDelay = i * staggerDelay;

        // Row entrance animation
        const entrance = spring({
          frame,
          fps,
          delay: taskDelay,
          config: { damping: 200 },
        });

        const opacity = interpolate(entrance, [0, 1], [0, 1]);
        const translateY = interpolate(entrance, [0, 1], [20, 0]);

        // Checkmark animation (bouncy, delayed)
        const checkScale = spring({
          frame,
          fps,
          delay: taskDelay + 8,
          config: { damping: 12 },
        });

        const isCompleted = task.status === "completed";

        return (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity,
              transform: `translateY(${translateY}px)`,
              backgroundColor: "#1E293B",
              borderRadius: 10,
              border: "1px solid #334155",
              padding: "12px 20px",
              borderLeft: `4px solid ${isCompleted ? THEME.success : THEME.muted}`,
            }}
          >
            {/* Checkbox / mark */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isCompleted
                  ? `${THEME.success}22`
                  : `${THEME.muted}22`,
                border: `2px solid ${isCompleted ? THEME.success : THEME.muted}`,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  transform: `scale(${checkScale})`,
                  fontSize: 16,
                  fontWeight: 700,
                  color: isCompleted ? THEME.success : THEME.muted,
                  lineHeight: 1,
                }}
              >
                {isCompleted ? "\u2713" : "\u2014"}
              </span>
            </div>

            {/* Title */}
            <span
              style={{
                fontSize: 16,
                color: isCompleted ? THEME.text : THEME.muted,
                textDecoration: isCompleted ? "none" : "line-through",
                fontWeight: 500,
              }}
            >
              {task.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};
