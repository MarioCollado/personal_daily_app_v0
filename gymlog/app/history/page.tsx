'use client'
import { useState, useEffect } from 'react'
import { Calendar, ChevronRight, Dumbbell, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getWorkoutHistory, getExercisesForWorkout } from '@/lib/db'
import type { Workout, Exercise } from '@/types'
import BottomNav from '@/components/ui/BottomNav'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (iso === today) return 'Hoy'
  if (iso === yesterday) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000)
  if (diff === 0) return ''
  if (diff === 1) return 'hace 1 día'
  return `hace ${diff} días`
}

interface WorkoutWithExercises extends Workout {
  exercises?: Exercise[]
}

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const history = await getWorkoutHistory(user.id, 30)
      setWorkouts(history)
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleExpand(workoutId: string) {
    if (expanded === workoutId) { setExpanded(null); return }
    const w = workouts.find(w => w.id === workoutId)
    if (!w?.exercises) {
      setLoadingDetail(workoutId)
      const exs = await getExercisesForWorkout(workoutId)
      setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, exercises: exs } : w))
      setLoadingDetail(null)
    }
    setExpanded(workoutId)
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
      <header className="sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h1 className="font-bold text-base">Historial</h1>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">{workouts.length} sesiones registradas</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-2">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500">Aún no hay entrenos registrados.</p>
            <Link href="/today" className="btn-primary mt-4 text-sm">Empezar ahora</Link>
          </div>
        ) : (
          workouts.map(w => (
            <div key={w.id} className="card overflow-hidden animate-fade-in">
              <button
                onClick={() => toggleExpand(w.id)}
                className="w-full flex items-center gap-3 p-4 text-left touch-manipulation"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold capitalize">{formatDate(w.date)}</div>
                  <div className="text-zinc-500 text-xs flex items-center gap-2">
                    <span>{daysAgo(w.date)}</span>
                    {w.name && <><span>·</span><span className="truncate">{w.name}</span></>}
                  </div>
                </div>
                <ChevronRight className={clsx('w-4 h-4 text-zinc-600 transition-transform flex-shrink-0', expanded === w.id && 'rotate-90')} />
              </button>

              {expanded === w.id && (
                <div className="border-t border-surface-border animate-slide-up">
                  {loadingDetail === w.id ? (
                    <div className="p-4 flex justify-center">
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {(w.exercises || []).map(ex => (
                        <div key={ex.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{ex.name}</span>
                            {ex.muscle_group && (
                              <span className="text-xs text-zinc-600">{ex.muscle_group}</span>
                            )}
                          </div>
                          {(ex.sets || []).length > 0 && (
                            <div className="space-y-0.5">
                              {(ex.sets || []).map((s, i) => (
                                <div key={s.id} className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                                  <span className="text-zinc-700">#{i + 1}</span>
                                  <span className="text-white">{s.weight}kg × {s.reps}</span>
                                  {s.rir != null && <span>@{s.rir} RIR</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          <Link
                            href={`/exercise/${encodeURIComponent(ex.name)}`}
                            className="inline-flex items-center gap-1 mt-1 text-xs text-brand-500/70 hover:text-brand-400 transition-colors"
                          >
                            <TrendingUp className="w-3 h-3" />
                            Ver progresión
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
