export const colors = {
  brand:   '#22c55e',
  brandHover: '#16a34a',
  amber:   '#f59e0b',
  orange:  '#f97316',
  yellow:  '#eab308',
  red:     '#ef4444',
  blue:    '#3b82f6',
  violet:  '#a855f7',
  zinc:    '#3f3f46',
  surface: {
    0: '#0a0a0a',
    1: '#111111',
    2: '#1a1a1a',
    3: '#242424',
    4: '#2e2e2e',
    border: '#333333',
  },
} as const

export const sleepThresholds = [
  { max: 5,    color: colors.red,    label: 'Insuficiente' },
  { max: 6.5,  color: colors.orange, label: 'Poco'         },
  { max: 7.5,  color: colors.yellow, label: 'Regular'      },
  { max: 9,    color: colors.brand,  label: 'Óptimo'       },
  { max: Infinity, color: colors.blue, label: 'Largo'      },
] as const

export function getSleepColor(h: number | null): string {
  if (h === null) return colors.zinc
  return sleepThresholds.find(t => h < t.max)?.color ?? colors.blue
}

export function getSleepLabel(h: number | null): string {
  if (h === null) return '—'
  return sleepThresholds.find(t => h < t.max)?.label ?? 'Largo'
}

export const metricColors = {
  energy:     colors.amber,
  stress:     colors.red,
  motivation: colors.brand,
} as const

export const gradeThresholds = [
  { min: 85, grade: 'S', color: '#a3e635' },  // lime-400  — matches bg-lime-400/10
  { min: 70, grade: 'A', color: '#22c55e' },  // green-500 — matches bg-green-500/10
  { min: 55, grade: 'B', color: '#facc15' },  // yellow-400 — matches bg-yellow-400/10
  { min: 1,  grade: 'D', color: '#ef4444' },  // red-500   — matches bg-red-500/10
  { min: 0,  grade: '—', color: colors.zinc },
] as const

export function getGrade(score: number): { grade: string; color: string } {
  return gradeThresholds.find(t => score >= t.min) ?? { grade: '—', color: colors.zinc }
}

export const muscleGroupStyles: Record<string, string> = {
  pecho:    'bg-red-500/20 text-red-300',
  espalda:  'bg-blue-500/20 text-blue-300',
  piernas:  'bg-purple-500/20 text-purple-300',
  hombros:  'bg-orange-500/20 text-orange-300',
  bíceps:   'bg-yellow-500/20 text-yellow-300',
  tríceps:  'bg-cyan-500/20 text-cyan-300',
  core:     'bg-green-500/20 text-green-300',
  glúteos:  'bg-pink-500/20 text-pink-300',
  cardio:   'bg-sky-500/20 text-sky-300',
}

export function getMuscleGroupStyle(group?: string | null): string {
  if (!group) return 'bg-zinc-500/20 text-zinc-400'
  return muscleGroupStyles[group.toLowerCase()] ?? 'bg-zinc-500/20 text-zinc-400'
}

export const sleepDial = {
  min: 3,
  max: 12,
  startDeg: 150,   // 7 o'clock en coords SVG estándar
  totalDeg: 240,   // arco total del track
  cx: 60,
  cy: 60,
  r: 46,
  strokeWidth: 8,
} as const
