import type { DailyMetrics } from '@/types'

export type AdviceType = 'rest' | 'action' | 'mind' | 'praise' | 'warning'

export interface Advice {
  id: string
  type: AdviceType
}

export function getDailyAdvice(metrics: DailyMetrics | null, hasWorkout: boolean): Advice | null {
  if (!metrics) return null

  const s = metrics.sleep_hours
  const e = metrics.energy
  const st = metrics.stress
  const m = metrics.motivation
  const pu = metrics.phone_usage
  const p = metrics.pages_read
  const w = hasWorkout

  if (s != null && s <= 5 && e != null && e <= 2) {
    return {
      id: 'extreme_rest',
      type: 'warning'
    }
  }

  if (st != null && st >= 4 && pu != null && pu >= 4) {
    return {
      id: 'high_stress',
      type: 'mind'
    }
  }

  if (!w && e != null && e >= 4 && pu != null && pu >= 3) {
    return {
      id: 'go_workout',
      type: 'action'
    }
  }

  if (!w && m != null && m <= 2) {
    return {
      id: 'low_motivation',
      type: 'warning'
    }
  }

  if (w && s != null && s <= 6) {
    return {
      id: 'praise_tired',
      type: 'rest'
    }
  }

  if (w && p != null && p >= 15 && e != null && e >= 4 && st != null && st <= 2) {
    return {
      id: 'praise_perfect',
      type: 'praise'
    }
  }

  if (pu != null && pu >= 4 && (!p || p === 0)) {
    return {
      id: 'read_prompt',
      type: 'mind'
    }
  }

  if (!w && pu != null && pu >= 3) {
    return {
      id: 'general_active',
      type: 'action'
    }
  }

  return null
}
