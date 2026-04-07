import type { DailyMetrics } from '@/types'

export type AdviceType = 'rest' | 'action' | 'mind' | 'praise' | 'warning'

export interface Advice {
  id: string
  text: string
  type: AdviceType
}

export function getDailyAdvice(metrics: DailyMetrics | null, hasWorkout: boolean): Advice | null {
  if (!metrics) return null

  const s = metrics.sleep_hours
  const e = metrics.energy
  const st = metrics.stress
  const m = metrics.motivation
  const ft = metrics.free_time
  const p = metrics.pages_read
  const w = hasWorkout

  if (s != null && s <= 5 && e != null && e <= 2) {
    return {
      id: 'extreme_rest',
      type: 'warning',
      text: 'Batería en valores críticos. Cero exigencias hoy, tu único objetivo es sobrevivir y dormir pronto.'
    }
  }

  if (st != null && st >= 4 && ft != null && ft <= 2) {
    return {
      id: 'high_stress',
      type: 'mind',
      text: 'Día asfixiante de estrés. Exígete lo mínimo, apaga pantallas 10 minutos y simplemente respira.'
    }
  }

  if (!w && e != null && e >= 4 && ft != null && ft >= 3) {
    return {
      id: 'go_workout',
      type: 'action',
      text: 'Tienes energía de sobra y tiempo libre. No hay excusa, es el momento perfecto para arrancar el entreno.'
    }
  }

  if (!w && m != null && m <= 2) {
    return {
      id: 'low_motivation',
      type: 'warning',
      text: 'Hoy la mente pone frenos. No lo pienses: ponte las zapatillas solo por 5 minutos. Si luego quieres parar, para.'
    }
  }

  if (w && s != null && s <= 6) {
    return {
      id: 'praise_tired',
      type: 'rest',
      text: 'Entrenamiento liquidado a pesar del cansancio. Gran disciplina. Cena bien y prioriza irte a la cama.'
    }
  }

  if (w && p != null && p >= 15 && e != null && e >= 4 && st != null && st <= 2) {
    return {
      id: 'praise_perfect',
      type: 'praise',
      text: 'Cuerpo entrenado, estrés bajo y avance intelectual. Día redondo, aprovéchalo y mantén el ritmo.'
    }
  }

  if (ft != null && ft >= 4 && (!p || p === 0)) {
    return {
      id: 'read_prompt',
      type: 'mind',
      text: 'Tienes tiempo libre y aún no le has dado a la mente. Tira el móvil a otra habitación y lee 15 minutos de un tirón.'
    }
  }

  if (!w && ft != null && ft >= 3) {
    return {
      id: 'general_active',
      type: 'action',
      text: 'Mucho uso de pantalla hoy. Tómate un respiro visual y dedícate al menos 30 minutos a moverte.'
    }
  }

  return null
}
