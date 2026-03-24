import type { ModuleCategory } from "../types/schemas";

export const MODULE_COLORS: Record<
  ModuleCategory,
  { base: string; light: string }
> = {
  core: { base: "#3B82F6", light: "#93C5FD" },
  api: { base: "#10B981", light: "#6EE7B7" },
  data: { base: "#F59E0B", light: "#FCD34D" },
  ui: { base: "#8B5CF6", light: "#C4B5FD" },
  infra: { base: "#6B7280", light: "#D1D5DB" },
  external: { base: "#92400E", light: "#D97706" },
} as const;

export const GRAY = { base: "#E5E7EB", light: "#F3F4F6" } as const;

export const THEME = {
  bg: "#0F172A",
  text: "#F8FAFC",
  accent: "#3B82F6",
  success: "#10B981",
  danger: "#EF4444",
  muted: "#64748B",
} as const;
