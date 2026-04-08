'use client'

import { useState } from 'react'
import { ChevronDown, Flame, Clock3, Beef } from 'lucide-react'
import { clsx } from 'clsx'
import { card, recipe } from '@/styles/components'
import type { AIRecipe } from '@/lib/recipe-ai'

interface Props {
  recipe: AIRecipe & { isAI?: boolean; isPreview?: boolean }
}

export default function RecipeCard({ recipe: recipeItem }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={clsx(card.recipe, 'transition-all duration-300')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none">{recipeItem.emoji}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base text-main leading-tight">{recipeItem.name}</h3>
              {recipeItem.isPreview ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  👁 Preview
                </span>
              ) : recipeItem.isAI ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400">
                  ✨ IA
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={clsx(recipe.tag, recipe.tagCalories)}>
                <Flame className="w-3 h-3 inline mr-1" />
                {recipeItem.calories} kcal
              </span>
              <span className={clsx(recipe.tag, recipe.tagTime)}>
                <Clock3 className="w-3 h-3 inline mr-1" />
                {recipeItem.prep_minutes} min
              </span>
              <span className={clsx(recipe.tag, recipe.tagProtein)}>
                <Beef className="w-3 h-3 inline mr-1" />
                {recipeItem.protein_g}g prot.
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-main transition-colors"
          aria-label={expanded ? 'Contraer receta' : 'Expandir receta'}
        >
          <ChevronDown className={clsx('w-4 h-4 transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="bg-surface-2 border-l-2 border-brand rounded-xl px-3 py-2 mt-3">
        <p className="text-[11px] uppercase tracking-widest text-muted font-semibold">Por que ahora</p>
        <p className="text-sm text-main mt-1">{recipeItem.why}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-2 text-brand-300">
          <span className="block text-[10px] uppercase tracking-widest text-brand-400/80">Proteina</span>
          <span className="font-mono font-semibold">{recipeItem.protein_g}g</span>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-blue-300">
          <span className="block text-[10px] uppercase tracking-widest text-blue-300/80">Carbos</span>
          <span className="font-mono font-semibold">{recipeItem.carbs_g}g</span>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-orange-300">
          <span className="block text-[10px] uppercase tracking-widest text-orange-300/80">Grasa</span>
          <span className="font-mono font-semibold">{recipeItem.fat_g}g</span>
        </div>
      </div>

      <div className={clsx('overflow-hidden transition-all duration-300', expanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0')}>
        <div className="grid md:grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">Ingredientes</p>
            <ul className="space-y-1 text-sm text-main">
              {recipeItem.ingredients.map((ingredient) => (
                <li key={ingredient} className="flex gap-2">
                  <span className="text-brand">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">Pasos</p>
            <ol className="space-y-1.5 text-sm text-main">
              {recipeItem.steps.map((step, index) => (
                <li key={`${recipeItem.name}-${index}`} className="flex gap-2">
                  <span className="text-muted font-mono">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
