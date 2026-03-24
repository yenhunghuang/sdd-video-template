import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
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
    audience: { type: "string" },
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

/** 從 motivation 提取業務影響（取第一句） */
function extractBusinessImpact(motivation: string): string {
  const firstSentence = motivation.split(/[。.！!？?]/)[0];
  return firstSentence?.trim() || motivation;
}

/** 從 specDiff 產出業務版（初版直接複製） */
function extractBusinessSpecDiff(specDiff: { before: string; after: string }): { before: string; after: string } {
  return { ...specDiff };
}

/** 從 tasks 產出業務版（移除技術前綴） */
function extractBusinessTasks(
  tasks: Array<{ id: string; title: string; status: "completed" | "skipped" }>
): Array<{ id: string; title: string; status: "completed" | "skipped" }> {
  return tasks.map((t) => ({
    ...t,
    title: t.title
      .replace(/^(?:Setup|Implement|Add|Configure|Create|Install|Initialize|Refactor|Update|Fix)\s+/i, "完成：")
      .trim(),
  }));
}

// --- Build data based on type ---

function outputJson(data: unknown, output: string | undefined): void {
  const json = JSON.stringify(data, null, 2);
  if (output) {
    Bun.write(output, json);
    console.error(`JSON written to ${output}`);
  } else {
    console.log(json);
  }
}

async function parseSingleDir(
  dir: string,
  output: string | undefined,
  overrideIterationNumber?: string
): Promise<void> {
  const dn = basename(dir);
  const nnn = dn.match(/^(\d{3})-/);
  const date = dn.match(/^(\d{4}-\d{2}-\d{2})-/);
  const specKit = !!nnn;
  const openSpec = !!date;

  if (!specKit && !openSpec) {
    console.error(
      `Error: Directory name must start with NNN- (SpecKit) or YYYY-MM-DD- (OpenSpec) format: ${dn}`
    );
    process.exit(1);
  }

  const genesis = specKit && nnn![1] === "000";

  const sf = openSpec ? "design.md" : "spec-delta.md";
  const required = ["proposal.md", "tasks.md", sf];
  for (const file of required) {
    const filePath = join(dir, file);
    if (!existsSync(filePath)) {
      console.error(`Error: Required file not found: ${filePath}`);
      process.exit(1);
    }
  }

  const proposalRaw = await Bun.file(join(dir, "proposal.md")).text();
  const tasksRaw = await Bun.file(join(dir, "tasks.md")).text();
  const specDeltaRaw = await Bun.file(join(dir, sf)).text();

  const proposal = matter(proposalRaw);
  const tasksMd = matter(tasksRaw);
  const specDelta = matter(specDeltaRaw);

  if (genesis) {
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
    outputJson(result.data, output);
  } else {
    const proposalContent = proposal.content;
    const specDeltaContent = specDelta.content;
    const tasksContent = tasksMd.content;

    const changeName = specKit
      ? ((proposal.data.changeName as string) ?? dn.replace(/^\d{3}-/, "").replace(/-/g, " "))
      : ((proposal.data.changeName as string) ?? dn.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " "));
    const summary = extractSummary(proposalContent);
    const motivation = extractMotivation(proposalContent);
    const specDiff = extractSpecDiff(specDeltaContent);
    const tasks = extractIterationTasks(tasksContent);
    const architecture = extractArchitecture(specDeltaContent);
    const coloredModules =
      (proposal.data.coloredModules as string[]) ?? [];
    const highlightModules =
      (proposal.data.highlightModules as string[]) ?? [];

    const iterationNumber = overrideIterationNumber
      ?? (specKit ? nnn![1] : "001");

    const businessImpact = (proposal.data.businessImpact as string) ?? extractBusinessImpact(motivation);
    const businessSpecDiff = (proposal.data.businessSpecDiff as { before: string; after: string }) ?? extractBusinessSpecDiff(specDiff);
    const businessTasks = extractBusinessTasks(tasks);

    const data = {
      type: "iteration" as const,
      iterationNumber,
      changeName,
      summary,
      motivation,
      specDiff,
      tasks,
      architecture,
      coloredModules,
      highlightModules,
      ...(values.audience ? { audience: values.audience } : {}),
      businessImpact,
      businessSpecDiff,
      businessTasks,
    };

    const result = IterationDataSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", JSON.stringify(result.error.issues, null, 2));
      process.exit(1);
    }
    outputJson(result.data, output);
  }
}

// --- Check for batch mode ---
const entries = readdirSync(inputDir).filter((e) => {
  const fullPath = join(inputDir, e);
  return (
    statSync(fullPath).isDirectory() &&
    (/^\d{3}-/.test(e) || /^\d{4}-\d{2}-\d{2}-/.test(e))
  );
});

const isBatch = entries.length > 0;

if (isBatch) {
  // Separate genesis and iteration directories
  const genesisEntries = entries.filter((e) => /^000-/.test(e));
  const iterEntries = entries.filter((e) => !/^000-/.test(e));

  // Sort iteration entries
  iterEntries.sort((a, b) => {
    const aNum = a.match(/^(\d{3})-/);
    const bNum = b.match(/^(\d{3})-/);
    if (aNum && bNum) return aNum[1].localeCompare(bNum[1]);
    // OpenSpec: sort by date string
    return a.localeCompare(b);
  });

  if (!outputPath) {
    console.error("Error: --output directory is required for batch mode");
    process.exit(1);
  }

  mkdirSync(outputPath, { recursive: true });

  // Parse genesis
  for (const entry of genesisEntries) {
    await parseSingleDir(
      join(inputDir, entry),
      join(outputPath, "genesis.json")
    );
  }

  // Parse iterations with auto-incrementing numbers
  for (let i = 0; i < iterEntries.length; i++) {
    const num = String(i + 1).padStart(3, "0");
    await parseSingleDir(
      join(inputDir, iterEntries[i]),
      join(outputPath, `iteration-${num}.json`),
      num
    );
  }

  console.error(
    `Batch complete: ${genesisEntries.length} genesis + ${iterEntries.length} iterations`
  );
  process.exit(0);
} else {
  await parseSingleDir(inputDir, outputPath);
}
