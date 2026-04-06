'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getTodayWorkout, createWorkout, getExercisesForWorkout } from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics, getUserBooks } from '@/lib/metrics'
import type { Workout, Exercise, DailyMetrics } from '@/types'
import SleepBlock from '@/components/bento/SleepBlock'
import ClockWeatherBlock from '@/components/bento/ClockWeatherBlock'
import StateBlock from '@/components/bento/StateBlock'
import ReadingBlock from '@/components/bento/ReadingBlock'
import WorkoutBlock from '@/components/bento/WorkoutBlock'
import ScoreBlock from '@/components/bento/ScoreBlock'
import BottomNav from '@/components/ui/BottomNav'
import RestTimer from '@/components/ui/RestTimer'
import { useRouter } from 'next/navigation'

const TODAY = new Date().toISOString().split('T')[0]

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [books, setBooks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set())
  const [startingWorkout, setStartingWorkout] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [m, w, b] = await Promise.all([
      getDailyMetrics(user.id, TODAY),
      getTodayWorkout(user.id),
      getUserBooks(user.id),
    ])

    setMetrics(m)
    setWorkout(w)
    setBooks(b)

    if (w) {
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
    }

    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function saveMetrics(updates: Partial<DailyMetrics>, fieldKeys: string[]) {
    if (!userId) return
    setSavingFields(prev => new Set([...prev, ...fieldKeys]))
    try {
      const updated = await upsertDailyMetrics(userId, TODAY, updates as any)
      setMetrics(updated)
    } finally {
      setSavingFields(prev => {
        const next = new Set(prev)
        fieldKeys.forEach(k => next.delete(k))
        return next
      })
    }
  }

  // Debounced save for sleep (dragging)
  function handleSleepChange(hours: number) {
    setMetrics(m => m ? { ...m, sleep_hours: hours } : { sleep_hours: hours } as any)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveMetrics({ sleep_hours: hours }, ['sleep'])
    }, 600)
  }

  function handleStateChange(field: 'energy' | 'stress' | 'motivation', value: number) {
    setMetrics(m => m ? { ...m, [field]: value } : { [field]: value } as any)
    saveMetrics({ [field]: value }, [field])
  }

  function handleReadingChange(updates: { book_title?: string; pages_read?: number; book_total_pages?: number }) {
    setMetrics(m => m ? { ...m, ...updates } : { ...updates } as any)
    saveMetrics(updates as any, Object.keys(updates))
    if (updates.book_title && !books.includes(updates.book_title)) {
      setBooks(b => [...b, updates.book_title!].sort())
    }
  }

  async function handleStartWorkout() {
    if (!userId) return
    setStartingWorkout(true)
    try {
      const w = await createWorkout(userId, TODAY)
      setWorkout(w)
      setExercises([])
    } finally {
      setStartingWorkout(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-sm tracking-tight">Dashboard</h1>
            <p className="text-zinc-600 text-[11px] capitalize">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={handleSignOut} className="text-zinc-700 hover:text-white p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <main className="max-w-lg mx-auto px-3 pt-3 pb-4">
        <div className="grid grid-cols-2 gap-2.5 auto-rows-auto">

          {/* Row 1: Clock (small) + Sleep (large-ish) */}
          <div className="col-span-1 row-span-1" style={{ minHeight: '130px' }}>
            <ClockWeatherBlock
              cachedTemp={metrics?.weather_temp}
              cachedCondition={metrics?.weather_condition}
            />
          </div>
          <div className="col-span-1 row-span-2" style={{ minHeight: '280px' }}>
            <SleepBlock
              value={metrics?.sleep_hours ?? null}
              onChange={handleSleepChange}
              saving={savingFields.has('sleep')}
            />
          </div>

          {/* Row 1 cont: Score under clock */}
          <div className="col-span-1 row-span-1" style={{ minHeight: '140px' }}>
            <ScoreBlock metrics={metrics} hasWorkout={!!workout} />
          </div>

          {/* Row 2: State (full width) */}
          <div className="col-span-2" style={{ minHeight: '130px' }}>
            <StateBlock
              energy={metrics?.energy ?? null}
              stress={metrics?.stress ?? null}
              motivation={metrics?.motivation ?? null}
              onChange={handleStateChange}
              saving={savingFields.has('energy') || savingFields.has('stress') || savingFields.has('motivation')}
            />
          </div>

          {/* Row 3: Reading + Workout side by side */}
          <div className="col-span-1" style={{ minHeight: '220px' }}>
            <ReadingBlock
              bookTitle={metrics?.book_title ?? null}
              pagesRead={metrics?.pages_read ?? null}
              bookTotalPages={metrics?.book_total_pages ?? null}
              bookSuggestions={books}
              onChange={handleReadingChange}
              saving={savingFields.has('book_title') || savingFields.has('pages_read')}
            />
          </div>
          <div className="col-span-1" style={{ minHeight: '220px' }}>
            <WorkoutBlock
              workout={workout}
              exercises={exercises}
              onStart={handleStartWorkout}
              starting={startingWorkout}
            />
          </div>

        </div>
      </main>

      {workout && <RestTimer />}
      <BottomNav />
    </div>
  )
}
