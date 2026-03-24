import { existsSync, rmSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const SAMPLE_DIR = join(ROOT, "src/data/sample");

// --- Interactive prompt ---
const prompt = (question: string): string => {
  process.stdout.write(question);
  const buf = new Uint8Array(1024);
  const n = require("fs").readSync(0, buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
};

console.log("\n--- SDD Video Template Initializer ---\n");

const projectName = prompt("Project name: ");
if (!projectName) {
  console.error("Error: Project name is required");
  process.exit(1);
}

const tagline = prompt("Tagline (one-line description): ");
const targetUsersRaw = prompt("Target users (comma-separated): ");
const targetUsers = targetUsersRaw
  ? targetUsersRaw.split(",").map((u) => u.trim()).filter(Boolean)
  : ["Developer"];

// --- Generate skeleton genesis.json ---
const genesis = {
  type: "genesis" as const,
  projectName,
  tagline: tagline || `${projectName} - a new project`,
  principles: [
    {
      title: "Replace Me",
      description: "Add your first core principle here",
    },
  ],
  architecture: {
    title: `${projectName} Architecture`,
    modules: [
      {
        id: "core",
        label: "Core",
        description: "Main business logic",
        category: "core" as const,
        position: { row: 0, col: 1 },
      },
    ],
    connections: [],
  },
  taskSummary: {
    total: 0,
    categories: [{ name: "Tasks", count: 0 }],
  },
  targetUsers,
};

const iteration = {
  type: "iteration" as const,
  iterationNumber: "001",
  changeName: "first-change",
  summary: "Replace with your first iteration summary",
  motivation: "Replace with the motivation for this change",
  specDiff: {
    before: "Previous state description",
    after: "New state description",
  },
  tasks: [
    {
      id: "T-001",
      title: "Replace with your first task",
      status: "completed" as const,
    },
  ],
  architecture: genesis.architecture,
  coloredModules: ["core"],
  highlightModules: ["core"],
};

// --- Write files ---
await Bun.write(
  join(SAMPLE_DIR, "genesis.json"),
  JSON.stringify(genesis, null, 2) + "\n",
);
console.log(`  Written: src/data/sample/genesis.json`);

await Bun.write(
  join(SAMPLE_DIR, "iteration-001.json"),
  JSON.stringify(iteration, null, 2) + "\n",
);
console.log(`  Written: src/data/sample/iteration-001.json`);

// --- Clean up .specify/ sample specs ---
const specifyDir = join(ROOT, ".specify");
if (existsSync(specifyDir)) {
  const answer = prompt(
    "\nRemove sample .specify/ directory? (y/N): ",
  );
  if (answer.toLowerCase() === "y") {
    rmSync(specifyDir, { recursive: true });
    console.log("  Removed: .specify/");
  }
}

console.log(`
Done! Next steps:

  1. Edit src/data/sample/genesis.json with your project details
     - Add principles, architecture modules, task categories
  2. Preview:  bun dev
  3. Render:   bun run render -- GenesisVideo

Or generate from SDD files:
  bun run speckit-to-genesis -- --input .spec-kit/
  bun run parse-archive -- --input openspec/archived/000-genesis/ --output src/data/sample/genesis.json
`);
