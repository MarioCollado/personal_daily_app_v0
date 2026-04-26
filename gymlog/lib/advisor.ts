import type { DailyMetrics, TodayArtsSummary } from '@/types'

export type AdviceType = 'rest' | 'action' | 'mind' | 'praise' | 'warning'

export interface Advice {
  id: string
  type: AdviceType
}

export function getDailyAdvice(
  metrics: DailyMetrics | null,
  hasWorkout: boolean,
  artsSummary?: TodayArtsSummary | null
): Advice | null {
  if (!metrics) return null

  const sleep = metrics.sleep_hours
  const energy = metrics.energy
  const stress = metrics.stress
  const motivation = metrics.motivation
  const phone = metrics.phone_usage

  const observationMinutes = artsSummary?.totalObservationMinutes ?? 0
  const practiceMinutes = artsSummary?.totalPracticeMinutes ?? 0
  const hasArtsObservation = observationMinutes > 0
  const hasArtsPractice = practiceMinutes > 0
  const hasArtsAny = hasArtsObservation || hasArtsPractice
  const hasArtsSynergy = hasArtsObservation && hasArtsPractice

  if (sleep != null && sleep <= 5 && energy != null && energy <= 2) {
    return {
      id: 'extreme_rest',
      type: 'warning',
    }
  }

  if (stress != null && stress >= 4 && phone != null && phone >= 4 && !hasArtsAny) {
    return {
      id: 'stress_screen_spiral',
      type: 'mind',
    }
  }

  if (!hasWorkout && !hasArtsPractice && energy != null && energy >= 4 && phone != null && phone >= 3) {
    return {
      id: 'channel_energy',
      type: 'action',
    }
  }

  if (motivation != null && motivation <= 2 && !hasWorkout && !hasArtsPractice) {
    return {
      id: 'low_drive_activation',
      type: 'warning',
    }
  }

  if (phone != null && phone >= 4 && !hasArtsObservation && !hasArtsPractice) {
    return {
      id: 'arts_replacement',
      type: 'mind',
    }
  }

  if (stress != null && stress >= 4 && !hasArtsObservation && hasArtsPractice) {
    return {
      id: 'add_observation',
      type: 'mind',
    }
  }

  if (sleep != null && sleep <= 6 && hasWorkout) {
    return {
      id: 'protect_recovery',
      type: 'rest',
    }
  }

  if (sleep != null && sleep <= 6 && hasArtsPractice) {
    return {
      id: 'soften_tonight',
      type: 'rest',
    }
  }

  if (hasWorkout && hasArtsSynergy && stress != null && stress <= 2) {
    return {
      id: 'full_stack_day',
      type: 'praise',
    }
  }

  if (!hasWorkout && hasArtsPractice && motivation != null && motivation >= 4) {
    return {
      id: 'creative_momentum',
      type: 'praise',
    }
  }

  if (!hasWorkout && phone != null && phone >= 3 && !hasArtsAny) {
    return {
      id: 'move_or_make',
      type: 'action',
    }
  }

  return null
}
