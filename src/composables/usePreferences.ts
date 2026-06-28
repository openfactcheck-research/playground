/**
 * Preference state management — load and update account-level user preferences.
 */

import type { Preferences } from '@/types/preferences'
import { computed, ref } from 'vue'
import { fetchPreferences, updatePreferencesApi } from '@/services/preferences.api'

const DEFAULTS: Preferences = { tourCompleted: false }

const preferencesCache = ref<Preferences>({ ...DEFAULTS })
let loaded = false

export function usePreferences() {
  const preferences = computed<Preferences>(() => preferencesCache.value)

  async function loadPreferences(force = false): Promise<void> {
    if (loaded && !force)
      return
    try {
      preferencesCache.value = await fetchPreferences()
      loaded = true
    }
    catch {
      // Preferences are non-critical background state; keep the defaults on failure.
    }
  }

  async function updatePreferences(updates: Partial<Preferences>): Promise<void> {
    preferencesCache.value = { ...preferencesCache.value, ...updates }
    try {
      preferencesCache.value = await updatePreferencesApi(preferencesCache.value)
      loaded = true
    }
    catch {
      // Keep the optimistic value; the next load reconciles with the server.
    }
  }

  return { preferences, loadPreferences, updatePreferences }
}
