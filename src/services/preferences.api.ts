/**
 * Preferences API service — calls /api/v1/preferences endpoints.
 */

import type { Preferences } from '@/types/preferences'
import { apiRequest } from '@/lib/api-client'

const BASE = '/api/v1/preferences'

export function fetchPreferences(): Promise<Preferences> {
  return apiRequest<Preferences>('GET', `${BASE}/`)
}

export function updatePreferencesApi(preferences: Preferences): Promise<Preferences> {
  return apiRequest<Preferences>('PUT', `${BASE}/`, preferences)
}
