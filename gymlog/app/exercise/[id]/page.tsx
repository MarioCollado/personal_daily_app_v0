'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getExerciseHistory } from '@/lib/db'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import EmptyState from '@/components/ui/EmptyState'
import StatTile from '@/components/ui/StatTile'
import ProgressChart from '@/components/charts/ProgressChart'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useI18n } from '@/contexts/I18nContext'

interface Session {
  date: string
  sets: Array<{
    id: string
    reps: number
    weight: number
    rir: number | null
  }>
}

export default function ExercisePage() {
  const params = useParams()
  const exerciseName = decodeURIComponent(params.id as string)
  const router = useRouter()
  const { t, language } = useI18n()
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<'maxWeight' | 'maxReps'>('maxWeight')

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const history = await getExerciseHistory(user.id, exerciseName, 10)
      setSessions(history as Session[])
      setLoading(false)
    }
    load()
  }, [exerciseName, router])

  const chartData = sessions.map(session => ({
    date: formatDate(session.date),
    maxWeight: Math.max(...session.sets.map(set => set.weight), 0),
    maxReps: Math.max(...session.sets.map(set => set.reps), 0),
    totalVolume: session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
    sets: session.sets.length,
  })).reverse()

  const best = chartData.length ? Math.max(...chartData.map(item => item.maxWeight)) : 0
  const lastSession = sessions[0]
  const prevSession = sessions[1]

  function getDelta() {
    if (!lastSession || !prevSession) return null
    const lastMax = Math.max(...lastSession.sets.map(item => item.weight), 0)
    const prevMax = Math.max(...prevSession.sets.map(item => item.weight), 0)
    return lastMax - prevMax
  }

  const delta = getDelta()

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      <PageHeader innerClassName="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/history" className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-main">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base truncate text-main">{exerciseName}</h1>
            <p className="text-muted text-xs">{t('exercise.sessions_count', { count: sessions.length })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </PageHeader>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8 text-muted" />}
            title={t('exercise.no_data')}
            description={t('exercise.no_data_desc')}
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                value={<>{best}<span className="text-sm text-muted font-normal">kg</span></>}
                label={t('exercise.best')}
                valueClassName="text-brand-400"
              />
              <StatTile value={sessions.length} label={t('exercise.sessions')} />
              <StatTile
                value={
                  <>
                    {delta == null ? '-' : delta > 0 ? `+${delta}` : delta === 0 ? '=' : delta}
                    {delta != null && <span className="text-sm text-muted font-normal">kg</span>}
                  </>
                }
                label={t('exercise.progress')}
                valueClassName={delta == null ? 'text-muted' : delta > 0 ? 'text-brand-400' : delta < 0 ? 'text-red-400' : 'text-main'}
              />
            </div>

            {chartData.length >= 2 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-500" /> 
                    {metric === 'maxWeight' ? t('history.metrics.max_weight') : t('history.metrics.max_reps')}
                  </h3>
                  
                  <div className="flex bg-surface-2 p-0.5 rounded-lg border border-surface-border">
                    <button
                      onClick={() => setMetric('maxWeight')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                        metric === 'maxWeight' ? 'bg-surface-3 text-main shadow-sm' : 'text-muted hover:text-main'
                      }`}
                    >
                      {t('history.metrics.weight')}
                    </button>
                    <button
                      onClick={() => setMetric('maxReps')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                        metric === 'maxReps' ? 'bg-surface-3 text-main shadow-sm' : 'text-muted hover:text-main'
                      }`}
                    >
                      {t('history.metrics.reps')}
                    </button>
                  </div>
                </div>
                <ProgressChart 
                   data={chartData} 
                   dataKey={metric} 
                   unit={metric === 'maxWeight' ? 'kg' : 'reps'} 
                />
              </div>
            )}

            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div key={session.date} className="card p-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm capitalize text-main">{formatDate(session.date)}</span>
                    {index === 0 && (
                      <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">{t('exercise.last')}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {session.sets.map((set, setIndex) => (
                      <div key={set.id} className="flex items-center gap-3 text-sm">
                        <span className="text-muted/70 font-mono w-4">#{setIndex + 1}</span>
                        <span className="font-mono font-medium text-main">{set.weight}<span className="text-muted text-xs">kg</span></span>
                        <span className="text-muted">×</span>
                        <span className="font-mono font-medium text-main">{set.reps}<span className="text-muted text-xs">reps</span></span>
                        {set.rir != null && <span className="text-muted text-xs ml-auto">@{set.rir} RIR</span>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-4 text-xs text-muted">
                    <span>{t('history.volume')}: {session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0).toLocaleString()} kg</span>
                    <span>{t('history.max')}: {Math.max(...session.sets.map(set => set.weight))} kg</span>
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
