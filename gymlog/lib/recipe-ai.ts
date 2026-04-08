import type { DailyMetrics, UserProfile } from '@/types'

export type PhysicalState = 'exhausted' | 'low' | 'normal' | 'energized' | 'peak'
export type StressState = 'calm' | 'mild' | 'moderate' | 'high' | 'critical'
export type RecoveryNeed = 'urgent' | 'moderate' | 'normal' | 'none'
export type TimeAvailable = 'none' | 'minimal' | 'moderate' | 'ample'
export type BodyComposition = 'underweight' | 'lean' | 'normal' | 'overweight' | 'obese'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'

export interface InterpretedSignals {
  physicalState: PhysicalState
  stressState: StressState
  recoveryNeed: RecoveryNeed
  timeAvailable: TimeAvailable
  bodyComposition: BodyComposition
  mealType: MealType
  isPostWorkout: boolean
  isPostStrength: boolean
  isPostCardio: boolean
  sleepDebt: number
  hasSleepDebt: boolean
}

export interface NutritionalStrategy {
  primaryGoal: string
  secondaryGoals: string[]
  calorieTarget: number
  macroRatio: {
    protein: number
    carbs: number
    fat: number
  }
  maxPrepMinutes: number
  priorityNutrients: string[]
  avoidNutrients: string[]
  recipeCount: number
  contextNote: string
}

export interface AIRecipe {
  name: string
  emoji: string
  calories: number
  prep_minutes: number
  protein_g: number
  carbs_g: number
  fat_g: number
  why: string
  ingredients: string[]
  steps: string[]
}

export interface AIRecipesResponse {
  context_summary: string
  recipes: AIRecipe[]
}

export type RecipeAIProfile = UserProfile & {
  height_cm?: number | null
  gender?: 'male' | 'female'
  tdee?: number
  currentMetrics?: Partial<DailyMetrics> | null
}

export type ValidatedAIRecipe = AIRecipe & { outOfRange?: boolean }

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))

const toSentence = (values: string[]) => values.length ? unique(values).join(', ') : 'Ninguno'

// Calcula el gasto total diario con Mifflin-St Jeor y un multiplicador de actividad.
export function calcTDEE(profile: RecipeAIProfile, activityLevel: ActivityLevel): number {
  const weight = profile.weight ?? 70
  // Fallback razonable cuando el usuario aun no ha guardado altura en perfil.
  const heightCm = profile.height_cm ?? profile.height ?? 170
  const age = profile.age ?? 30
  const gender = profile.gender ?? 'male'
  const bmrBase = 10 * weight + 6.25 * heightCm - 5 * age
  const bmr = gender === 'female' ? bmrBase - 161 : bmrBase + 5
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// Devuelve el objetivo calorico segun el momento del dia.
export function getMealCalorieTarget(tdee: number, mealType: MealType): number {
  const multipliers: Record<MealType, number> = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.3,
    snack: 0.1,
  }
  return Math.round(tdee * multipliers[mealType])
}

// Detecta automaticamente el tipo de comida segun la hora local.
export function detectMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 20) return 'dinner'
  return 'snack'
}

// Clasifica la composicion corporal desde IMC o un fallback por peso absoluto.
export function getBodyComposition(weight: number | null | undefined, heightCm?: number | null): BodyComposition {
  const safeWeight = weight ?? 70

  if (heightCm && heightCm > 0) {
    const heightM = heightCm / 100
    const bmi = safeWeight / (heightM * heightM)
    if (bmi < 18.5) return 'underweight'
    if (bmi < 21.5) return 'lean'
    if (bmi < 25) return 'normal'
    if (bmi < 30) return 'overweight'
    return 'obese'
  }

  if (safeWeight < 55) return 'underweight'
  if (safeWeight < 65) return 'lean'
  if (safeWeight < 85) return 'normal'
  if (safeWeight < 100) return 'overweight'
  return 'obese'
}

// Interpreta metricas crudas y las convierte en senales utiles para nutricion.
export function interpretMetrics(
  metrics: Partial<DailyMetrics> | null,
  profile: RecipeAIProfile,
  hasWorkout: boolean,
  workoutType: 'strength' | 'cardio' | null,
  historyMetrics: Partial<DailyMetrics>[]
): InterpretedSignals {
  const sleepHours = metrics?.sleep_hours ?? 7
  const energy = metrics?.energy ?? 3
  const stress = metrics?.stress ?? 3
  const freeTime = metrics?.free_time ?? 3
  const recentWindow = historyMetrics.slice(0, 3)
  const sleepDebt = Number(
    recentWindow
      .reduce((sum, item) => sum + Math.max(0, 7.5 - (item.sleep_hours ?? 7.5)), 0)
      .toFixed(1)
  )

  const sleepScore = clamp((sleepHours - 4.5) / 4, 0, 1)
  const energyScore = clamp((energy - 1) / 4, 0, 1)
  const weightedState = sleepScore * 0.6 + energyScore * 0.4

  let physicalState: PhysicalState
  if (sleepHours < 5 || energy === 1) physicalState = 'exhausted'
  else if (sleepHours >= 8.5 && energy >= 5) physicalState = 'peak'
  else if (sleepHours >= 8 && energy >= 4 && weightedState >= 0.72) physicalState = 'energized'
  else if (weightedState < 0.38) physicalState = 'low'
  else physicalState = 'normal'

  const stressMap: Record<number, StressState> = {
    1: 'calm',
    2: 'mild',
    3: 'moderate',
    4: 'high',
    5: 'critical',
  }

  const timeAvailable: TimeAvailable =
    freeTime <= 1 ? 'none'
      : freeTime === 2 ? 'minimal'
        : freeTime === 3 ? 'moderate'
          : 'ample'

  const isPostWorkout = hasWorkout
  const isPostStrength = hasWorkout && workoutType === 'strength'
  const isPostCardio = hasWorkout && workoutType === 'cardio'
  const hasSleepDebt = sleepDebt > 1

  let recoveryNeed: RecoveryNeed = 'normal'
  if (isPostStrength && (physicalState === 'low' || physicalState === 'exhausted')) {
    recoveryNeed = 'urgent'
  } else if (isPostStrength || isPostCardio || (hasWorkout && hasSleepDebt)) {
    recoveryNeed = 'moderate'
  } else if (!hasWorkout && !hasSleepDebt && (physicalState === 'energized' || physicalState === 'peak')) {
    recoveryNeed = 'none'
  }

  return {
    physicalState,
    stressState: stressMap[stress] ?? 'moderate',
    recoveryNeed,
    timeAvailable,
    bodyComposition: getBodyComposition(profile.weight, profile.height_cm ?? profile.height),
    mealType: detectMealType(),
    isPostWorkout,
    isPostStrength,
    isPostCardio,
    sleepDebt,
    hasSleepDebt,
  }
}

// Construye una estrategia nutricional fusionando reglas segun el contexto actual.
export function buildNutritionalStrategy(
  signals: InterpretedSignals,
  tdee: number,
  mealType: MealType
): NutritionalStrategy {
  const mealCalorieTarget = getMealCalorieTarget(tdee, mealType)
  const strategy: NutritionalStrategy = {
    primaryGoal: 'Nutricion equilibrada para rendimiento estable',
    secondaryGoals: [],
    calorieTarget: mealCalorieTarget,
    macroRatio: {
      protein: 0.3,
      carbs: 0.4,
      fat: 0.3,
    },
    maxPrepMinutes: mealType === 'snack' ? 10 : 20,
    priorityNutrients: ['proteina magra', 'fibra', 'micronutrientes'],
    avoidNutrients: [],
    recipeCount: signals.timeAvailable === 'ample' ? 4 : 3,
    contextNote: 'Equilibra saciedad, digestibilidad y adherencia al contexto del usuario.',
  }

  let primaryPriority = 0

  const setPrimary = (priority: number, goal: string) => {
    if (priority > primaryPriority) {
      if (primaryPriority > 0 && strategy.primaryGoal !== goal) {
        strategy.secondaryGoals.push(strategy.primaryGoal)
      }
      strategy.primaryGoal = goal
      primaryPriority = priority
      return
    }

    if (strategy.primaryGoal !== goal) {
      strategy.secondaryGoals.push(goal)
    }
  }

  const addContext = (text: string) => {
    if (!strategy.contextNote.includes(text)) {
      strategy.contextNote = `${strategy.contextNote} ${text}`.trim()
    }
  }

  const addPriority = (items: string[]) => {
    strategy.priorityNutrients = unique([...strategy.priorityNutrients, ...items])
  }

  const addAvoid = (items: string[]) => {
    strategy.avoidNutrients = unique([...strategy.avoidNutrients, ...items])
  }

  if (signals.physicalState === 'exhausted') {
    setPrimary(95, 'Estabilizacion energetica y digestion suave')
    strategy.maxPrepMinutes = Math.min(strategy.maxPrepMinutes, 10)
    strategy.macroRatio = { protein: 0.25, carbs: 0.55, fat: 0.2 }
    strategy.priorityNutrients = ['magnesio', 'triptofano', 'carbohidratos complejos', 'B6']
    strategy.avoidNutrients = ['cafeina', 'azucar refinada', 'grasas saturadas pesadas']
    strategy.recipeCount = 3
    strategy.contextNote = 'El usuario esta agotado. Prioriza reconfort, digestion facil y estabilizacion glucemica. Nada elaborado.'
  }

  if (signals.isPostStrength && signals.recoveryNeed === 'urgent') {
    setPrimary(100, 'Recuperacion muscular y sintesis proteica')
    strategy.macroRatio = { protein: 0.4, carbs: 0.4, fat: 0.2 }
    addPriority(['proteina completa', 'leucina', 'carbohidratos moderados', 'creatina natural'])
    addAvoid(['alta grasa en exceso (ralentiza absorcion proteica)'])
    strategy.contextNote = 'Post-entreno de fuerza. La proteina es la prioridad absoluta. Minimo 30g por receta.'
  }

  if (signals.isPostCardio) {
    setPrimary(85, 'Reponer glucogeno y rehidratacion')
    strategy.macroRatio = { protein: 0.25, carbs: 0.55, fat: 0.2 }
    addPriority(['carbohidratos medios', 'electrolitos', 'proteina moderada', 'vitamina C'])
    addContext('Post-cardio. Reponer glucogeno primero, luego proteina. Evitar picos glucemicos puros.')
  }

  if (signals.stressState === 'high' || signals.stressState === 'critical') {
    setPrimary(75, 'Reducir inflamacion y regular sistema nervioso')
    addPriority(['omega-3', 'magnesio', 'vitamina C', 'polifenoles', 'probioticos'])
    addAvoid(['cafeina', 'azucar refinada', 'alcohol', 'ultraprocesados'])
    addContext('Alto estres detectado. Las recetas deben ser antiinflamatorias y reconfortantes. Nada que eleve el cortisol.')
  }

  if (signals.bodyComposition === 'underweight' && signals.isPostWorkout) {
    setPrimary(60, 'Superavit calorico para recuperacion')
    strategy.calorieTarget = Math.round(strategy.calorieTarget * 1.25)
    strategy.macroRatio = { protein: 0.3, carbs: 0.45, fat: 0.25 }
    addContext('Atleta con bajo peso que ha entrenado. Necesita densidad calorica alta.')
  }

  if (signals.bodyComposition === 'overweight' || signals.bodyComposition === 'obese') {
    setPrimary(60, 'Deficit calorico suave con saciedad alta')
    strategy.calorieTarget = Math.round(strategy.calorieTarget * 0.85)
    addPriority(['fibra', 'proteina magra', 'agua', 'verduras de volumen'])
    addContext('El usuario tiene sobrepeso. Prioriza volumen y saciedad sobre densidad calorica.')
  }

  if (signals.timeAvailable === 'none' || signals.timeAvailable === 'minimal') {
    strategy.maxPrepMinutes = 12
    strategy.secondaryGoals.push('Preparacion ultra-rapida')
    addContext('Maximo 12 minutos de preparacion, sin excepciones.')
  }

  if (mealType === 'dinner' && signals.hasSleepDebt) {
    addPriority(['triptofano', 'magnesio', 'melatonina natural (cerezas, kiwi si disponible)'])
    addAvoid(['cafeina', 'azucar', 'alcohol', 'comidas muy copiosas'])
    addContext('Es cena y el usuario tiene deuda de sueno. Anade ingredientes que favorezcan el sueno.')
  }

  strategy.secondaryGoals = unique(strategy.secondaryGoals.filter(goal => goal !== strategy.primaryGoal))
  strategy.priorityNutrients = unique(strategy.priorityNutrients)
  strategy.avoidNutrients = unique(strategy.avoidNutrients)
  strategy.recipeCount = clamp(strategy.recipeCount, 3, 5)

  return strategy
}

// Construye el prompt final que se envia al modelo con todo el contexto calculado.
export function buildPrompt(
  ingredients: string[],
  signals: InterpretedSignals,
  strategy: NutritionalStrategy,
  profile: RecipeAIProfile
): string {
  const metrics = profile.currentMetrics ?? {}
  const tdee = profile.tdee ?? calcTDEE(profile, 'light')
  const sleepHours = metrics.sleep_hours ?? 0
  const energy = metrics.energy ?? 3
  const motivation = metrics.motivation ?? 3
  const age = profile.age ?? 'N/D'
  const weight = profile.weight ?? 70
  const heightValue = profile.height_cm ?? profile.height
  const heightStr = heightValue ? ` | Altura: ${heightValue}cm` : ''
  const trainingType = signals.isPostStrength ? 'Fuerza' : signals.isPostCardio ? 'Cardio' : signals.isPostWorkout ? 'Entreno' : 'No'
  const sleepText = signals.hasSleepDebt
    ? `${sleepHours}h (deficit acumulado ${signals.sleepDebt}h)`
    : `${sleepHours}h (sin deficit)`

  return [
    'Eres un nutricionista deportivo y chef especializado en nutricion funcional.',
    '',
    'PERFIL DEL USUARIO:',
    `- Edad: ${age} anos | Peso: ${weight}kg${heightStr}`,
    `- Composicion corporal: ${signals.bodyComposition}`,
    `- TDEE estimado: ${tdee} kcal/dia`,
    '',
    'ESTADO ACTUAL (hoy):',
    `- Estado fisico: ${signals.physicalState} | Estres: ${signals.stressState}`,
    `- Sueno: ${sleepText}`,
    `- Energia: ${energy}/5 | Motivacion: ${motivation}/5`,
    `- Entrenamiento hoy: ${trainingType}`,
    `- Necesidad de recuperacion: ${signals.recoveryNeed}`,
    `- Momento del dia: ${signals.mealType}`,
    `- Tiempo disponible para cocinar: ${signals.timeAvailable} (max ${strategy.maxPrepMinutes} min)`,
    '',
    'ESTRATEGIA NUTRICIONAL CALCULADA:',
    `- Objetivo principal: ${strategy.primaryGoal}`,
    `- Objetivos secundarios: ${toSentence(strategy.secondaryGoals)}`,
    `- Calorias objetivo para esta comida: ${strategy.calorieTarget} kcal`,
    `- Ratio macro objetivo: ${Math.round(strategy.macroRatio.protein * 100)}% proteina / ${Math.round(strategy.macroRatio.carbs * 100)}% carbohidratos / ${Math.round(strategy.macroRatio.fat * 100)}% grasa`,
    `- Nutrientes a priorizar: ${toSentence(strategy.priorityNutrients)}`,
    `- Nutrientes/ingredientes a evitar: ${toSentence(strategy.avoidNutrients)}`,
    '',
    `NOTA DE CONTEXTO: ${strategy.contextNote}`,
    '',
    `INGREDIENTES DISPONIBLES: ${ingredients.join(', ')}`,
    '',
    'INSTRUCCIONES:',
    `1. Genera exactamente ${strategy.recipeCount} recetas usando principalmente los ingredientes listados.`,
    '2. Puedes asumir que el usuario tiene aceite, sal, pimienta, agua y especias basicas.',
    '3. Si un ingrediente disponible conflictua con los nutrientes a evitar, no lo uses en esa receta.',
    '4. Ordena las recetas de mas a menos apropiadas para el estado actual.',
    '5. La primera receta debe cumplir TODOS los objetivos. Las siguientes pueden priorizar el objetivo principal.',
    '6. El campo "why" debe explicar especificamente por que esa receta es buena para el estado de HOY del usuario (no generico).',
    '7. Los pasos deben ser concretos y numerados, maximo 6 pasos por receta.',
    '8. Responde UNICAMENTE con JSON valido. Sin markdown, sin texto antes o despues, sin bloques de codigo.',
    '',
    'FORMATO DE RESPUESTA (JSON exacto):',
    '{',
    '  "context_summary": "string de maximo 120 caracteres explicando el enfoque general",',
    '  "recipes": [',
    '    {',
    '      "name": "string",',
    '      "emoji": "string (1 emoji)",',
    '      "calories": number,',
    '      "prep_minutes": number,',
    '      "protein_g": number,',
    '      "carbs_g": number,',
    '      "fat_g": number,',
    '      "why": "string de maximo 100 caracteres",',
    '      "ingredients": ["string con cantidad"],',
    '      "steps": ["string"] (maximo 6 pasos)',
    '    }',
    '  ]',
    '}',
  ].join('\n')
}

// Genera una respuesta preview coherente cuando aun no existe la API key.
export function buildMockResponse(ingredients: string[], strategy: NutritionalStrategy): AIRecipesResponse {
  const baseIngredients = unique(ingredients.map(item => item.trim()).filter(Boolean))
  const first = baseIngredients[0] ?? 'Pollo'
  const second = baseIngredients[1] ?? 'Arroz'
  const third = baseIngredients[2] ?? 'Espinacas'
  const maxPrep = Math.max(5, strategy.maxPrepMinutes)
  const target = strategy.calorieTarget

  return {
    context_summary: 'Vista previa — conecta tu API key de Anthropic para recomendaciones reales',
    recipes: [
      {
        name: `Bowl proteico de ${first} con ${second}`,
        emoji: '🍲',
        calories: Math.round(target * 0.95),
        prep_minutes: Math.min(maxPrep, 12),
        protein_g: 34,
        carbs_g: 42,
        fat_g: 16,
        why: 'Alta en proteina y facil de digerir para apoyar el objetivo principal de hoy.',
        ingredients: [`180g ${first}`, `120g ${second}`, `80g ${third}`, '1 cda aceite de oliva'],
        steps: [
          `Cocina ${second.toLowerCase()} segun el formato que tengas disponible.`,
          `Saltea ${first.toLowerCase()} con aceite y especias durante 5-6 minutos.`,
          `Anade ${third.toLowerCase()} al final para que conserve textura.`,
          'Mezcla todo en un bol y ajusta sal, pimienta y especias suaves.',
        ],
      },
      {
        name: `Salteado equilibrado de ${second} y ${third}`,
        emoji: '🥗',
        calories: Math.round(target),
        prep_minutes: Math.min(maxPrep, 15),
        protein_g: 28,
        carbs_g: 48,
        fat_g: 14,
        why: 'Equilibra energia sostenida y saciedad sin alejarse del tiempo disponible.',
        ingredients: [`150g ${second}`, `120g ${third}`, `120g ${first}`, 'Hierbas secas al gusto'],
        steps: [
          `Prepara ${second.toLowerCase()} en una base rapida o usa una version ya cocida.`,
          `Saltea ${first.toLowerCase()} con especias hasta que quede dorado.`,
          `Incorpora ${third.toLowerCase()} y cocina 2 minutos mas.`,
          'Sirve junto y termina con hierbas y un chorrito de aceite.',
        ],
      },
      {
        name: `Plato ligero de ${first} con ${third}`,
        emoji: '🥣',
        calories: Math.round(target * 0.8),
        prep_minutes: Math.min(maxPrep, 10),
        protein_g: 26,
        carbs_g: 24,
        fat_g: 12,
        why: 'Opcion ligera y rapida si hoy conviene algo facil, saciante y menos pesado.',
        ingredients: [`140g ${first}`, `100g ${third}`, `60g ${second}`, 'Caldo o agua', 'Especias basicas'],
        steps: [
          `Cocina ${first.toLowerCase()} en trozos pequenos con una pequena cantidad de aceite.`,
          `Anade ${third.toLowerCase()} y ${second.toLowerCase()} en cantidad moderada.`,
          'Incorpora un poco de agua o caldo para dar jugosidad.',
          'Cocina 3-4 minutos mas y sirve caliente.',
        ],
      },
    ],
  }
}

// Valida recetas generadas, marca desviaciones caloricas y las ordena por calidad.
export function validateAndRankRecipes(recipes: unknown[], strategy: NutritionalStrategy): ValidatedAIRecipe[] {
  const validated: ValidatedAIRecipe[] = []

  for (const recipe of recipes) {
    if (!recipe || typeof recipe !== 'object') continue
    const candidate = recipe as Partial<AIRecipe>

    if (
      typeof candidate.name !== 'string' ||
      typeof candidate.emoji !== 'string' ||
      typeof candidate.calories !== 'number' ||
      typeof candidate.prep_minutes !== 'number' ||
      typeof candidate.protein_g !== 'number' ||
      typeof candidate.carbs_g !== 'number' ||
      typeof candidate.fat_g !== 'number' ||
      typeof candidate.why !== 'string' ||
      !Array.isArray(candidate.ingredients) ||
      !Array.isArray(candidate.steps)
    ) {
      continue
    }

    const outOfRange = Math.abs(candidate.calories - strategy.calorieTarget) > strategy.calorieTarget * 0.4

    validated.push({
      name: candidate.name.trim(),
      emoji: candidate.emoji.trim().slice(0, 2),
      calories: Math.round(candidate.calories),
      prep_minutes: Math.round(candidate.prep_minutes),
      protein_g: Math.round(candidate.protein_g),
      carbs_g: Math.round(candidate.carbs_g),
      fat_g: Math.round(candidate.fat_g),
      why: candidate.why.trim().slice(0, 100),
      ingredients: candidate.ingredients.filter((item): item is string => typeof item === 'string').slice(0, 20),
      steps: candidate.steps.filter((item): item is string => typeof item === 'string').slice(0, 6),
      outOfRange,
    })
  }

  return validated
    .sort((a, b) => {
      if (Boolean(a.outOfRange) !== Boolean(b.outOfRange)) {
        return a.outOfRange ? 1 : -1
      }
      return Math.abs(a.calories - strategy.calorieTarget) - Math.abs(b.calories - strategy.calorieTarget)
    })
    .slice(0, 5)
}
