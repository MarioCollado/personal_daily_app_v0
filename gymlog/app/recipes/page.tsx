'use client'

import { useEffect, useState } from 'react'
import { ChefHat, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getTodayWorkout, getUserProfile } from '@/lib/db'
import { getDailyMetrics, getRecentMetrics } from '@/lib/metrics'
import type { DailyMetrics } from '@/types'
import type { AIRecipe, RecipeAIProfile } from '@/lib/recipe-ai'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import EmptyState from '@/components/ui/EmptyState'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import IngredientInput from '@/components/recipes/IngredientInput'
import RecipeCard from '@/components/recipes/RecipeCard'
import { btn, card, layout, recipe, text } from '@/styles/components'
import { clsx } from 'clsx'
import { useRouter } from 'next/navigation'

const DEFAULT_PROFILE: RecipeAIProfile = {
  user_id: '',
  weight: null,
  height: null,
  age: null,
  created_at: '',
  updated_at: '',
  height_cm: null,
  gender: 'male',
}

function getLocalISODate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [aiRecipes, setAiRecipes] = useState<AIRecipe[] | null>(null)
  const [contextSummary, setContextSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Partial<DailyMetrics> | null>(null)
  const [hasWorkout, setHasWorkout] = useState(false)
  const [historyMetrics, setHistoryMetrics] = useState<Partial<DailyMetrics>[]>([])
  const [profile, setProfile] = useState<RecipeAIProfile>(DEFAULT_PROFILE)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadContext() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const today = getLocalISODate()
      const [dailyMetrics, workout, recent, userProfile] = await Promise.all([
        getDailyMetrics(user.id, today),
        getTodayWorkout(user.id, today),
        getRecentMetrics(user.id, 3),
        getUserProfile(user.id).catch(() => null),
      ])

      setMetrics(dailyMetrics ?? {})
      setHasWorkout(Boolean(workout))
      setHistoryMetrics(recent)
      setProfile({
        ...(userProfile ?? DEFAULT_PROFILE),
        user_id: user.id,
        height_cm: userProfile?.height ?? null,
        gender: 'male',
      })
      setInitialLoading(false)
    }

    loadContext()
  }, [router])

  async function handleRecommend() {
    if (ingredients.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          metrics: metrics ?? {},
          profile,
          hasWorkout,
          workoutType: null,
          historyMetrics,
        }),
      })

      const json = await response.json() as {
        success: boolean
        isMock?: boolean
        error?: string
        data?: {
          context_summary: string
          recipes: AIRecipe[]
        }
      }

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Error al generar recetas')
      }

      setAiRecipes(json.data.recipes)
      setContextSummary(json.data.context_summary)
      setIsMockMode(Boolean(json.isMock))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al generar recetas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <PageLoader message="Cargando contexto nutricional..." />
  }

  const recipesLabel = aiRecipes
    ? `${aiRecipes.length} recetas ${isMockMode ? '(Preview)' : '(IA)'}`
    : 'Sin recomendaciones aun'

  return (
    <div className={layout.page}>
      <PageHeader innerClassName={layout.headerInner}>
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <h1 className={text.pageTitle}>Recetas</h1>
          </div>
          <p className={text.pageSubtitle}>IA nutricional conectada a tu estado de hoy</p>
        </div>
        <ThemeToggle />
      </PageHeader>

      <main className={layout.main}>
        <div className={recipe.heroBento}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-main">Recomendaciones del día</h2>
              <p className="text-muted text-xs sm:text-sm mt-0.5 leading-relaxed">
                {contextSummary ?? 'Añade ingredientes y genera recetas ajustadas a tu energía, sueño y contexto del día.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[11px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">
                  {hasWorkout ? 'Entreno detectado' : 'Sin entreno registrado'}
                </span>
                <span className="text-[11px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">
                  {metrics?.sleep_hours ? `${metrics.sleep_hours}h sueño` : 'Sueño sin registrar'}
                </span>
                <span className="text-[11px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">
                  {metrics?.energy ? `Energía ${metrics.energy}/5` : 'Energía sin registrar'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <IngredientInput ingredients={ingredients} onChange={setIngredients} />

        <div className={clsx(card.base, 'p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3')}>
          <div>
            <p className="text-sm font-semibold text-main">Genera recetas personalizadas</p>
            <p className="text-xs text-muted mt-1">
              La IA cruza tus métricas del día, tu perfil y los ingredientes disponibles.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRecommend}
            disabled={ingredients.length === 0 || loading}
            title={ingredients.length === 0 ? 'Añade al menos un ingrediente' : undefined}
            className={clsx(
              btn.primary,
              'sm:min-w-[220px]',
              (ingredients.length === 0 || loading) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? 'Generando...' : 'Recomendar recetas'}
          </button>
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            <span>{error}</span>
            <button type="button" onClick={handleRecommend} className="text-red-300 hover:text-red-200 transition-colors">
              Reintentar
            </button>
          </div>
        ) : null}

        {isMockMode && aiRecipes ? (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-amber-400">
            <span>⚡</span>
            <span>Modo preview — Añade tu API key de Anthropic para recomendaciones reales basadas en tus métricas</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className={text.label}>{recipesLabel}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse bg-surface-2 rounded-2xl h-32 border border-surface-border" />
            ))}
          </div>
        ) : aiRecipes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiRecipes.map((recipeItem) => (
              <RecipeCard
                key={`${recipeItem.name}-${recipeItem.calories}`}
                recipe={{
                  ...recipeItem,
                  isAI: !isMockMode,
                  isPreview: isMockMode,
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ChefHat className="w-8 h-8 text-muted" />}
            title="Listo para recomendar"
            description="Añade ingredientes y pulsa el boton para generar recetas ajustadas a tus métricas de hoy."
          />
        )}
      </main>

      <BottomNav />
    </div>
  )
}
