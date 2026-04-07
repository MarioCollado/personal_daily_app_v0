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

        const hoursSinceLast = (now - state.lastShownTimestamp) / (1000 * 60 * 60)
        
        if (state.dismissed) {
          setAdvice(currentAdvice)
          setIsDismissed(true)
        } else {
          setAdvice(currentAdvice)
          setIsDismissed(false)
        }

      } else {
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
