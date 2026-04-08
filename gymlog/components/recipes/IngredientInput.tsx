'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { btn, input } from '@/styles/components'
import { clsx } from 'clsx'

interface Props {
  ingredients: string[]
  onChange: (ingredients: string[]) => void
}

const MAX_INGREDIENTS = 15

function formatIngredient(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default function IngredientInput({ ingredients, onChange }: Props) {
  const [value, setValue] = useState('')
  const [warning, setWarning] = useState<string | null>(null)

  const addIngredient = () => {
    const formatted = formatIngredient(value)
    if (!formatted) return

    if (ingredients.some(item => item.toLowerCase() === formatted.toLowerCase())) {
      setWarning('Ese ingrediente ya esta en la lista.')
      return
    }

    if (ingredients.length >= MAX_INGREDIENTS) {
      setWarning('Maximo 15 ingredientes.')
      return
    }

    onChange([...ingredients, formatted])
    setValue('')
    setWarning(null)
  }

  const removeIngredient = (ingredient: string) => {
    onChange(ingredients.filter(item => item !== ingredient))
    setWarning(null)
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addIngredient()
            }
          }}
          className={input.base}
          placeholder="ej: pollo, arroz, espinacas..."
        />
        <button type="button" onClick={addIngredient} className={clsx(btn.primary, 'px-4 py-2.5 flex items-center gap-2')}>
          <Plus className="w-4 h-4" />
          Anadir
        </button>
      </div>

      {warning ? (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {warning}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <span
            key={ingredient}
            className="inline-flex items-center gap-2 bg-surface-2 border border-surface-border rounded-full px-3 py-1.5 text-sm text-main"
          >
            {ingredient}
            <button
              type="button"
              onClick={() => removeIngredient(ingredient)}
              className="text-muted hover:text-red-400 transition-colors"
              aria-label={`Eliminar ${ingredient}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
