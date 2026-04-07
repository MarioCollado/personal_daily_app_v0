'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Dumbbell, Pencil, Check, Copy, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import {
  getTodayWorkout, createWorkout, getExercisesForWorkout,
  updateWorkoutName, getExerciseNames, getWorkoutHistory, duplicateWorkout
} from '@/lib/db'
import type { Workout, Exercise, Set } from '@/types'
import ExerciseCard from '@/components/workout/ExerciseCard'
import AddExerciseModal from '@/components/workout/AddExerciseModal'
import BottomNav from '@/components/ui/BottomNav'
import RestTimer from '@/components/ui/RestTimer'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function TodayPage() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState(getLocalISODate)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    let w = await getTodayWorkout(user.id, currentDate)
    if (!w) {
      // show empty state, don't auto-create
    }
    setWorkout(w)
    if (w) {
      setWorkoutName(w.name || '')
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
    } else {
      setWorkoutName('')
      setExercises([])
    }
    const names = await getExerciseNames(user.id)
    setSuggestions(names)

    const history = await getWorkoutHistory(user.id, 5)
    const last = history.find(h => h.date !== currentDate)
    setLastWorkout(last || null)

    setLoading(false)
  }, [currentDate, router])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const checkDate = () => {
      const actual = getLocalISODate()
      if (actual !== currentDate) {
        setLoading(true)
        setCurrentDate(actual)
      }
    }
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkDate()
    })
    window.addEventListener('focus', checkDate)
    const interval = setInterval(checkDate, 60000)
    
    return () => {
      window.removeEventListener('visibilitychange', checkDate)
      window.removeEventListener('focus', checkDate)
      clearInterval(interval)
    }
  }, [currentDate])

  async function startWorkout() {
    if (!userId) return
    const w = await createWorkout(userId, currentDate)
    setWorkout(w)
    setExercises([])
  }

  async function saveName() {
    if (!workout) return
    await updateWorkoutName(workout.id, workoutName)
    setWorkout(w => w ? { ...w, name: workoutName } : w)
    setEditingName(false)
  }

  async function handleDuplicate() {
    if (!lastWorkout || !userId) return
    setDuplicating(true)
    try {
      const w = await duplicateWorkout(lastWorkout.id, userId, currentDate)
      setWorkout(w)
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
      setShowDuplicate(false)
    } finally {
      setDuplicating(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function handleExerciseAdded(ex: Exercise) {
    setExercises(prev => [...prev, { ...ex, sets: [] }])
  }

  function handleExerciseDeleted(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function handleSetAdded(exerciseId: string, set: Set) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: [...(ex.sets || []), set] } : ex
    ))
  }

  function handleSetDeleted(exerciseId: string, setId: string) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) } : ex
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-brand-500" />
              <h1 className="font-bold text-base">Entreno de hoy</h1>
            </div>
            <p className="text-zinc-500 text-xs capitalize mt-0.5">{formatDate(currentDate)}</p>
          </div>
          <button onClick={handleSignOut} className="text-zinc-600 hover:text-white p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {!workout ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-5">
              <Dumbbell className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="font-semibold text-xl mb-2">Sin entreno hoy</h2>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">Empieza tu sesión de entrenamiento o duplica la última.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button onClick={startWorkout} className="btn-primary flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Empezar entreno
              </button>
              {lastWorkout && (
                <button onClick={handleDuplicate} disabled={duplicating}
                  className="btn-ghost flex items-center justify-center gap-2 text-sm">
                  <Copy className="w-4 h-4" />
                  {duplicating ? 'Duplicando...' : `Copiar ${formatDate(lastWorkout.date)}`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Workout name */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    placeholder="Nombre del entreno..."
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={saveName} className="btn-primary px-3 py-2"><Check className="w-4 h-4" /></button>
                </>
              ) : (
                <button onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors group py-1">
                  <span className="font-medium">{workout.name || 'Sesión sin nombre'}</span>
                  <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Stats bar */}
            {exercises.length > 0 && (
              <div className="flex gap-4 text-sm bg-surface-1 border border-surface-border rounded-xl px-4 py-3 animate-fade-in">
                <div className="text-center">
                  <div className="font-bold text-brand-400">{exercises.length}</div>
                  <div className="text-zinc-600 text-xs">ejercicios</div>
                </div>
                <div className="w-px bg-surface-border" />
                <div className="text-center">
                  <div className="font-bold">{exercises.reduce((a, e) => a + (e.sets?.length || 0), 0)}</div>
                  <div className="text-zinc-600 text-xs">series</div>
                </div>
                <div className="w-px bg-surface-border" />
                <div className="text-center">
                  <div className="font-bold">
                    {exercises.reduce((a, e) => a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0).toLocaleString()}
                    <span className="text-zinc-600 text-xs font-normal"> kg</span>
                  </div>
                  <div className="text-zinc-600 text-xs">volumen</div>
                </div>
              </div>
            )}

            {/* Exercise cards */}
            <div className="space-y-3">
              {exercises.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onDelete={handleExerciseDeleted}
                  onSetAdded={handleSetAdded}
                  onSetDeleted={handleSetDeleted}
                />
              ))}
            </div>

            {/* Add exercise button */}
            <button onClick={() => setShowAddExercise(true)}
              className="w-full border-2 border-dashed border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5 rounded-2xl py-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-brand-400 transition-all duration-150 touch-manipulation">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Añadir ejercicio</span>
            </button>
          </>
        )}
      </main>

      {workout && (
        <RestTimer />
      )}

      {showAddExercise && workout && (
        <AddExerciseModal
          workoutId={workout.id}
          suggestions={suggestions}
          onAdd={handleExerciseAdded}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}
