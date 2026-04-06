'use client'
import { useState } from 'react'
import { ChefHat, Sparkles, Plus, X, Clock, Flame, Beef, Search } from 'lucide-react'
import { clsx } from 'clsx'
import BottomNav from '@/components/ui/BottomNav'
import { card, text, btn, recipe, layout, bentoHeader, bentoLabel } from '@/styles/components'
import type { RecipeMock, IngredientMock } from '@/types'

// ─── Mock data ────────────────────────────────────────────────
const MOCK_RECIPES: RecipeMock[] = [
  { id: '1', emoji: '🍗', name: 'Pollo con arroz y verduras', calories: 520, prepMinutes: 20, protein: 42, tags: ['Alto en proteína', '20 min'] },
  { id: '2', emoji: '🥣', name: 'Bowl de avena con plátano', calories: 380, prepMinutes: 5,  protein: 14, tags: ['Desayuno', '5 min'] },
  { id: '3', emoji: '🥗', name: 'Ensalada mediterránea', calories: 310, prepMinutes: 10, protein: 18, tags: ['Ligero', '10 min'] },
  { id: '4', emoji: '🍳', name: 'Huevos revueltos con espinacas', calories: 290, prepMinutes: 8,  protein: 22, tags: ['Post-entreno', '8 min'] },
]

const MOCK_INGREDIENTS: IngredientMock[] = [
  { name: 'Arroz integral', amount: '200g', emoji: '🌾' },
  { name: 'Pechuga de pollo', amount: '150g', emoji: '🍗' },
  { name: 'Avena', amount: '100g', emoji: '🥣' },
  { name: 'Huevos', amount: '4 uds', emoji: '🥚' },
  { name: 'Espinacas', amount: '80g', emoji: '🥬' },
  { name: 'Plátano', amount: '1 ud', emoji: '🍌' },
]

function RecipeCard({ r }: { r: RecipeMock }) {
  return (
    <div className={card.recipe}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{r.emoji}</span>
          <h3 className="font-semibold text-sm sm:text-base leading-tight">{r.name}</h3>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {r.tags.map(tag => (
          <span key={tag} className={clsx(recipe.tag, recipe.tagTime)}>{tag}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-surface-border">
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-mono text-orange-300">{r.calories} kcal</span>
        </div>
        <div className="flex items-center gap-1">
          <Beef className="w-3 h-3 text-brand-400" />
          <span className="text-xs font-mono text-brand-300">{r.protein}g prot.</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-500">{r.prepMinutes} min</span>
        </div>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [activeIngredients, setActiveIngredients] = useState<string[]>([])

  const filtered = MOCK_RECIPES.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleIngredient(name: string) {
    setActiveIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  return (
    <div className={layout.page}>
      {/* Header */}
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-400" />
              <h1 className={text.pageTitle}>Recetas</h1>
            </div>
            <p className={text.pageSubtitle}>Optimiza tu día según tu energía</p>
          </div>
        </div>
      </header>

      <main className={layout.main}>

        {/* Hero bento — IA placeholder */}
        <div className={recipe.heroBento}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg">Recomendaciones del día</h2>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Según tu actividad, energía y objetivos — las recetas ideales para hoy aparecerán aquí.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['🏋️ Entreno completado', '😴 7h sueño', '⚡ Energía media'].map(tag => (
                  <span key={tag} className="text-[11px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-black/20 border border-orange-500/10 rounded-xl px-4 py-2.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <span className="text-xs text-zinc-500 italic">Las sugerencias con IA estarán disponibles pronto.</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar receta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-surface-2 border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors w-full text-sm"
          />
        </div>

        {/* Grid: Ingredientes + Recetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Ingredientes disponibles */}
          <div className={card.base + ' p-4'}>
            <div className={bentoHeader}>
              <div className={bentoLabel}>
                <span className="text-base">🧺</span>
                <span className={text.label}>Ingredientes</span>
              </div>
              <button className={clsx(btn.icon, 'text-zinc-600 hover:text-brand-400')}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1">
              {MOCK_INGREDIENTS.map(ing => (
                <button
                  key={ing.name}
                  onClick={() => toggleIngredient(ing.name)}
                  className={clsx(
                    recipe.ingredient,
                    'w-full text-left transition-colors rounded-lg px-1',
                    activeIngredients.includes(ing.name) ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <span className="text-lg w-7 text-center flex-shrink-0">{ing.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{ing.name}</div>
                    <div className="text-[10px] text-zinc-600">{ing.amount}</div>
                  </div>
                  {activeIngredients.includes(ing.name) && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {activeIngredients.length > 0 && (
              <button
                onClick={() => setActiveIngredients([])}
                className="mt-3 w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar selección
              </button>
            )}
          </div>

          {/* Recetas */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className={text.label}>{filtered.length} recetas</span>
              {activeIngredients.length > 0 && (
                <span className="text-[11px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                  {activeIngredients.length} ingredientes activos
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className={card.base + ' p-8 flex flex-col items-center justify-center text-center gap-3'}>
                <ChefHat className="w-10 h-10 text-zinc-700" />
                <p className="text-zinc-500 text-sm">No se encontraron recetas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(r => <RecipeCard key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
