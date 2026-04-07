import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  ms?: number
}

export function useLongPress({ onLongPress, ms = 600 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setTimeout(() => {
      onLongPress()
      timerRef.current = null
    }, ms)
  }, [onLongPress, ms])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
