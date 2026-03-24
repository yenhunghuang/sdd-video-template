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
import type { FullStoryData } from "../types/schemas";
import { SceneTitle } from "../components/SceneTitle";
import { TypewriterText } from "../components/TypewriterText";
import { SpecDiff } from "../components/SpecDiff";
import { TaskChecklist } from "../components/TaskChecklist";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { CounterAnimation } from "../components/CounterAnimation";
import { BusinessSummaryScene } from "../components/BusinessSummaryScene";
import { THEME } from "../styles/theme";

const TRANSITION_FRAMES = 15;
const BUSINESS_SUMMARY_FRAMES = 90;
// Genesis section
const TITLE_FRAMES = 180;
const PRINCIPLE_STAGGER = 120;
const ARCH_FRAMES = 270;
const TASK_FRAMES = 180;
// Iteration section
const ITER_TITLE_FRAMES = 90;
const SPEC_DIFF_FRAMES = 150;
const ITER_ARCH_FRAMES = 120;
const TASK_STAGGER = 15;
const TASK_BASE = 60;
// FullStory specific
const SEPARATOR_FRAMES = 60;
const FINAL_OUTRO_FRAMES = 150;

// --- Sub-scenes ---

const PrinciplesScene: React.FC<{
  principles: FullStoryData["principles"];
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
              marginBottom: 36,
              display: "flex",
              alignItems: "baseline",
              gap: 20,
            }}
          >
            <span
              style={{
                fontSize: 36,
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
                style={{ fontSize: 24, color: THEME.text }}
              />
            </Sequence>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const TaskSummaryScene: React.FC<{
  taskSummary: FullStoryData["taskSummary"];
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

      <div style={{ display: "flex", gap: 60 }}>
        {taskSummary.categories.map((cat, i) => (
          <Sequence key={i} from={20 + i * 15} layout="none">
            <div style={{ textAlign: "center" }}>
              <CounterAnimation
                from={0}
                to={cat.count}
                duration={30}
                style={{ fontSize: 48, fontWeight: 700 }}
              />
              <div
                style={{
                  color: THEME.muted,
                  fontSize: 16,
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

export const FullStoryVideo: React.FC<FullStoryData> = (props) => {
  const principlesDuration = props.principles.length * PRINCIPLE_STAGGER + 60;
  const audience = props.audience ?? "technical";

  const iterationElements = props.iterations.flatMap((iteration, i) => {
    const specDiff = audience === "business" && iteration.businessSpecDiff
      ? iteration.businessSpecDiff
      : iteration.specDiff;
    const tasks = audience === "business" && iteration.businessTasks
      ? iteration.businessTasks
      : iteration.tasks;
    const tasksDuration = tasks.length * TASK_STAGGER + TASK_BASE;

    const moduleAnnotations = audience === "business" && iteration.businessTasks
      ? Object.fromEntries(
          iteration.highlightModules
            .map((modId, idx) => [modId, iteration.businessTasks?.[idx]?.title ?? ""])
            .filter(([, v]) => v)
        )
      : undefined;

    return [
      <TransitionSeries.Transition
        key={`trans-sep-${i}`}
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
      <TransitionSeries.Sequence key={`sep-${i}`} durationInFrames={SEPARATOR_FRAMES}>
        <SceneTitle title={`#${iteration.iterationNumber}`} subtitle={iteration.changeName} />
      </TransitionSeries.Sequence>,
      <TransitionSeries.Transition
        key={`trans-title-${i}`}
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
      <TransitionSeries.Sequence key={`title-${i}`} durationInFrames={ITER_TITLE_FRAMES}>
        <SceneTitle
          title={`#${iteration.iterationNumber} ${iteration.changeName}`}
          subtitle={iteration.summary}
        />
      </TransitionSeries.Sequence>,
      ...(audience === "business" && iteration.businessImpact ? [
        <TransitionSeries.Transition key={`trans-biz-${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
        <TransitionSeries.Sequence key={`biz-${i}`} durationInFrames={BUSINESS_SUMMARY_FRAMES}>
          <BusinessSummaryScene impact={iteration.businessImpact} />
        </TransitionSeries.Sequence>,
      ] : []),
      <TransitionSeries.Transition
        key={`trans-diff-${i}`}
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
      <TransitionSeries.Sequence key={`diff-${i}`} durationInFrames={SPEC_DIFF_FRAMES}>
        <AbsoluteFill
          style={{
            backgroundColor: THEME.bg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SpecDiff
            before={specDiff.before}
            after={specDiff.after}
            transitionFrame={Math.floor(SPEC_DIFF_FRAMES / 2)}
            style={{ maxWidth: 1200 }}
          />
        </AbsoluteFill>
      </TransitionSeries.Sequence>,
      <TransitionSeries.Transition
        key={`trans-tasks-${i}`}
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
      <TransitionSeries.Sequence key={`tasks-${i}`} durationInFrames={tasksDuration}>
        <AbsoluteFill
          style={{
            backgroundColor: THEME.bg,
            justifyContent: "center",
            alignItems: "center",
            padding: "80px 200px",
          }}
        >
          <div
            style={{
              color: THEME.muted,
              fontSize: 18,
              letterSpacing: 3,
              marginBottom: 32,
              textTransform: "uppercase",
              alignSelf: "flex-start",
            }}
          >
            Completed Tasks
          </div>
          <TaskChecklist tasks={tasks} staggerDelay={TASK_STAGGER} />
        </AbsoluteFill>
      </TransitionSeries.Sequence>,
      <TransitionSeries.Transition
        key={`trans-arch-${i}`}
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
      <TransitionSeries.Sequence key={`arch-${i}`} durationInFrames={ITER_ARCH_FRAMES}>
        <ArchitectureDiagram
          architecture={props.architecture}
          coloredModules={iteration.coloredModules}
          highlightModules={iteration.highlightModules}
          animationStartFrame={15}
          moduleAnnotations={moduleAnnotations}
        />
      </TransitionSeries.Sequence>,
    ];
  });

  return (
    <TransitionSeries>
      {/* Genesis Title */}
      <TransitionSeries.Sequence durationInFrames={TITLE_FRAMES}>
        <SceneTitle title={props.projectName} subtitle={props.tagline} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Genesis Principles */}
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

      {/* Genesis Architecture */}
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

      {/* Genesis Task Summary */}
      <TransitionSeries.Sequence durationInFrames={TASK_FRAMES}>
        <TaskSummaryScene taskSummary={props.taskSummary} />
      </TransitionSeries.Sequence>

      {/* Iterations */}
      {iterationElements}

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Final Outro */}
      <TransitionSeries.Sequence durationInFrames={FINAL_OUTRO_FRAMES}>
        <SceneTitle title={props.projectName} subtitle="Project Evolution Complete" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const calculateFullStoryMetadata: CalculateMetadataFunction<
  FullStoryData
> = async ({ props }) => {
  const principlesDuration = props.principles.length * PRINCIPLE_STAGGER + 60;

  // Genesis section: title + principles + arch + tasks
  const genesisScenes =
    TITLE_FRAMES + principlesDuration + ARCH_FRAMES + TASK_FRAMES;
  const genesisTransitions = 3 * TRANSITION_FRAMES;

  const audience = props.audience ?? "technical";

  // Each iteration: separator + title + [bizSummary] + specDiff + tasks + arch
  let iterationTotal = 0;
  for (const it of props.iterations) {
    const tasks = audience === "business" && it.businessTasks
      ? it.businessTasks
      : it.tasks;
    const tasksDuration = tasks.length * TASK_STAGGER + TASK_BASE;
    const hasBizSummary = audience === "business" && it.businessImpact;
    const bizFrames = hasBizSummary ? BUSINESS_SUMMARY_FRAMES : 0;
    const iterScenes =
      SEPARATOR_FRAMES +
      ITER_TITLE_FRAMES +
      bizFrames +
      SPEC_DIFF_FRAMES +
      tasksDuration +
      ITER_ARCH_FRAMES;
    const iterTransitions = (hasBizSummary ? 5 : 4) * TRANSITION_FRAMES;
    iterationTotal += iterScenes - iterTransitions;
  }

  // Transitions between sections
  const sectionTransitions =
    (props.iterations.length + 1) * TRANSITION_FRAMES;

  const totalDuration =
    genesisScenes -
    genesisTransitions +
    iterationTotal +
    FINAL_OUTRO_FRAMES -
    sectionTransitions;

  return {
    durationInFrames: totalDuration,
    defaultOutName: `${props.projectName.toLowerCase().replace(/\s+/g, "-")}-full-story`,
  };
};
