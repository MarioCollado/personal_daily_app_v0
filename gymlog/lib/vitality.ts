import type { DailyMetrics, Exercise, UserProfile, WorkoutWithExercises } from '@/types'

type VitalityInput = {
  profile: UserProfile | null
  metrics: DailyMetrics | null
  recentMetrics: DailyMetrics[]
  recentWorkouts: WorkoutWithExercises[]
  todayExercises: Exercise[]
  hasWorkout: boolean
}

type VitalityBreakdown = {
  effort: number
  recovery: number
  balanceModifier: number
  fatiguePenalty: number
  readiness: number
  confidence: number
}

export type VitalityResult = {
  score: number
  hint: string
  breakdown: VitalityBreakdown
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

function normalize(value: number | null | undefined, min: number, max: number) {
  if (value == null) return null
  if (max === min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => value != null)
  if (!filtered.length) return null
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

export function getAgeFactor(age: number | null | undefined) {
  if (!age || age <= 0) return 1
  return 1 + 0.22 * sigmoid((age - 42) / 10)
}

function getAgeFatigueThreshold(age: number | null | undefined) {
  const ageFactor = getAgeFactor(age)
  return clamp(1.15 - (ageFactor - 1) * 0.7, 0.85, 1.15)
}

function getStrengthLoad(exercises: Exercise[]) {
  let volume = 0

  for (const exercise of exercises) {
    for (const set of exercise.sets || []) {
      if (set.distance_km != null || set.duration_seconds != null) continue
      volume += Math.max(set.reps || 0, 0) * Math.max(set.weight || 0, 0)
    }
  }

  return volume
}

function getCardioLoad(exercises: Exercise[]) {
  let load = 0

  for (const exercise of exercises) {
    for (const set of exercise.sets || []) {
      if (set.distance_km == null || set.duration_seconds == null || set.duration_seconds <= 0) continue
      const distance = Math.max(set.distance_km, 0)
      const minutes = set.duration_seconds / 60
      if (distance <= 0 || minutes <= 0) continue

      const pace = minutes / distance
      const paceFactor = clamp(9 / pace, 0.55, 1.55)
      load += distance * 8 * paceFactor
    }
  }

  return load
}

function getWorkoutLoad(exercises: Exercise[], weight: number | null | undefined) {
  const bodyWeight = weight && weight > 0 ? weight : 75
  const relativeStrength = getStrengthLoad(exercises) / bodyWeight
  const cardioLoad = getCardioLoad(exercises)
  const combined = Math.log1p(relativeStrength) * 16 + Math.log1p(cardioLoad) * 12
  return clamp(combined, 0, 100)
}

function getMetricReadiness(metrics: DailyMetrics | null) {
  if (!metrics) return 0.5

  const sleepScore = (() => {
    if (metrics.sleep_hours == null) return null
    const distance = Math.abs(metrics.sleep_hours - 8)
    return clamp(1 - distance / 4, 0.15, 1)
  })()

  const energyScore = normalize(metrics.energy, 1, 5)
  const motivationScore = normalize(metrics.motivation, 1, 5)
  const normalizedStress = normalize(metrics.stress, 1, 5)
  const stressScore = normalizedStress == null ? null : 1 - normalizedStress
  const freeTimeScore = normalize(metrics.free_time, 1, 5)

  return average([sleepScore, energyScore, motivationScore, stressScore, freeTimeScore]) ?? 0.5
}

export function getRecoveryScore(metrics: DailyMetrics | null) {
  const readiness = getMetricReadiness(metrics)
  return clamp(25 + readiness * 45, 20, 70)
}

function getHistoricalLoadAverage(recentWorkouts: WorkoutWithExercises[], weight: number | null | undefined) {
  if (!recentWorkouts.length) return null
  const loads = recentWorkouts.map(workout => getWorkoutLoad(workout.exercises || [], weight))
  return average(loads)
}

export function getIntensityScore(exercises: Exercise[], profile: UserProfile | null, recentWorkouts: WorkoutWithExercises[]) {
  if (!exercises.length) return 12

  const todayLoad = getWorkoutLoad(exercises, profile?.weight)
  const baselineLoad = getHistoricalLoadAverage(recentWorkouts, profile?.weight)

  if (baselineLoad == null || baselineLoad < 8) {
    return clamp(18 + todayLoad * 0.45, 18, 72)
  }

  const relativeDelta = (todayLoad - baselineLoad) / Math.max(baselineLoad, 12)
  const contextualBoost = 18 * sigmoid(relativeDelta * 2.2) - 9

  return clamp(32 + todayLoad * 0.22 + contextualBoost, 18, 78)
}

export function getBalanceModifier(effort: number, recovery: number) {
  const balance = (recovery - effort) / 18
  return clamp(0.68 + sigmoid(balance) * 0.58, 0.68, 1.26)
}

function getRecentSleepDebt(recentMetrics: DailyMetrics[]) {
  return recentMetrics.reduce((sum, metric) => {
    const sleep = metric.sleep_hours
    if (sleep == null) return sum
    return sum + Math.max(0, 7 - sleep)
  }, 0)
}

function getHeavyDayStreak(recentWorkouts: WorkoutWithExercises[], weight: number | null | undefined, thresholdMultiplier: number) {
  if (!recentWorkouts.length) return 0

  const loads = recentWorkouts
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(workout => getWorkoutLoad(workout.exercises || [], weight))

  const baseline = average(loads) ?? 0
  const heavyThreshold = Math.max(18, baseline * thresholdMultiplier)

  let streak = 0
  for (const load of loads) {
    if (load >= heavyThreshold) streak += 1
    else break
  }

  return streak
}

function getRecoveryCoherencePenalty(metrics: DailyMetrics | null, effort: number) {
  if (!metrics) return 0

  const stressPenalty = metrics.stress != null && metrics.stress >= 4 ? 4 + (metrics.stress - 4) * 2.5 : 0
  const sleepPenalty = metrics.sleep_hours != null && metrics.sleep_hours < 6 ? (6 - metrics.sleep_hours) * 3.2 : 0
  const mismatch = effort > 55 ? (stressPenalty + sleepPenalty) * 0.65 : 0

  return mismatch
}

export function getFatiguePenalty(
  recentMetrics: DailyMetrics[],
  recentWorkouts: WorkoutWithExercises[],
  profile: UserProfile | null,
  effort: number,
  metrics: DailyMetrics | null
) {
  const thresholdMultiplier = getAgeFatigueThreshold(profile?.age)
  const sleepDebt = getRecentSleepDebt(recentMetrics)
  const heavyStreak = getHeavyDayStreak(recentWorkouts, profile?.weight, thresholdMultiplier)
  const coherencePenalty = getRecoveryCoherencePenalty(metrics, effort)

  const debtPenalty = Math.pow(clamp(sleepDebt / 5, 0, 3), 1.25) * 4.5
  const streakPenalty = heavyStreak <= 1 ? 0 : Math.pow(heavyStreak - 1, 1.3) * 3.8

  return clamp(debtPenalty + streakPenalty + coherencePenalty, 0, 24)
}

function getConfidence(input: VitalityInput) {
  let points = 0.35
  if (input.profile?.weight) points += 0.15
  if (input.profile?.age) points += 0.1
  if (input.metrics?.sleep_hours != null) points += 0.15
  if (input.metrics?.stress != null) points += 0.1
  if (input.recentMetrics.length >= 4) points += 0.1
  if (input.recentWorkouts.length >= 3) points += 0.15
  return clamp(points, 0.35, 1)
}

function getHint(breakdown: VitalityBreakdown, hasWorkout: boolean) {
  if (breakdown.confidence < 0.55) {
    return 'Estimacion suave: falta algo de historial o perfil.'
  }

  if (!hasWorkout && breakdown.recovery >= 52) {
    return 'Buen dia de descarga: la recuperacion esta empujando el score.'
  }

  if (breakdown.fatiguePenalty >= 14) {
    return 'Fatiga acumulada detectada: conviene bajar carga o priorizar descanso.'
  }

  if (breakdown.balanceModifier < 0.9) {
    return 'La carga de hoy supera tu recuperacion reciente.'
  }

  if (breakdown.balanceModifier > 1.08) {
    return 'Buen equilibrio entre carga y recuperacion.'
  }

  return 'Dia estable: el score refleja consistencia mas que picos.'
}

export function computeVitalityScore(input: VitalityInput): VitalityResult {
  const ageFactor = getAgeFactor(input.profile?.age)
  const readiness = getMetricReadiness(input.metrics)
  const effort = input.hasWorkout
    ? getIntensityScore(input.todayExercises, input.profile, input.recentWorkouts)
    : clamp(10 + readiness * 14, 10, 24)
  const recovery = getRecoveryScore(input.metrics)
  const balanceModifier = getBalanceModifier(effort, recovery)
  const fatiguePenalty = getFatiguePenalty(
    input.recentMetrics,
    input.recentWorkouts,
    input.profile,
    effort,
    input.metrics
  )
  const confidence = getConfidence(input)
  const baseScore = clamp(recovery * 0.7 + effort * 0.55, 18, 92)
  const finalScore = clamp(Math.round(baseScore * balanceModifier * ageFactor - fatiguePenalty), 0, 100)

  const breakdown: VitalityBreakdown = {
    effort: Math.round(effort),
    recovery: Math.round(recovery),
    balanceModifier: Number(balanceModifier.toFixed(2)),
    fatiguePenalty: Math.round(fatiguePenalty),
    readiness: Number(readiness.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
  }

  return {
    score: finalScore,
    hint: getHint(breakdown, input.hasWorkout),
    breakdown,
  }
}
