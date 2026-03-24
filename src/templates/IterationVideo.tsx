import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { CalculateMetadataFunction } from "remotion";
import type { IterationData } from "../types/schemas";
import { SceneTitle } from "../components/SceneTitle";
import { SpecDiff } from "../components/SpecDiff";
import { TaskChecklist } from "../components/TaskChecklist";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { THEME } from "../styles/theme";

const TRANSITION_FRAMES = 15;
const TITLE_FRAMES = 90;
const SPEC_DIFF_FRAMES = 150;
const ARCH_FRAMES = 120;
const OUTRO_FRAMES = 75;
const TASK_STAGGER = 15;
const TASK_BASE = 60;

// --- Main component ---

export const IterationVideo: React.FC<IterationData> = (props) => {
  const tasksDuration = props.tasks.length * TASK_STAGGER + TASK_BASE;

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={TITLE_FRAMES}>
        <SceneTitle
          title={`#${props.iterationNumber} ${props.changeName}`}
          subtitle={props.summary}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={SPEC_DIFF_FRAMES}>
        <AbsoluteFill
          style={{
            backgroundColor: THEME.bg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SpecDiff
            before={props.specDiff.before}
            after={props.specDiff.after}
            transitionFrame={Math.floor(SPEC_DIFF_FRAMES / 2)}
            style={{ maxWidth: 1200 }}
          />
        </AbsoluteFill>
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={tasksDuration}>
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
          <TaskChecklist tasks={props.tasks} staggerDelay={TASK_STAGGER} />
        </AbsoluteFill>
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={ARCH_FRAMES}>
        <ArchitectureDiagram
          architecture={props.architecture}
          coloredModules={props.coloredModules}
          highlightModules={props.highlightModules}
          animationStartFrame={15}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
        <SceneTitle
          title={props.changeName}
          subtitle={props.motivation}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const calculateIterationMetadata: CalculateMetadataFunction<
  IterationData
> = async ({ props }) => {
  const tasksDuration = props.tasks.length * TASK_STAGGER + TASK_BASE;
  const totalScenes =
    TITLE_FRAMES + SPEC_DIFF_FRAMES + tasksDuration + ARCH_FRAMES + OUTRO_FRAMES;
  const totalTransitions = 4 * TRANSITION_FRAMES;

  return {
    durationInFrames: totalScenes - totalTransitions,
    defaultOutName: `${props.iterationNumber}-${props.changeName}-iteration.mp4`,
  };
};
