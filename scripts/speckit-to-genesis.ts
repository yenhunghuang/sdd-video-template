import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { parseArgs } from "util";

// --- CLI args ---
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input: { type: "string", default: ".spec-kit/" },
    output: { type: "string", default: "openspec/archived/000-genesis/" },
  },
});

const inputDir = values.input!;
const outputDir = values.output!;

// --- Validate input files exist ---
const requiredFiles = [
  "constitution.md",
  "spec.md",
  "plan.md",
  "tasks.md",
] as const;

for (const file of requiredFiles) {
  const filePath = join(inputDir, file);
  if (!existsSync(filePath)) {
    console.error(`Error: Required file not found: ${filePath}`);
    process.exit(1);
  }
}

// --- Read input files ---
const constitution = await Bun.file(join(inputDir, "constitution.md")).text();
const spec = await Bun.file(join(inputDir, "spec.md")).text();
const plan = await Bun.file(join(inputDir, "plan.md")).text();
const tasks = await Bun.file(join(inputDir, "tasks.md")).text();

// --- Create output directory ---
mkdirSync(outputDir, { recursive: true });

// --- Write proposal.md (constitution + spec merged) ---
const proposal = `---
type: genesis
source: constitution.md + spec.md
---

# Proposal: Genesis

## Constitution

${constitution}

## Specification

${spec}`;

await Bun.write(join(outputDir, "proposal.md"), proposal);

// --- Write tasks.md (copy) ---
await Bun.write(join(outputDir, "tasks.md"), tasks);

// --- Write spec-delta.md (plan with frontmatter) ---
const specDelta = `---
type: genesis
source: plan.md
---

${plan}`;

await Bun.write(join(outputDir, "spec-delta.md"), specDelta);

console.log(`Genesis archive created at ${outputDir}`);
