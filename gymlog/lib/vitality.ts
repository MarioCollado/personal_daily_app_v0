import type { DailyMetrics, Exercise, UserProfile, WorkoutWithExercises, TodayArtsSummary } from '@/types'

type VitalityInput = {
  profile: UserProfile | null
  metrics: DailyMetrics | null
  recentMetrics: DailyMetrics[]
  recentWorkouts: WorkoutWithExercises[]
  todayExercises: Exercise[]
  hasWorkout: boolean
  // Optional Arts summary for the day. Presence enables Arts-based readiness effects.
  artsSummary?: TodayArtsSummary | null
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

// Evidence-informed calibration (high level):
// - WHO HEN 67 (2019): broad support for arts engagement in prevention and wellbeing.
// - Fancourt et al. (BJPsych 2019): receptive cultural engagement linked to lower depression incidence (dose-response).
// - Quinn et al. (Nat Mental Health 2025): group arts showed moderate depression/anxiety reductions.
// - Lu et al. (Psychiatry Research 2021): music therapy showed small-to-moderate anxiety reduction at post-intervention.
// - Adiasto et al. (PLOS One 2022): passive listening alone had small/uncertain short-term stress-recovery effects.

type DisciplineWeight = {
  observation: number
  practice: number
}

const DISCIPLINE_WEIGHTS: Record<string, DisciplineWeight> = {
  dance:       { observation: 1.00, practice: 1.25 },
  music:       { observation: 0.85, practice: 1.15 },
  book:        { observation: 0.90, practice: 0.95 },
  theater:     { observation: 0.95, practice: 1.15 },
  painting:    { observation: 1.00, practice: 1.10 },
  writing:     { observation: 0.80, practice: 1.10 },
  film:        { observation: 0.75, practice: 0.95 },
  photography: { observation: 0.85, practice: 0.95 },
  design:      { observation: 0.80, practice: 0.90 },
  other:       { observation: 0.80, practice: 0.95 },
}

function getDisciplineWeight(discipline: string | null | undefined): DisciplineWeight {
  if (!discipline) return DISCIPLINE_WEIGHTS.other
  return DISCIPLINE_WEIGHTS[discipline] || DISCIPLINE_WEIGHTS.other
}

function estimateBookMinutesFromPages(pages: number | null | undefined) {
  if (!pages || pages <= 0) return 0
  // Coarse estimate for legacy page-only logs.
  return pages * 1.4
}

function getArtsExposure(artsSummary?: TodayArtsSummary | null, fallbackPages?: number | null) {
  const sessions = artsSummary?.sessions || []
  if (!sessions.length) {
    return {
      weightedObservationMinutes: 0,
      weightedPracticeMinutes: 0,
      observationBookUnits: fallbackPages ?? 0,
      weightedPracticeUnits: 0,
      observationDisciplines: 0,
      practiceDisciplines: 0,
      collaborativePracticeSessions: 0,
      publicOutputSessions: 0,
      practiceEffortAvg: null as number | null,
    }
  }

  let weightedObservationMinutes = 0
  let weightedPracticeMinutes = 0
  let observationBookUnits = 0
  let weightedPracticeUnits = 0
  let collaborativePracticeSessions = 0
  let publicOutputSessions = 0
  const practiceEfforts: number[] = []

  const obsDisciplines = new Set<string>()
  const practiceDisciplines = new Set<string>()

  for (const session of sessions) {
    const discipline = session.art_item?.discipline || 'other'
    const weight = getDisciplineWeight(discipline)

    const obsMinutes = Math.max(session.observation_minutes || 0, 0)
    const obsUnits = Math.max(session.observation_units || 0, 0)
    const practiceMinutes = Math.max(session.practice_minutes || 0, 0)
    const practiceUnits = Math.max(session.practice_units || 0, 0)

    if (obsMinutes > 0 || obsUnits > 0) {
      obsDisciplines.add(discipline)
    }
    if (practiceMinutes > 0 || practiceUnits > 0) {
      practiceDisciplines.add(discipline)
    }

    const obsMinutesWithFallback = obsMinutes + (discipline === 'book' ? estimateBookMinutesFromPages(obsUnits) : 0)
    weightedObservationMinutes += obsMinutesWithFallback * weight.observation

    if (discipline === 'book') {
      observationBookUnits += obsUnits
    }

    weightedPracticeMinutes += practiceMinutes * weight.practice
    weightedPracticeUnits += practiceUnits * weight.practice

    if ((practiceMinutes > 0 || practiceUnits > 0) && session.collaborative) {
      collaborativePracticeSessions += 1
    }
    if ((practiceMinutes > 0 || practiceUnits > 0) && session.public_output) {
      publicOutputSessions += 1
    }
    if ((practiceMinutes > 0 || practiceUnits > 0) && session.effort != null) {
      practiceEfforts.push(clamp(session.effort, 1, 5))
    }
  }

  return {
    weightedObservationMinutes,
    weightedPracticeMinutes,
    observationBookUnits,
    weightedPracticeUnits,
    observationDisciplines: obsDisciplines.size,
    practiceDisciplines: practiceDisciplines.size,
    collaborativePracticeSessions,
    publicOutputSessions,
    practiceEffortAvg: average(practiceEfforts),
  }
}

export function getObservationEffect(
  observationMinutes: number | null | undefined,
  observationBookUnits?: number | null,
  observationDisciplines?: number,
  fallbackPages?: number | null
): number {
  const minutes = Math.max(observationMinutes || 0, 0)
  const pages = Math.max(observationBookUnits || fallbackPages || 0, 0)
  const disciplineCount = observationDisciplines || 0

  const minuteDose = clamp(Math.sqrt(clamp(minutes, 0, 120)) / Math.sqrt(120), 0, 1)
  const pageDose = clamp(Math.sqrt(clamp(pages, 0, 60)) / Math.sqrt(60), 0, 1)
  const diversityBonus = clamp((disciplineCount - 1) * 0.04, 0, 0.12)

  return clamp(minuteDose * 0.82 + pageDose * 0.18 + diversityBonus, 0, 1)
}

export function getPracticeEffect(
  practiceMinutes: number | null | undefined,
  practiceUnits?: number | null,
  practiceDisciplines?: number,
  collaborativeSessions?: number,
  publicOutputSessions?: number,
  effortAvg?: number | null
): number {
  const minutes = Math.max(practiceMinutes || 0, 0)
  const units = Math.max(practiceUnits || 0, 0)
  const disciplineCount = practiceDisciplines || 0
  const collaborative = collaborativeSessions || 0
  const publicOutput = publicOutputSessions || 0
  const effort = effortAvg == null ? null : clamp(effortAvg, 1, 5)

  const minuteDose = clamp(Math.sqrt(clamp(minutes, 0, 120)) / Math.sqrt(120), 0, 1)
  const unitDose = clamp(Math.sqrt(clamp(units, 0, 20)) / Math.sqrt(20), 0, 1)
  const diversityBonus = clamp((disciplineCount - 1) * 0.04, 0, 0.12)
  const collaborativeBonus = clamp(collaborative * 0.04, 0, 0.08)
  const publicOutputBonus = clamp(publicOutput * 0.04, 0, 0.12)
  const effortBonus = effort == null ? 0 : clamp((effort - 3) * 0.04, -0.04, 0.08)

  return clamp(minuteDose * 0.86 + unitDose * 0.14 + diversityBonus + collaborativeBonus + publicOutputBonus + effortBonus, 0, 1)
}

export function getSynergyEffect(
  obsEffect: number,
  practEffect: number
): number {
  if (obsEffect > 0 && practEffect > 0) {
    // Hybrid day bonus when both observation and practice are present.
    return clamp(0.06 + Math.min(obsEffect, practEffect) * 0.12, 0, 0.18)
  }
  return 0
}

export function getArtsEffect(
  artsSummary?: TodayArtsSummary | null,
  fallbackPages?: number | null
): number {
  const exposure = getArtsExposure(artsSummary, fallbackPages)
  const obsEffect = getObservationEffect(
    exposure.weightedObservationMinutes,
    exposure.observationBookUnits,
    exposure.observationDisciplines,
    fallbackPages
  )
  const practEffect = getPracticeEffect(
    exposure.weightedPracticeMinutes,
    exposure.weightedPracticeUnits,
    exposure.practiceDisciplines,
    exposure.collaborativePracticeSessions,
    exposure.publicOutputSessions,
    exposure.practiceEffortAvg
  )
  const synergy = getSynergyEffect(obsEffect, practEffect)
  return clamp(obsEffect * 0.32 + practEffect * 0.65 + synergy, 0, 1)
}

/** @deprecated Use getObservationEffect / getArtsEffect instead */
function getReadingEffect(pages: number | null | undefined) {
  return getObservationEffect(null, pages)
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

function getMetricReadiness(
  metrics: DailyMetrics | null,
  workoutLoad: number = 0,
  artsSummary?: TodayArtsSummary | null
) {
  if (!metrics) return 0.5

  const sleepScore = (() => {
    if (metrics.sleep_hours == null) return null
    const distance = Math.abs(metrics.sleep_hours - 8)
    return clamp(1 - distance / 4, 0.15, 1)
  })()

  const energyScore = normalize(metrics.energy, 1, 5)
  const normalizedStress = normalize(metrics.stress, 1, 5)

  const artsEffect = getArtsEffect(artsSummary, metrics.pages_read)
  const workoutEffect = clamp(workoutLoad / 60, 0, 1)

  const exposure = getArtsExposure(artsSummary, metrics.pages_read)
  const practEffectForMotivation = getPracticeEffect(
    exposure.weightedPracticeMinutes,
    exposure.weightedPracticeUnits,
    exposure.practiceDisciplines,
    exposure.collaborativePracticeSessions,
    exposure.publicOutputSessions,
    exposure.practiceEffortAvg
  )
  const baseMotivation = normalize(metrics.motivation, 1, 5) ?? 0.5
  const motivationScore = clamp(baseMotivation + workoutEffect * 0.15 + practEffectForMotivation * 0.12, 0, 1)

  const HIGH_EVIDENCE_STRESS_DISCIPLINES = ['dance', 'music', 'writing']
  const hasHighEvidencePractice = artsSummary?.sessions?.some(s =>
    HIGH_EVIDENCE_STRESS_DISCIPLINES.includes(s.art_item?.discipline || '') &&
    (s.practice_minutes || 0) > 10
  ) ?? false
  const stressMultiplier = hasHighEvidencePractice ? 1.20 : 1.0
  const artsMitigator = artsEffect * 0.38 * stressMultiplier
  const workoutMitigator = workoutEffect * 0.3
  const totalMitigator = clamp(artsMitigator + workoutMitigator, 0, 0.75)

  const stressMitigator = 1 - totalMitigator
  const stressScore = normalizedStress == null ? null : 1 - (normalizedStress * stressMitigator)

  const phoneScore = (() => {
    if (metrics.phone_usage == null) return null
    const val = metrics.phone_usage
    const penalties = [0.1, 0.2, 0.35, 0.7, 1.0]
    const penalty = penalties[Math.floor(clamp(val, 1, 5)) - 1]
    return 1 - penalty
  })()

  return average([sleepScore, energyScore, motivationScore, stressScore, phoneScore]) ?? 0.5
}

export function getRecoveryScore(
  metrics: DailyMetrics | null,
  workoutLoad: number = 0,
  artsSummary?: TodayArtsSummary | null
) {
  const readiness = getMetricReadiness(metrics, workoutLoad, artsSummary)
  return clamp(22 + readiness * 53, 20, 75)
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
  const recoveryBonus = clamp((recovery - 45) / 30, 0, 1)
  const adjustedBalance = (recovery - effort * (0.75 - recoveryBonus * 0.35)) / 18
  return clamp(0.72 + sigmoid(adjustedBalance) * 0.56, 0.72, 1.28)
}

function getRecentSleepDebt(recentMetrics: DailyMetrics[]) {
  return recentMetrics.reduce((sum, metric) => {
    const sleep = metric.sleep_hours
    if (sleep == null) return sum
    return sum + Math.max(0, 6 - sleep)
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

function getRecoveryCoherencePenalty(
  metrics: DailyMetrics | null,
  effort: number,
  artsSummary?: TodayArtsSummary | null
) {
  if (!metrics) return 0

  const artsEffect = getArtsEffect(artsSummary, metrics.pages_read)
  const stressMitigator = 1 - artsEffect * 0.35
  
  const baseStressPenalty = metrics.stress != null && metrics.stress >= 4 ? 4 + (metrics.stress - 4) * 2.5 : 0
  const stressPenalty = baseStressPenalty * stressMitigator

  const sleepPenalty = metrics.sleep_hours != null && metrics.sleep_hours < 6 ? (6 - metrics.sleep_hours) * 3.2 : 0
  const mismatch = effort > 55 ? (stressPenalty + sleepPenalty) * 0.65 : 0

  return mismatch
}

export function getFatiguePenalty(
  recentMetrics: DailyMetrics[],
  recentWorkouts: WorkoutWithExercises[],
  profile: UserProfile | null,
  effort: number,
  metrics: DailyMetrics | null,
  artsSummary?: TodayArtsSummary | null
) {
  const thresholdMultiplier = getAgeFatigueThreshold(profile?.age)
  const sleepDebt = getRecentSleepDebt(recentMetrics)
  const heavyStreak = getHeavyDayStreak(recentWorkouts, profile?.weight, thresholdMultiplier)
  const coherencePenalty = getRecoveryCoherencePenalty(metrics, effort, artsSummary)

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

function getHint(breakdown: VitalityBreakdown, hasWorkout: boolean): string {
  if (breakdown.confidence < 0.55) {
    return 'low_confidence'
  }

  if (!hasWorkout && breakdown.recovery >= 52) {
    return 'rest_day'
  }

  if (breakdown.fatiguePenalty >= 14) {
    return 'fatigue'
  }

  if (breakdown.balanceModifier < 0.9) {
    return 'overload'
  }

  if (breakdown.balanceModifier > 1.08) {
    return 'balanced'
  }

  return 'stable'
}

export function computeVitalityScore(input: VitalityInput): VitalityResult {
  const ageFactor = getAgeFactor(input.profile?.age)

  const todayLoad = input.hasWorkout
    ? getWorkoutLoad(input.todayExercises, input.profile?.weight)
    : 0

  const readiness = getMetricReadiness(input.metrics, todayLoad, input.artsSummary)

  const effort = input.hasWorkout
    ? getIntensityScore(input.todayExercises, input.profile, input.recentWorkouts)
    : clamp(10 + readiness * 14, 10, 24)

  const recovery = getRecoveryScore(input.metrics, todayLoad, input.artsSummary)
  const balanceModifier = getBalanceModifier(effort, recovery)
  const fatiguePenalty = getFatiguePenalty(
    input.recentMetrics,
    input.recentWorkouts,
    input.profile,
    effort,
    input.metrics,
    input.artsSummary
  )
  const confidence = getConfidence(input)
  const baseScore = clamp(recovery * 0.72 + effort * 0.52, 18, 88)
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
