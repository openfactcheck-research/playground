/**
 * Thin fetch wrapper for the OpenFactCheck API.
 *
 * - Reads base URL from VITE_API_URL
 * - Attaches Cognito ID token (skips when auth is bypassed)
 * - Converts snake_case ↔ camelCase on request/response bodies
 */

import { isAuthBypassed } from '@/lib/amplify'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

// ---------------------------------------------------------------------------
// Case conversion
// ---------------------------------------------------------------------------

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}

function mapKeys(obj: unknown, fn: (key: string) => string): unknown {
  if (Array.isArray(obj))
    return obj.map(item => mapKeys(item, fn))
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), mapKeys(v, fn)]),
    )
  }
  return obj
}

// ---------------------------------------------------------------------------
// Auth token
// ---------------------------------------------------------------------------

async function getAuthToken(): Promise<string | null> {
  if (isAuthBypassed)
    return null

  const { fetchAuthSession } = await import('aws-amplify/auth')
  const session = await fetchAuthSession()
  return session.tokens?.idToken?.toString() ?? null
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL as string | undefined
const TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_000
const RETRYABLE_STATUSES = new Set([502, 503, 504])

async function doFetch(method: HttpMethod, url: string, headers: Record<string, string>, body?: unknown): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    return await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(mapKeys(body, camelToSnake)) : undefined,
      signal: controller.signal,
    })
  }
  finally {
    clearTimeout(timer)
  }
}

function isRetryable(error: unknown, response?: Response): boolean {
  if (error instanceof DOMException && error.name === 'AbortError')
    return true
  if (error instanceof TypeError) // network error
    return true
  if (response && RETRYABLE_STATUSES.has(response.status))
    return true
  return false
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function apiRequest<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL)
    throw new ApiError('API URL not configured', 0)

  const url = `${BASE_URL}${path}`

  const headers: Record<string, string> = {}

  if (body !== undefined)
    headers['Content-Type'] = 'application/json'

  const token = await getAuthToken()
  if (token)
    headers.Authorization = `Bearer ${token}`

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response | undefined
    try {
      response = await doFetch(method, url, headers, body)

      // 204 No Content — no body to parse
      if (response.status === 204)
        return undefined as T

      const data = await response.json()

      if (!response.ok) {
        if (isRetryable(null, response) && attempt === 0) {
          lastError = new ApiError((data as { detail?: string }).detail ?? response.statusText, response.status)
          await delay(RETRY_DELAY_MS)
          continue
        }
        const message = (data as { detail?: string }).detail ?? response.statusText
        const code = (data as { code?: string }).code
        throw new ApiError(message, response.status, code)
      }

      return mapKeys(data, snakeToCamel) as T
    }
    catch (error) {
      if (error instanceof ApiError && !RETRYABLE_STATUSES.has(error.status))
        throw error
      if (isRetryable(error, response) && attempt === 0) {
        lastError = error
        await delay(RETRY_DELAY_MS)
        continue
      }
      throw error instanceof ApiError
        ? error
        : new ApiError(error instanceof Error ? error.message : 'Network error', 0)
    }
  }

  throw lastError instanceof ApiError
    ? lastError
    : new ApiError('Request failed after retry', 0)
}
