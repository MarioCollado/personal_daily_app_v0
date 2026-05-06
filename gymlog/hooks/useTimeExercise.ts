'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

export function useTimeExercise() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0) // time in seconds
  const startTimeRef = useRef<number>(0)
  const accumulatedTimeRef = useRef<number>(0)
  const requestRef = useRef<number>()

  const update = useCallback(() => {
    const now = Date.now()
    const elapsed = now - startTimeRef.current + accumulatedTimeRef.current
    setTime(elapsed / 1000)
    requestRef.current = requestAnimationFrame(update)
  }, [])

  const start = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    startTimeRef.current = Date.now()
    requestRef.current = requestAnimationFrame(update)
  }, [isRunning, update])

  const stop = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    
    const now = Date.now()
    const finalElapsed = now - startTimeRef.current + accumulatedTimeRef.current
    accumulatedTimeRef.current = finalElapsed
    setTime(finalElapsed / 1000)
  }, [isRunning])

  const reset = useCallback(() => {
    setIsRunning(false)
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    accumulatedTimeRef.current = 0
    startTimeRef.current = 0
    setTime(0)
  }, [])

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  return { isRunning, time, start, stop, reset }
}
