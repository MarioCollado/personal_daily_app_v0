export const colors = {
  brand: "#22c55e",
  brandHover: "#16a34a",
  amber: "#f59e0b",
  orange: "#f97316",
  yellow: "#eab308",
  red: "#ef4444",
  blue: "#3b82f6",
  violet: "#a855f7",
  zinc: "#3f3f46",
  surface: {
    0: "#0a0a0a",
    1: "#111111",
    2: "#1a1a1a",
    3: "#242424",
    4: "#2e2e2e",
    border: "#333333",
  },
} as const;

export const sleepThresholds = [
  { max: 5, color: colors.red, label: "Insuficiente" },
  { max: 6.5, color: colors.orange, label: "Poco" },
  { max: 7.5, color: colors.yellow, label: "Regular" },
  { max: 9, color: colors.brand, label: "Óptimo" },
  { max: Infinity, color: colors.blue, label: "Largo" },
] as const;

export function getSleepColor(h: number | null): string {
  if (h === null) return colors.zinc;
  return sleepThresholds.find((t) => h < t.max)?.color ?? colors.blue;
}

export function getSleepLabel(h: number | null): string {
  if (h === null) return "—";
  return sleepThresholds.find((t) => h < t.max)?.label ?? "Largo";
}

export const metricColors = {
  energy: colors.amber,
  stress: colors.red,
  motivation: colors.brand,
} as const;

export const gradeThresholds = [
  { min: 85, grade: "S", color: "#a3e635" },
  { min: 70, grade: "A", color: "#22c55e" },
  { min: 55, grade: "B", color: "#facc15" },
  { min: 1, grade: "D", color: "#ef4444" },
  { min: 0, grade: "—", color: colors.zinc },
] as const;

export function getGrade(score: number): { grade: string; color: string } {
  return (
    gradeThresholds.find((t) => score >= t.min) ?? {
      grade: "—",
      color: colors.zinc,
    }
  );
}

export const muscleGroupColors: Record<string, { bg: string; text: string }> = {
  pecho: { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  espalda: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
  piernas: { bg: "rgba(168,85,247,0.15)", text: "#d8b4fe" },
  hombros: { bg: "rgba(249,115,22,0.15)", text: "#fdba74" },
  biceps: { bg: "rgba(234,179,8,0.15)", text: "#fde047" },
  triceps: { bg: "rgba(6,182,212,0.15)", text: "#67e8f9" },
  core: { bg: "rgba(34,197,94,0.15)", text: "#86efac" },
  gluteos: { bg: "rgba(236,72,153,0.15)", text: "#f9a8d4" },
  cardio: { bg: "rgba(14,165,233,0.15)", text: "#7dd3fc" },
};

export function getMuscleGroupStyle(group?: string | null): {
  bg: string;
  text: string;
} {
  if (!group) return { bg: "rgba(113,113,122,0.15)", text: "#a1a1aa" };
  const normalized = group
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    muscleGroupColors[normalized] ?? {
      bg: "rgba(113,113,122,0.15)",
      text: "#a1a1aa",
    }
  );
}

export const sleepDial = {
  min: 3,
  max: 12,
  startDeg: 150,
  totalDeg: 240,
  cx: 60,
  cy: 60,
  r: 46,
  strokeWidth: 8,
} as const;
