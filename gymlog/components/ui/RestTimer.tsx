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
          'fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center z-30 shadow-lg transition-all duration-300',
          running ? 'bg-brand-500 text-brand-foreground ring-2 ring-brand-500/20' : 'bg-surface-3 text-muted border border-surface-border'
        )}
        aria-label="Timer de descanso"
      >
        <Timer className="w-5 h-5" />
        {running && (
          <span className="absolute -top-1 -right-1 bg-surface-2 text-main border border-surface-border text-[10px] font-mono font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-sm">
            {fmt(remaining)}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-surface-1 border border-surface-border rounded-t-2xl w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="font-semibold text-lg text-main">Descanso</h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-main p-1 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-surface-2" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={remaining === 0 ? 'var(--brand)' : 'var(--brand)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                    className={clsx('transition-all duration-1000', remaining === 0 ? 'text-red-500' : 'text-brand-500')}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={clsx('text-3xl font-mono font-bold text-main', remaining === 0 && 'text-red-500 animate-pulse')}>
                    {fmt(remaining)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4 justify-center">
              {PRESETS.map(s => (
                <button key={s} onClick={() => setPreset(s)}
                  className={clsx('px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200', seconds === s && !running ? 'bg-brand-500 text-brand-foreground shadow-sm' : 'bg-surface-3 text-muted hover:bg-surface-4 hover:text-main')}>
                  {fmt(s)}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={reset} className="btn-ghost p-4 rounded-full flex items-center justify-center"><RotateCcw className="w-5 h-5" /></button>
              <button onClick={toggle} className={clsx('px-10 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all duration-300 shadow-md', running ? 'bg-surface-3 text-main hover:bg-surface-4' : 'bg-brand-500 text-brand-foreground hover:bg-brand-600')}>
                {running ? <><Pause className="w-5 h-5 fill-current" /> Pausar</> : <><Play className="w-5 h-5 fill-current" /> Iniciar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
