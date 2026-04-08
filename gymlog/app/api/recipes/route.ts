import { NextRequest, NextResponse } from 'next/server'
import type { DailyMetrics, UserProfile } from '@/types'
import type { ActivityLevel, AIRecipe, AIRecipesResponse, RecipeAIProfile } from '@/lib/recipe-ai'
import {
  buildMockResponse,
  buildNutritionalStrategy,
  buildPrompt,
  calcTDEE,
  interpretMetrics,
  validateAndRankRecipes,
} from '@/lib/recipe-ai'

type RecipesRequestBody = {
  ingredients: string[]
  metrics: Partial<DailyMetrics>
  profile: UserProfile & { height_cm?: number | null; gender?: 'male' | 'female' }
  hasWorkout: boolean
  workoutType: 'strength' | 'cardio' | null
  historyMetrics: Partial<DailyMetrics>[]
}

type AnthropicTextBlock = {
  type: 'text'
  text: string
}

type AnthropicResponse = {
  content: AnthropicTextBlock[]
}

// Comprueba de forma estricta que el body tiene la forma esperada.
function isValidBody(body: unknown): body is RecipesRequestBody {
  if (!body || typeof body !== 'object') return false
  const candidate = body as Partial<RecipesRequestBody>

  return (
    Array.isArray(candidate.ingredients) &&
    typeof candidate.hasWorkout === 'boolean' &&
    (candidate.workoutType === 'strength' || candidate.workoutType === 'cardio' || candidate.workoutType === null) &&
    Array.isArray(candidate.historyMetrics) &&
    typeof candidate.metrics === 'object' &&
    candidate.metrics !== null &&
    typeof candidate.profile === 'object' &&
    candidate.profile !== null
  )
}

// Limpia y normaliza la lista de ingredientes recibida desde el cliente.
function normalizeIngredients(ingredients: string[]): string[] {
  return Array.from(
    new Set(
      ingredients
        .map(item => item.trim())
        .filter(Boolean)
    )
  )
}

// Extrae el primer bloque JSON razonable desde la salida del modelo.
function extractJSONObject(text: string): string | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return text.slice(start, end + 1)
}

// Llama a Anthropic con timeout y devuelve el texto plano concatenado.
async function callAnthropic(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'Eres un nutricionista deportivo experto. Responde siempre en espanol y unicamente con JSON valido.',
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`)
    }

    const data = await response.json() as AnthropicResponse
    return data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim()
  } finally {
    clearTimeout(timeout)
  }
}

// Intenta parsear la respuesta JSON del modelo y reintenta una vez si hace falta.
async function requestRecipesFromAnthropic(apiKey: string, prompt: string): Promise<AIRecipesResponse> {
  const firstRaw = await callAnthropic(apiKey, [{ role: 'user', content: prompt }])
  const firstJSON = extractJSONObject(firstRaw)

  if (firstJSON) {
    return JSON.parse(firstJSON) as AIRecipesResponse
  }

  const retryRaw = await callAnthropic(apiKey, [
    { role: 'user', content: prompt },
    { role: 'assistant', content: firstRaw },
    { role: 'user', content: 'Tu respuesta anterior no era JSON valido. Responde solo con el JSON.' },
  ])

  const retryJSON = extractJSONObject(retryRaw)
  if (!retryJSON) {
    throw new Error('No se pudo extraer JSON valido de la respuesta del modelo.')
  }

  return JSON.parse(retryJSON) as AIRecipesResponse
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Body invalido.' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ success: false, error: 'Body invalido.' }, { status: 400 })
  }

  const ingredients = normalizeIngredients(body.ingredients)
  if (ingredients.length === 0) {
    return NextResponse.json({ success: false, error: 'Debes enviar al menos un ingrediente.' }, { status: 400 })
  }

  try {
    const profile: RecipeAIProfile = {
      ...body.profile,
      height_cm: body.profile.height_cm ?? body.profile.height ?? null,
    }

    const signals = interpretMetrics(
      body.metrics,
      profile,
      body.hasWorkout,
      body.workoutType,
      body.historyMetrics
    )

    const activityLevel: ActivityLevel = body.hasWorkout ? 'active' : 'light'
    const tdee = calcTDEE(profile, activityLevel)
    const strategy = buildNutritionalStrategy(signals, tdee, signals.mealType)

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        isMock: true,
        data: buildMockResponse(ingredients, strategy),
      })
    }

    const prompt = buildPrompt(ingredients, signals, strategy, {
      ...profile,
      tdee,
      currentMetrics: body.metrics,
    })

    const modelResponse = await requestRecipesFromAnthropic(apiKey, prompt)
    const rankedRecipes = validateAndRankRecipes(modelResponse.recipes as unknown as AIRecipe[], strategy)

    if (rankedRecipes.length === 0) {
      throw new Error('La respuesta del modelo no contenia recetas validas.')
    }

    return NextResponse.json({
      success: true,
      data: {
        context_summary: modelResponse.context_summary?.slice(0, 120) || strategy.primaryGoal,
        recipes: rankedRecipes,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al generar recetas.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
