'use client'
import { useState, useEffect, useRef } from 'react'
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'

const PRESETS = [60, 90, 120, 180]

export default function RestTimer() {
  const [open, setOpen] = useState(false)
  const [seconds, setSeconds] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => setRemaining(r => r - 1), 1000)
    } else if (remaining === 0) {
      setRunning(false)
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, remaining])

  const reset = () => { setRunning(false); setRemaining(seconds) }
  const toggle = () => setRunning(r => !r)
  const setPreset = (s: number) => { setSeconds(s); setRemaining(s); setRunning(false) }

  const pct = ((seconds - remaining) / seconds) * 100
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          'fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center z-30 shadow-lg transition-colors',
          running ? 'bg-brand-500 text-black' : 'bg-surface-3 text-zinc-300'
        )}
        aria-label="Timer de descanso"
      >
        <Timer className="w-5 h-5" />
        {running && (
          <span className="absolute -top-1 -right-1 bg-black text-brand-400 text-[10px] font-mono font-bold rounded-full px-1 min-w-[20px] text-center">
            {fmt(remaining)}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-surface-1 border border-surface-border rounded-t-2xl w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Descanso</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={remaining === 0 ? '#ef4444' : '#22c55e'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={clsx('text-3xl font-mono font-bold', remaining === 0 && 'text-red-400')}>
                    {fmt(remaining)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4 justify-center">
              {PRESETS.map(s => (
                <button key={s} onClick={() => setPreset(s)}
                  className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', seconds === s && !running ? 'bg-brand-500 text-black' : 'bg-surface-3 text-zinc-300')}>
                  {fmt(s)}
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={reset} className="btn-ghost p-3 rounded-full"><RotateCcw className="w-5 h-5" /></button>
              <button onClick={toggle} className={clsx('px-8 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors', running ? 'bg-surface-3 text-white' : 'bg-brand-500 text-black')}>
                {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Iniciar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
