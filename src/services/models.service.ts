/**
 * Models.dev API Service
 * Fetches LLM model data from https://models.dev
 */

const API_URL = 'https://models.dev/api.json'

// Top providers to show (in order)
export const TOP_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'mistral',
  'cohere',
  'groq',
  'together-ai',
  'fireworks',
  'deepseek',
  'xai',
  'huggingface',
  'cerebras',
  'github-models',
] as const

export type ProviderId = typeof TOP_PROVIDERS[number]

export type ModelInfo = {
  id: string
  name: string
  reasoning?: boolean
  tool_call?: boolean
  temperature?: boolean
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
    for (const providerId of TOP_PROVIDERS) {
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

  for (const providerId of TOP_PROVIDERS) {
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

  const options: Array<[string, string]> = []
  const models = Object.entries(provider.models)

  // Sort models: prefer non-deprecated, then by name
  models.sort(([, a], [, b]) => {
    // Prefer models with tool_call support
    if (a.tool_call !== b.tool_call)
      return a.tool_call ? -1 : 1
    // Then sort alphabetically by display name
    return (a.name || '').localeCompare(b.name || '')
  })

  // Include all models
  for (const [modelId, model] of models) {
    options.push([model.name || modelId, modelId])
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
