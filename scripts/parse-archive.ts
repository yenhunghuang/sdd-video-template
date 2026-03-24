import { existsSync } from "fs";
import { basename, join } from "path";
import { parseArgs } from "util";
import matter from "gray-matter";
import {
  GenesisDataSchema,
  IterationDataSchema,
} from "../src/types/schemas";

// --- CLI args ---
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input: { type: "string" },
    output: { type: "string" },
  },
});

if (!values.input) {
  console.error("Error: --input is required");
  process.exit(1);
}

const inputDir = values.input.replace(/\/$/, ""); // strip trailing slash
const outputPath = values.output;

// --- Validate input directory ---
if (!existsSync(inputDir)) {
  console.error(`Error: Directory not found: ${inputDir}`);
  process.exit(1);
}

// --- Validate directory name format ---
const dirName = basename(inputDir);
const nnnMatch = dirName.match(/^(\d{3})-/);
if (!nnnMatch) {
  console.error(
    `Error: Directory name must start with NNN- format: ${dirName}`
  );
  process.exit(1);
}
const nnn = nnnMatch[1];
const isGenesis = nnn === "000";

// --- Validate required files ---
const requiredFiles = ["proposal.md", "tasks.md", "spec-delta.md"] as const;
for (const file of requiredFiles) {
  const filePath = join(inputDir, file);
  if (!existsSync(filePath)) {
    console.error(`Error: Required file not found: ${filePath}`);
    process.exit(1);
  }
}

// --- Read and parse files ---
const proposalRaw = await Bun.file(join(inputDir, "proposal.md")).text();
const tasksRaw = await Bun.file(join(inputDir, "tasks.md")).text();
const specDeltaRaw = await Bun.file(join(inputDir, "spec-delta.md")).text();

const proposal = matter(proposalRaw);
const tasksMd = matter(tasksRaw);
const specDelta = matter(specDeltaRaw);

// --- Helpers ---

/** Extract first H1 title from markdown content */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "Untitled";
}

/** Extract the first paragraph after a heading or the Project Purpose section */
function extractTagline(content: string): string {
  // Try to find Project Purpose section
  const purposeMatch = content.match(
    /##\s+Project Purpose\s*\n+([\s\S]*?)(?=\n##|\n---|\Z)/
  );
  if (purposeMatch) {
    const firstLine = purposeMatch[1].trim().split("\n")[0];
    if (firstLine) return firstLine;
  }
  // Fallback: first paragraph after first heading
  const paraMatch = content.match(/^#.+\n+(.+)/m);
  return paraMatch?.[1]?.trim() ?? "";
}

/** Extract principles from markdown table format: | # | **title** — desc | reason | */
function extractPrinciples(
  content: string
): Array<{ title: string; description: string }> {
  const principles: Array<{ title: string; description: string }> = [];

  // Match table rows with principle data: | N | **title** — description | why |
  const tableRows = content.matchAll(
    /\|\s*\d+\s*\|\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+?)\s*\|\s*(.+?)\s*\|/g
  );
  for (const match of tableRows) {
    principles.push({
      title: match[1].trim(),
      description: match[2].trim(),
    });
  }

  if (principles.length > 0) return principles;

  // Fallback: numbered list items
  const listItems = content.matchAll(/^\d+\.\s+\*\*(.+?)\*\*[:\s]*(.+)$/gm);
  for (const match of listItems) {
    principles.push({
      title: match[1].trim(),
      description: match[2].trim(),
    });
  }

  return principles;
}

/** Extract target users from content */
function extractTargetUsers(content: string): string[] {
  // Look for target user mentions in Project Purpose or user-related sections
  const users: string[] = [];

  // Pattern: "目標用戶：A、B、C" or "目標用戶: A, B, C"
  const targetMatch = content.match(/目標用戶[：:]\s*(.+?)(?:\.|。|\n)/);
  if (targetMatch) {
    return targetMatch[1].split(/[、,]/).map((u) => u.trim()).filter(Boolean);
  }

  // Pattern: "**誰**: user type" from user stories
  const whoMatches = content.matchAll(/\*\*誰\*\*:\s*(.+)/g);
  for (const match of whoMatches) {
    const userTypes = match[1]
      .split(/[/、,]/)
      .map((u) => u.trim())
      .filter(Boolean);
    for (const u of userTypes) {
      if (!users.includes(u)) users.push(u);
    }
  }

  return users.length > 0 ? users : ["Developer"];
}

/** Extract architecture modules from plan/spec-delta markdown */
function extractArchitecture(content: string): {
  title: string;
  modules: Array<{
    id: string;
    label: string;
    description?: string;
    category: "core" | "api" | "data" | "ui" | "infra" | "external";
    position: { row: number; col: number };
  }>;
  connections: Array<{ from: string; to: string; label?: string }>;
} {
  const title = extractTitle(content) || "System Architecture";

  // Try to find module definitions in the content
  // Look for patterns like: module_id (category) or structured architecture section
  const modules: Array<{
    id: string;
    label: string;
    description?: string;
    category: "core" | "api" | "data" | "ui" | "infra" | "external";
    position: { row: number; col: number };
  }> = [];

  // Look for project structure to infer modules
  const structureMatch = content.match(
    /```[\s\S]*?(src\/[\s\S]*?)```/
  );

  if (structureMatch) {
    const structure = structureMatch[1];
    const categories: Record<string, "core" | "api" | "data" | "ui" | "infra" | "external"> = {
      types: "core",
      templates: "core",
      components: "ui",
      styles: "ui",
      data: "data",
      scripts: "infra",
    };

    const dirMatches = structure.matchAll(
      /├──\s+(\w+)\//g
    );
    let idx = 0;
    for (const match of dirMatches) {
      const dirName = match[1];
      const category = categories[dirName] ?? "core";
      modules.push({
        id: dirName,
        label: dirName.charAt(0).toUpperCase() + dirName.slice(1),
        category,
        position: { row: Math.floor(idx / 3), col: idx % 3 },
      });
      idx++;
    }
  }

  // If no modules found, provide a minimal default
  if (modules.length === 0) {
    modules.push({
      id: "core",
      label: "Core",
      category: "core",
      position: { row: 0, col: 1 },
    });
  }

  return { title, modules, connections: [] };
}

/** Extract task summary from tasks markdown */
function extractTaskSummary(
  content: string
): { total: number; categories: Array<{ name: string; count: number }> } {
  const categories: Map<string, number> = new Map();
  let total = 0;

  // Count tasks by phase/section headers
  const sections = content.split(/^##\s+/m).filter(Boolean);
  for (const section of sections) {
    const sectionTitle = section.split("\n")[0].trim();
    // Count task items: lines starting with - [ ] or - [x]
    const taskLines = section.match(/^- \[[ x]\]/gm);
    if (taskLines && taskLines.length > 0) {
      // Clean up section title (remove "Phase N: " prefix)
      const cleanTitle = sectionTitle
        .replace(/^Phase\s+\d+:\s*/, "")
        .replace(/\s*🎯.*$/, "")
        .trim();
      if (cleanTitle) {
        categories.set(cleanTitle, taskLines.length);
        total += taskLines.length;
      }
    }
  }

  // Fallback: count all task-like lines
  if (total === 0) {
    const allTasks = content.match(/^- \[[ x]\]/gm);
    total = allTasks?.length ?? 0;
    if (total > 0) {
      categories.set("Tasks", total);
    }
  }

  return {
    total,
    categories: Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count,
    })),
  };
}

/** Extract iteration tasks from tasks markdown */
function extractIterationTasks(
  content: string
): Array<{ id: string; title: string; status: "completed" | "skipped" }> {
  const tasks: Array<{
    id: string;
    title: string;
    status: "completed" | "skipped";
  }> = [];

  // Match task lines: - [x] T-NNN description OR - [ ] T-NNN description
  const taskMatches = content.matchAll(
    /^- \[([ x])\]\s+(T-\d+)?\s*(?:\[.*?\])?\s*(.+)$/gm
  );
  for (const match of taskMatches) {
    const checked = match[1] === "x";
    const id = match[2] ?? `task-${tasks.length + 1}`;
    const title = match[3]
      .replace(/\s*—\s*.+$/, "") // remove description after em dash
      .replace(/\s*\*\*禁止修改\*\*.*$/, "") // remove constraints
      .trim();
    tasks.push({
      id,
      title,
      status: checked ? "completed" : "skipped",
    });
  }

  return tasks;
}

/** Extract a summary string from proposal content */
function extractSummary(content: string): string {
  const purposeMatch = content.match(
    /##\s+(?:Project Purpose|Summary|摘要)\s*\n+([\s\S]*?)(?=\n##|\n---)/
  );
  if (purposeMatch) {
    return purposeMatch[1].trim().split("\n")[0] ?? "";
  }
  // Fallback: first meaningful paragraph
  const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  return lines[0]?.trim() ?? "";
}

/** Extract motivation from proposal */
function extractMotivation(content: string): string {
  const motMatch = content.match(
    /##\s+(?:Motivation|動機|Why|背景)\s*\n+([\s\S]*?)(?=\n##|\n---)/
  );
  if (motMatch) return motMatch[1].trim().split("\n")[0] ?? "";
  return extractSummary(content);
}

/** Extract spec diff from spec-delta */
function extractSpecDiff(content: string): { before: string; after: string } {
  // Look for before/after sections
  const beforeMatch = content.match(
    /##\s+(?:Before|之前|原始)\s*\n+([\s\S]*?)(?=\n##|\n---)/
  );
  const afterMatch = content.match(
    /##\s+(?:After|之後|變更後)\s*\n+([\s\S]*?)(?=\n##|\n---)/
  );

  if (beforeMatch && afterMatch) {
    return { before: beforeMatch[1].trim(), after: afterMatch[1].trim() };
  }

  // Fallback: use direction summary or first section as "after"
  const summaryMatch = content.match(
    /##\s+方向摘要\s*\n+([\s\S]*?)(?=\n##|\n---)/
  );
  return {
    before: "(initial state)",
    after: summaryMatch?.[1]?.trim() ?? content.slice(0, 200).trim(),
  };
}

// --- Build data based on type ---

function outputJson(data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  if (outputPath) {
    Bun.write(outputPath, json);
    console.error(`JSON written to ${outputPath}`);
  } else {
    console.log(json);
  }
}

if (isGenesis) {
  const proposalContent = proposal.content;
  const specDeltaContent = specDelta.content;
  const tasksContent = tasksMd.content;

  const projectName = extractTitle(proposalContent);
  const tagline = extractTagline(proposalContent);
  const principles = extractPrinciples(proposalContent);
  const architecture = extractArchitecture(specDeltaContent);
  const taskSummary = extractTaskSummary(tasksContent);
  const targetUsers = extractTargetUsers(proposalContent);

  const data = {
    type: "genesis" as const,
    projectName,
    tagline,
    principles,
    architecture,
    taskSummary,
    targetUsers,
  };

  const result = GenesisDataSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", JSON.stringify(result.error.issues, null, 2));
    process.exit(1);
  }
  outputJson(result.data);
} else {
  const proposalContent = proposal.content;
  const specDeltaContent = specDelta.content;
  const tasksContent = tasksMd.content;

  const changeName =
    (proposal.data.changeName as string) ??
    dirName.replace(/^\d{3}-/, "").replace(/-/g, " ");
  const summary = extractSummary(proposalContent);
  const motivation = extractMotivation(proposalContent);
  const specDiff = extractSpecDiff(specDeltaContent);
  const tasks = extractIterationTasks(tasksContent);
  const architecture = extractArchitecture(specDeltaContent);
  const coloredModules =
    (proposal.data.coloredModules as string[]) ??
    [];
  const highlightModules =
    (proposal.data.highlightModules as string[]) ??
    [];

  const data = {
    type: "iteration" as const,
    iterationNumber: nnn,
    changeName,
    summary,
    motivation,
    specDiff,
    tasks,
    architecture,
    coloredModules,
    highlightModules,
  };

  const result = IterationDataSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", JSON.stringify(result.error.issues, null, 2));
    process.exit(1);
  }
  outputJson(result.data);
}
