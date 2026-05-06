export type ThemePeriod =
  | "morning"
  | "midday"
  | "afternoon"
  | "night"
  | "sober";

export interface ThemeColors {
  brand: string;
  brandForeground: string;
  surface0: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surfaceBorder: string;
  textMain: string;
  textMuted: string;
}

export const themes: Record<ThemePeriod, ThemeColors> = {
  morning: {
    brand: "#22c55e",
    brandForeground: "#052e16",
    surface0: "#f8fafc",
    surface1: "#ffffff",
    surface2: "#f1f5f9",
    surface3: "#e2e8f0",
    surfaceBorder: "#e2e8f0",
    textMain: "#0f172a",
    textMuted: "#64748b",
  },
  midday: {
    brand: "#10b981",
    brandForeground: "#064e3b",
    surface0: "#ffffff",
    surface1: "#f3f4f6",
    surface2: "#e5e7eb",
    surface3: "#d1d5db",
    surfaceBorder: "#e5e7eb",
    textMain: "#111827",
    textMuted: "#6b7280",
  },
  afternoon: {
    brand: "#f59e0b",
    brandForeground: "#451a03",
    surface0: "#fffbeb",
    surface1: "#fef3c7",
    surface2: "#fde68a",
    surface3: "#fcd34d",
    surfaceBorder: "#fde68a",
    textMain: "#451a03",
    textMuted: "#92400e",
  },
  night: {
    brand: "#fbbf24",
    brandForeground: "#000000",
    surface0: "#0a0b14",
    surface1: "#121421",
    surface2: "#1c1f2e",
    surface3: "#2a2e3f",
    surfaceBorder: "#1c1f2e",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
  },
  sober: {
    brand: "#22c55e",
    brandForeground: "#052e16",
    surface0: "#0a0a0a",
    surface1: "#111111",
    surface2: "#1a1a1a",
    surface3: "#242424",
    surfaceBorder: "#333333",
    textMain: "#ffffff",
    textMuted: "#71717a",
  },
};
