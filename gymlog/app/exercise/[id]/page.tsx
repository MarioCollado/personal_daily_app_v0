'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Weight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getExerciseHistory } from '@/lib/db'
import BottomNav from '@/components/ui/BottomNav'
import ProgressChart from '@/components/charts/ProgressChart'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Session { date: string; sets: any[] }

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ExercisePage() {
  const params = useParams()
  const exerciseName = decodeURIComponent(params.id as string)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const history = await getExerciseHistory(user.id, exerciseName, 10)
      setSessions(history)
      setLoading(false)
    }
    load()
  }, [exerciseName, router])

  const chartData = sessions.map(s => ({
    date: formatDate(s.date),
    maxWeight: Math.max(...s.sets.map((set: any) => set.weight), 0),
    totalVolume: s.sets.reduce((a: number, set: any) => a + set.reps * set.weight, 0),
    sets: s.sets.length,
  })).reverse()

  const best = chartData.length ? Math.max(...chartData.map(d => d.maxWeight)) : 0
  const lastSession = sessions[0]
  const prevSession = sessions[1]

  function getDelta() {
    if (!lastSession || !prevSession) return null
    const lastMax = Math.max(...lastSession.sets.map((s: any) => s.weight), 0)
    const prevMax = Math.max(...prevSession.sets.map((s: any) => s.weight), 0)
    const diff = lastMax - prevMax
    return diff
  }

  const delta = getDelta()

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
          <div className="flex items-center gap-3">
            <Link href="/history" className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-base truncate">{exerciseName}</h1>
              <p className="text-zinc-500 text-xs">{sessions.length} sesiones</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500">Sin historial para este ejercicio.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <div className="text-xl font-bold font-mono text-brand-400">{best}<span className="text-sm text-zinc-600 font-normal">kg</span></div>
                <div className="text-xs text-zinc-500 mt-0.5">Mejor marca</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-xl font-bold font-mono">{sessions.length}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Sesiones</div>
              </div>
              <div className="card p-3 text-center">
                <div className={`text-xl font-bold font-mono ${delta == null ? 'text-zinc-500' : delta > 0 ? 'text-brand-400' : delta < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {delta == null ? '—' : delta > 0 ? `+${delta}` : delta === 0 ? '=' : delta}
                  {delta != null && <span className="text-sm text-zinc-600 font-normal">kg</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">Progreso</div>
              </div>
            </div>

            {chartData.length >= 2 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" /> Peso máximo por sesión
                </h3>
                <ProgressChart data={chartData} />
              </div>
            )}

            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div key={session.date} className="card p-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm capitalize">{formatDate(session.date)}</span>
                    {idx === 0 && (
                      <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">Última</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {session.sets.map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-700 font-mono w-4">#{i + 1}</span>
                        <span className="font-mono font-medium">{s.weight}<span className="text-zinc-600 text-xs">kg</span></span>
                        <span className="text-zinc-600">×</span>
                        <span className="font-mono font-medium">{s.reps}<span className="text-zinc-600 text-xs">reps</span></span>
                        {s.rir != null && <span className="text-zinc-600 text-xs ml-auto">@{s.rir} RIR</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-4 text-xs text-zinc-600">
                    <span>Vol: {session.sets.reduce((a: number, s: any) => a + s.reps * s.weight, 0).toLocaleString()} kg</span>
                    <span>Max: {Math.max(...session.sets.map((s: any) => s.weight))} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
