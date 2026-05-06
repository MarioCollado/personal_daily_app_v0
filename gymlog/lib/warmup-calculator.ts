export interface WarmupSet {
  weight: number
  percentage: number
}

/**
 * Calculates warm-up sets based on a target weight.
 * Percentages: 30%, 50%, 80%, 100%
 * Rounded to multiples of 2.5kg
 */
export function calculateWarmup(targetWeight: number | null | undefined): WarmupSet[] {
  if (!targetWeight || targetWeight <= 0) return []

  const steps = [0.3, 0.5, 0.8, 1.0]
  return steps.map(p => ({
    percentage: Math.round(p * 100),
    weight: Math.round((targetWeight * p) / 2.5) * 2.5
  }))
}
