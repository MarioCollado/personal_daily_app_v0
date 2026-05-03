import type { Set } from '@/types'

export interface StrengthAutofillValues {
  weight: string
  reps: string
  rir: string
}

export function getSuggestedStrengthValues(
  previousSets: Set[] | null | undefined,
  currentSetIndex: number
): StrengthAutofillValues | null {
  if (!previousSets?.length) return null

  const safeIndex = Math.max(0, currentSetIndex)
  const source = previousSets[Math.min(safeIndex, previousSets.length - 1)]
  if (!source) return null

  const values: StrengthAutofillValues = {
    weight: Number.isFinite(source.weight) ? String(source.weight) : '',
    reps: Number.isFinite(source.reps) && source.reps > 0 ? String(source.reps) : '',
    rir: source.rir != null && Number.isFinite(source.rir) ? String(source.rir) : '',
  }

  if (!values.weight && !values.reps && !values.rir) return null
  return values
}

export function summarizePreviousStrengthSets(previousSets: Set[] | null | undefined, maxItems = 3) {
  if (!previousSets?.length) return ''

  return previousSets
    .slice(0, maxItems)
    .map(set => `${set.weight}kg x ${set.reps}`)
    .join(' · ')
}
