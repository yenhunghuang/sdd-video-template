import { z } from "zod";

// --- Shared types ---

const ModuleCategorySchema = z.enum([
  "core",
  "api",
  "data",
  "ui",
  "infra",
  "external",
]);

export const ModuleDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  category: ModuleCategorySchema,
  position: z.object({
    row: z.number(),
    col: z.number(),
  }),
});

export const ArchitectureDefinitionSchema = z.object({
  title: z.string(),
  modules: z.array(ModuleDefinitionSchema),
  connections: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    }),
  ),
});

// --- Video data schemas ---

export const GenesisDataSchema = z.object({
  type: z.literal("genesis"),
  projectName: z.string(),
  tagline: z.string(),
  principles: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  architecture: ArchitectureDefinitionSchema,
  taskSummary: z.object({
    total: z.number(),
    categories: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      }),
    ),
  }),
  targetUsers: z.array(z.string()),
});

export const IterationDataSchema = z.object({
  type: z.literal("iteration"),
  iterationNumber: z.string(),
  changeName: z.string(),
  summary: z.string(),
  motivation: z.string(),
  specDiff: z.object({
    before: z.string(),
    after: z.string(),
  }),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["completed", "skipped"]),
    }),
  ),
  architecture: ArchitectureDefinitionSchema,
  coloredModules: z.array(z.string()),
  highlightModules: z.array(z.string()),
});

export const EvolutionDataSchema = z.object({
  type: z.literal("evolution"),
  projectName: z.string(),
  iterations: z.array(
    z.object({
      iterationNumber: z.string(),
      changeName: z.string(),
      summary: z.string(),
      coloredModules: z.array(z.string()),
      highlightModules: z.array(z.string()),
    }),
  ),
  architecture: ArchitectureDefinitionSchema,
  stats: z.object({
    totalIterations: z.number(),
    totalTasks: z.number(),
    completedTasks: z.number(),
    timeSpan: z.string(),
  }),
});

export const SprintDataSchema = z.object({
  type: z.literal("sprint"),
  sprintName: z.string(),
  period: z.string(),
  iterations: z.array(
    z.object({
      iterationNumber: z.string(),
      changeName: z.string(),
      summary: z.string(),
    }),
  ),
  stats: z.object({
    iterationCount: z.number(),
    tasksCompleted: z.number(),
    tasksSkipped: z.number(),
  }),
  keyChanges: z.array(z.string()),
  architecture: ArchitectureDefinitionSchema,
  coloredModules: z.array(z.string()),
});

export const FullStoryIterationSchema = z.object({
  iterationNumber: z.string(),
  changeName: z.string(),
  summary: z.string(),
  motivation: z.string(),
  specDiff: z.object({
    before: z.string(),
    after: z.string(),
  }),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["completed", "skipped"]),
    }),
  ),
  coloredModules: z.array(z.string()),
  highlightModules: z.array(z.string()),
});

export const FullStoryDataSchema = z.object({
  type: z.literal("fullstory"),
  projectName: z.string(),
  tagline: z.string(),
  principles: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  architecture: ArchitectureDefinitionSchema,
  taskSummary: z.object({
    total: z.number(),
    categories: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      }),
    ),
  }),
  targetUsers: z.array(z.string()),
  iterations: z.array(FullStoryIterationSchema),
});

// --- Inferred types ---

export type ModuleCategory = z.infer<typeof ModuleCategorySchema>;
export type ModuleDefinition = z.infer<typeof ModuleDefinitionSchema>;
export type ArchitectureDefinition = z.infer<
  typeof ArchitectureDefinitionSchema
>;
export type GenesisData = z.infer<typeof GenesisDataSchema>;
export type IterationData = z.infer<typeof IterationDataSchema>;
export type EvolutionData = z.infer<typeof EvolutionDataSchema>;
export type SprintData = z.infer<typeof SprintDataSchema>;
export type FullStoryIteration = z.infer<typeof FullStoryIterationSchema>;
export type FullStoryData = z.infer<typeof FullStoryDataSchema>;
