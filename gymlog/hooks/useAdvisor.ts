import { useState, useEffect, useCallback } from 'react'
import type { Advice } from '@/lib/advisor'

interface AdvisorState {
  adviceId: string | null
  lastShownTimestamp: number
  dismissed: boolean
  sessionOpens: number
}

const STORAGE_KEY = 'v_advisor_state'

export function useAdvisor(currentAdvice: Advice | null) {
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  // Hydrate state
  useEffect(() => {
    if (!currentAdvice) {
      setAdvice(null)
      setIsDismissed(false)
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const now = Date.now()

      if (stored) {
        const state: AdvisorState = JSON.parse(stored)
        
        // If it's a completely new advice, wipe dismissal and show it
        if (state.adviceId !== currentAdvice.id) {
          setAdvice(currentAdvice)
          setIsDismissed(false)
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            adviceId: currentAdvice.id,
            lastShownTimestamp: now,
            dismissed: false,
            sessionOpens: 0
          }))
          return
        }

        // It is the same advice. Check logic
        const hoursSinceLast = (now - state.lastShownTimestamp) / (1000 * 60 * 60)
        
        if (state.dismissed) {
          // If dismissed, but it's been more than 4 hours, and it's still applicable?
          // Usually, if a user dismissed it, we don't annoy them again for the same advice until next day.
          // Since Advice ID remains same, let's keep it dismissed.
          setAdvice(currentAdvice)
          setIsDismissed(true)
        } else {
          setAdvice(currentAdvice)
          setIsDismissed(false)
        }

      } else {
        // First ever interaction
        setAdvice(currentAdvice)
        setIsDismissed(false)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          adviceId: currentAdvice.id,
          lastShownTimestamp: now,
          dismissed: false,
          sessionOpens: 1
        }))
      }
    } catch (e) {
      // Fallback
      setAdvice(currentAdvice)
    }
  }, [currentAdvice])

  const dismissAdvice = useCallback(() => {
    setIsDismissed(true)
    if (advice) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const state: AdvisorState = stored ? JSON.parse(stored) : { sessionOpens: 1 }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...state,
          adviceId: advice.id,
          lastShownTimestamp: Date.now(),
          dismissed: true
        }))
      } catch (e) {}
    }
  }, [advice])

  const restoreAdvice = useCallback(() => {
    setIsDismissed(false)
    if (advice) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const state: AdvisorState = JSON.parse(stored)
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...state,
            dismissed: false
          }))
        }
      } catch(e) {}
    }
  }, [advice])

  return {
    advice,
    isDismissed,
    dismissAdvice,
    restoreAdvice
  }
}
