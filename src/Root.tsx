import "./index.css";
import { Composition } from "remotion";
import { GenesisDataSchema, IterationDataSchema } from "./types/schemas";
import {
  GenesisVideo,
  calculateGenesisMetadata,
} from "./templates/GenesisVideo";
import {
  IterationVideo,
  calculateIterationMetadata,
} from "./templates/IterationVideo";
import type { GenesisData, IterationData } from "./types/schemas";
import _genesisData from "./data/sample/genesis.json";
import _iterationData from "./data/sample/iteration-001.json";

const genesisData = _genesisData as unknown as GenesisData;
const iterationData = _iterationData as unknown as IterationData;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GenesisVideo"
        component={GenesisVideo}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={1440}
        schema={GenesisDataSchema}
        defaultProps={genesisData}
        calculateMetadata={calculateGenesisMetadata}
      />
      <Composition
        id="IterationVideo"
        component={IterationVideo}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={600}
        schema={IterationDataSchema}
        defaultProps={iterationData}
        calculateMetadata={calculateIterationMetadata}
      />
    </>
  );
};
