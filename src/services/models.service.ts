/**
 * Models.dev API Service
 * Fetches LLM model data from https://models.dev
 */

const API_URL = 'https://models.dev/api.json'

// Top providers to show (in order)
export const ALLOWED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
] as const

export type ProviderId = typeof ALLOWED_PROVIDERS[number]

export type ModelInfo = {
  id: string
  name: string
  reasoning?: boolean
  tool_call?: boolean
  temperature?: boolean
  release_date?: string
  modalities?: {
    input: string[]
    output: string[]
  }
  cost?: {
    input: number
    output: number
  }
  limit?: {
    context: number
    output: number
  }
}

export type ProviderInfo = {
  id: string
  name: string
  models: Record<string, ModelInfo>
}

export type ModelsData = {
  providers: Map<string, ProviderInfo>
  lastFetched: number
}

// Cache for fetched data (5 minute TTL)
const CACHE_TTL_MS = 5 * 60 * 1000
let cachedData: ModelsData | null = null

/**
 * Fetch all models from models.dev API
 */
export async function fetchModelsData(): Promise<ModelsData> {
  // Return cached data if still valid
  if (cachedData && Date.now() - cachedData.lastFetched < CACHE_TTL_MS) {
    return cachedData
  }

  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const rawData = await response.json() as Record<string, ProviderInfo>
    const providers = new Map<string, ProviderInfo>()

    // Process only top providers
    for (const providerId of ALLOWED_PROVIDERS) {
      const provider = rawData[providerId]
      if (provider) {
        providers.set(providerId, {
          id: providerId,
          name: provider.name || providerId,
          models: provider.models || {},
        })
      }
    }

    cachedData = {
      providers,
      lastFetched: Date.now(),
    }

    return cachedData
  }
  catch (error) {
    console.error('Failed to fetch models.dev data:', error)
    // Return cached data even if stale, or empty fallback
    return cachedData || { providers: new Map(), lastFetched: 0 }
  }
}

/**
 * Get provider display names for dropdown
 */
export async function getProviderOptions(): Promise<Array<[string, string]>> {
  const data = await fetchModelsData()
  const options: Array<[string, string]> = []

  for (const providerId of ALLOWED_PROVIDERS) {
    const provider = data.providers.get(providerId)
    if (provider) {
      options.push([provider.name, providerId])
    }
  }

  return options.length > 0 ? options : [['OpenAI', 'openai']]
}

/**
 * Get model options for a specific provider
 */
export async function getModelOptions(providerId: string): Promise<Array<[string, string]>> {
  const data = await fetchModelsData()
  const provider = data.providers.get(providerId)

  if (!provider || !provider.models) {
    return [['Default Model', 'default']]
  }

  const EXCLUDE: Record<string, RegExp> = {
    openai: /codex|embedding|deep-research|-\d{4}-\d{2}-\d{2}$/i,
    anthropic: /-\d{8}$/,
    google: /embedding|image|tts|live|preview/i,
  }

  const options: Array<[string, string]> = []
  const excludePattern = EXCLUDE[providerId]
  const models = Object.entries(provider.models)
    .filter(([modelId]) => !excludePattern?.test(modelId))

  models.sort(([, a], [, b]) => {
    const da = a.release_date ?? ''
    const db = b.release_date ?? ''
    return db.localeCompare(da)
  })

  for (const [modelId] of models) {
    options.push([modelId, modelId])
  }

  return options.length > 0 ? options : [['Default Model', 'default']]
}

/**
 * Synchronous fallback options (used before async data loads)
 */
export const FALLBACK_PROVIDERS: Array<[string, string]> = [
  ['OpenAI', 'openai'],
  ['Anthropic', 'anthropic'],
  ['Google', 'google'],
  ['Mistral', 'mistral'],
  ['Cohere', 'cohere'],
]

export const FALLBACK_MODELS: Array<[string, string]> = [
  ['Loading...', 'loading'],
]

/**
 * Get model info including capability flags (reasoning, temperature)
 */
export async function getModelInfo(providerId: string, modelId: string): Promise<ModelInfo | null> {
  const data = await fetchModelsData()
  const provider = data.providers.get(providerId)

  if (!provider || !provider.models) {
    return null
  }

  return provider.models[modelId] || null
}

/**
 * Get model info synchronously from cache (returns null if not cached)
 */
export function getModelInfoSync(providerId: string, modelId: string): ModelInfo | null {
  if (!cachedData)
    return null
  const provider = cachedData.providers.get(providerId)
  if (!provider || !provider.models)
    return null
  return provider.models[modelId] || null
}

// Pre-fetch on module load
fetchModelsData().catch(() => {})
