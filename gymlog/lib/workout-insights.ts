import type { ExtendedBodyPart, Slug } from '@mjcdev/react-body-highlighter'
import type { Exercise, Set, Workout, WorkoutWithExercises } from '@/types'

export type SparklineMetric = 'load' | 'sessions'
export type SparklineRange = '7d' | '4w'

export type WorkoutHistoryWithExercises = Workout & {
  exercises?: Exercise[]
}

export type SparklinePoint = {
  id: string
  label: string
  shortLabel: string
  value: number
  isCurrent: boolean
}

export type MuscleActivationLevel = 'low' | 'medium' | 'high'

export type MuscleActivation = {
  slug: Slug
  intensity: 1 | 2 | 3
  normalized: number
  raw: number
  level: MuscleActivationLevel
  label: string
}

type Distribution = Array<{ slug: Slug; weight: number }>

const MUSCLE_GROUP_ALIASES: Record<string, string> = {
  chest: 'chest',
  pecho: 'chest',
  back: 'back',
  espalda: 'back',
  legs: 'legs',
  piernas: 'legs',
  shoulders: 'shoulders',
  hombros: 'shoulders',
  biceps: 'biceps',
  'bíceps': 'biceps',
  triceps: 'triceps',
  'tríceps': 'triceps',
  core: 'core',
  glutes: 'glutes',
  'glúteos': 'glutes',
  gluteos: 'glutes',
  cardio: 'cardio',
}

const MUSCLE_DISTRIBUTION: Record<string, Distribution> = {
  chest: [{ slug: 'chest', weight: 1 }],
  back: [
    { slug: 'upper-back', weight: 0.45 },
    { slug: 'lower-back', weight: 0.2 },
    { slug: 'trapezius', weight: 0.35 },
  ],
  legs: [
    { slug: 'quadriceps', weight: 0.3 },
    { slug: 'hamstring', weight: 0.25 },
    { slug: 'adductors', weight: 0.15 },
    { slug: 'calves', weight: 0.15 },
    { slug: 'tibialis', weight: 0.15 },
  ],
  shoulders: [
    { slug: 'deltoids', weight: 0.8 },
    { slug: 'trapezius', weight: 0.2 },
  ],
  biceps: [
    { slug: 'biceps', weight: 0.75 },
    { slug: 'forearm', weight: 0.25 },
  ],
  triceps: [
    { slug: 'triceps', weight: 0.78 },
    { slug: 'forearm', weight: 0.22 },
  ],
  core: [
    { slug: 'abs', weight: 0.6 },
    { slug: 'obliques', weight: 0.3 },
    { slug: 'lower-back', weight: 0.1 },
  ],
  glutes: [{ slug: 'gluteal', weight: 1 }],
  cardio: [
    { slug: 'quadriceps', weight: 0.24 },
    { slug: 'hamstring', weight: 0.2 },
    { slug: 'gluteal', weight: 0.18 },
    { slug: 'calves', weight: 0.18 },
    { slug: 'tibialis', weight: 0.12 },
    { slug: 'abs', weight: 0.08 },
  ],
}

const BODY_PART_LABELS: Record<Slug, string> = {
  trapezius: 'Trapecio',
  triceps: 'Triceps',
  forearm: 'Antebrazo',
  adductors: 'Aductores',
  calves: 'Gemelos',
  hair: 'Cabello',
  neck: 'Cuello',
  deltoids: 'Hombros',
  hands: 'Manos',
  feet: 'Pies',
  head: 'Cabeza',
  ankles: 'Tobillos',
  tibialis: 'Tibial',
  obliques: 'Oblicuos',
  chest: 'Pecho',
  biceps: 'Biceps',
  abs: 'Core',
  quadriceps: 'Cuadriceps',
  knees: 'Rodillas',
  'upper-back': 'Espalda alta',
  'lower-back': 'Espalda baja',
  hamstring: 'Isquios',
  gluteal: 'Gluteos',
}

function safeDate(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

function getWeekStart(date: Date) {
  const next = new Date(date)
  const day = next.getDay()
  const diff = (day + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatWeekLabel(date: Date) {
  return `Semana del ${date.getDate()}/${date.getMonth() + 1}`
}

function getStrengthStimulus(sets: Set[]) {
  return sets.reduce((sum, set) => {
    if (set.distance_km != null || set.duration_seconds != null) return sum
    const repsScore = clamp((set.reps || 0) / 10, 0.45, 2.4)
    const loadScore = clamp((set.weight || 0) / 35, 0, 1.9)
    return sum + repsScore + loadScore * 0.35
  }, 0)
}

function getCardioStimulus(sets: Set[]) {
  return sets.reduce((sum, set) => {
    const minutes = (set.duration_seconds || 0) / 60
    const distance = set.distance_km || 0
    if (minutes <= 0 && distance <= 0) return sum
    return sum + minutes / 8 + distance * 0.8
  }, 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeMuscleGroup(muscleGroup: string | null | undefined) {
  if (!muscleGroup) return null
  const key = muscleGroup.trim().toLowerCase()
  return MUSCLE_GROUP_ALIASES[key] || key
}

export function getExerciseStimulus(exercise: Exercise) {
  const sets = exercise.sets || []
  if (!sets.length) return 0
  const group = normalizeMuscleGroup(exercise.muscle_group)
  if (group === 'cardio') return getCardioStimulus(sets)
  return getStrengthStimulus(sets)
}

export function getWorkoutLoadValue(exercises: Exercise[]) {
  if (!exercises.length) return 0
  const total = exercises.reduce((sum, exercise) => sum + getExerciseStimulus(exercise), 0)
  return Math.round(total)
}

export function buildMuscleActivation(exercises: Exercise[]): MuscleActivation[] {
  if (!exercises.length) return []

  const rawBySlug = new Map<Slug, number>()

  for (const exercise of exercises) {
    const group = normalizeMuscleGroup(exercise.muscle_group)
    if (!group) continue
    const distribution = MUSCLE_DISTRIBUTION[group]
    if (!distribution) continue

    // Keep muscle map responsive as soon as an exercise is added,
    // even if the user has not logged sets yet.
    const baseStimulus = getExerciseStimulus(exercise)
    const stimulus = baseStimulus > 0 ? baseStimulus : (exercise.sets?.length ? 0 : 0.65)
    if (stimulus <= 0) continue

    for (const target of distribution) {
      rawBySlug.set(target.slug, (rawBySlug.get(target.slug) || 0) + stimulus * target.weight)
    }
  }

  const values = Array.from(rawBySlug.values())
  const maxRaw = Math.max(...values, 0)
  if (maxRaw <= 0) return []

  return Array.from(rawBySlug.entries())
    .map(([slug, raw]) => {
      const normalized = clamp(raw / maxRaw, 0, 1)
      const intensity: 1 | 2 | 3 = normalized >= 0.72 ? 3 : normalized >= 0.38 ? 2 : 1
      const level: MuscleActivationLevel = intensity === 3 ? 'high' : intensity === 2 ? 'medium' : 'low'

      return {
        slug,
        intensity,
        normalized,
        raw,
        level,
        label: BODY_PART_LABELS[slug] || slug,
      }
    })
    .sort((a, b) => b.raw - a.raw)
}

export function getBodyHighlighterData(exercises: Exercise[]): ExtendedBodyPart[] {
  return buildMuscleActivation(exercises).map(item => ({
    slug: item.slug,
    intensity: item.intensity,
  }))
}

export function aggregateWorkoutSparkline(
  workouts: WorkoutHistoryWithExercises[],
  currentDate: string,
  metric: SparklineMetric,
  range: SparklineRange
): SparklinePoint[] {
  const current = safeDate(currentDate)
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

  if (range === '7d') {
    const start = new Date(current)
    start.setDate(start.getDate() - 6)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const workoutsForDay = sorted.filter(item => item.date === iso)
      const value = metric === 'sessions'
        ? workoutsForDay.length
        : workoutsForDay.reduce((sum, workout) => sum + getWorkoutLoadValue(workout.exercises || []), 0)

      return {
        id: iso,
        label: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
        shortLabel: date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3),
        value,
        isCurrent: iso === currentDate,
      }
    })
  }

  const currentWeekStart = getWeekStart(current)
  const weekStarts = Array.from({ length: 4 }, (_, index) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() - (3 - index) * 7)
    return d
  })

  return weekStarts.map((weekStart, index) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const workoutsForWeek = sorted.filter(item => {
      const date = safeDate(item.date)
      return date >= weekStart && date <= weekEnd
    })

    const value = metric === 'sessions'
      ? workoutsForWeek.length
      : workoutsForWeek.reduce((sum, workout) => sum + getWorkoutLoadValue(workout.exercises || []), 0)

    return {
      id: `week-${index}`,
      label: formatWeekLabel(weekStart),
      shortLabel: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      value,
      isCurrent: index === weekStarts.length - 1,
    }
  })
}

export function getTopActivatedMuscle(exercises: Exercise[]) {
  return buildMuscleActivation(exercises)[0] || null
}

export function getMuscleLevelLabel(level: MuscleActivationLevel) {
  if (level === 'high') return 'Alto'
  if (level === 'medium') return 'Medio'
  return 'Bajo'
}

export const MOCK_WORKOUT_HISTORY: WorkoutHistoryWithExercises[] = [
  { id: 'w1', user_id: 'demo', date: '2026-04-02', name: 'Push', created_at: '', started_at: null, finished_at: null, exercises: [] },
  { id: 'w2', user_id: 'demo', date: '2026-04-07', name: 'Pull', created_at: '', started_at: null, finished_at: null, exercises: [] },
  { id: 'w3', user_id: 'demo', date: '2026-04-14', name: 'Legs', created_at: '', started_at: null, finished_at: null, exercises: [] },
  { id: 'w4', user_id: 'demo', date: '2026-04-22', name: 'Upper', created_at: '', started_at: null, finished_at: null, exercises: [] },
]
