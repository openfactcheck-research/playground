/**
 * Secret API service — calls /api/v1/secrets endpoints.
 */

import type { Secret } from '@/types/secrets'
import { apiRequest } from '@/lib/api-client'

const BASE = '/api/v1/secrets'

export function fetchSecrets(): Promise<Secret[]> {
  return apiRequest<Secret[]>('GET', `${BASE}/`)
}

export function setSecretApi(name: string, value: string): Promise<Secret> {
  return apiRequest<Secret>('PUT', `${BASE}/${name}`, { value })
}

export function deleteSecretApi(name: string): Promise<void> {
  return apiRequest<void>('DELETE', `${BASE}/${name}`)
}
