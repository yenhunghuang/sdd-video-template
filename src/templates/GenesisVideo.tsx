import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { CalculateMetadataFunction } from "remotion";
import type { GenesisData } from "../types/schemas";
import { SceneTitle } from "../components/SceneTitle";
import { TypewriterText } from "../components/TypewriterText";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { CounterAnimation } from "../components/CounterAnimation";
import { THEME } from "../styles/theme";

const TRANSITION_FRAMES = 15;
const TITLE_FRAMES = 180;
const PRINCIPLE_STAGGER = 120;
const ARCH_FRAMES = 270;
const TASK_FRAMES = 180;
const OUTRO_FRAMES = 150;

// --- Sub-scenes ---

const PrinciplesScene: React.FC<{
  principles: GenesisData["principles"];
  stagger: number;
}> = ({ principles, stagger }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        padding: "100px 160px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: THEME.muted,
          fontSize: 18,
          letterSpacing: 3,
          marginBottom: 48,
          textTransform: "uppercase",
        }}
      >
        Core Principles
      </div>
      <div style={{ maxWidth: 1200 }}>
        {principles.map((p, i) => {
          const entrance = spring({
            frame,
            fps,
            delay: i * stagger,
            config: { damping: 200 },
          });
          const opacity = interpolate(entrance, [0, 1], [0, 1]);
          const translateX = interpolate(entrance, [0, 1], [-30, 0]);

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${translateX}px)`,
                marginBottom: 20,
                backgroundColor: "#1E293B",
                borderRadius: 10,
                border: "1px solid #334155",
                borderLeft: `4px solid ${THEME.accent}`,
                padding: "16px 24px",
                display: "flex",
                alignItems: "baseline",
                gap: 20,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  color: THEME.accent,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {p.title}
              </span>
              <Sequence
                from={i * stagger + 15}
                layout="none"
              >
                <TypewriterText
                  text={p.description}
                  speed={1.5}
                  cursor={i === principles.length - 1}
                  style={{ fontSize: 18, color: THEME.text }}
                />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const TaskSummaryScene: React.FC<{
  taskSummary: GenesisData["taskSummary"];
}> = ({ taskSummary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          color: THEME.muted,
          fontSize: 18,
          letterSpacing: 3,
          marginBottom: 48,
          textTransform: "uppercase",
        }}
      >
        Task Overview
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 48 }}>
        <CounterAnimation
          from={0}
          to={taskSummary.total}
          duration={40}
          style={{ fontSize: 72, fontWeight: 700 }}
        />
        <span style={{ fontSize: 28, color: THEME.muted }}>total tasks</span>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {taskSummary.categories.map((cat, i) => (
          <Sequence key={i} from={20 + i * 15} layout="none">
            <div
              style={{
                backgroundColor: "#1E293B",
                borderRadius: 10,
                border: "1px solid #334155",
                padding: "20px 32px",
                textAlign: "center",
              }}
            >
              <CounterAnimation
                from={0}
                to={cat.count}
                duration={30}
                style={{ fontSize: 48, fontWeight: 700 }}
              />
              <div
                style={{
                  color: THEME.muted,
                  fontSize: 14,
                  marginTop: 8,
                  maxWidth: 160,
                }}
              >
                {cat.name}
              </div>
            </div>
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// --- Main component ---

export const GenesisVideo: React.FC<GenesisData> = (props) => {
  const principlesDuration = props.principles.length * PRINCIPLE_STAGGER + 60;

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={TITLE_FRAMES}>
        <SceneTitle title={props.projectName} subtitle={props.tagline} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={principlesDuration}>
        <PrinciplesScene
          principles={props.principles}
          stagger={PRINCIPLE_STAGGER}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={ARCH_FRAMES}>
        <ArchitectureDiagram
          architecture={props.architecture}
          coloredModules={[]}
          highlightModules={[]}
          animationStartFrame={0}
          showDescriptions
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={TASK_FRAMES}>
        <TaskSummaryScene taskSummary={props.taskSummary} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
        <SceneTitle
          title="Ready to Build"
          subtitle={props.targetUsers.join(" · ")}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const calculateGenesisMetadata: CalculateMetadataFunction<
  GenesisData
> = async ({ props }) => {
  const principlesDuration = props.principles.length * PRINCIPLE_STAGGER + 60;
  const totalScenes =
    TITLE_FRAMES + principlesDuration + ARCH_FRAMES + TASK_FRAMES + OUTRO_FRAMES;
  const totalTransitions = 4 * TRANSITION_FRAMES;

  return {
    durationInFrames: totalScenes - totalTransitions,
    defaultOutName: "000-genesis-genesis",
  };
};
