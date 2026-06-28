/**
 * Secret state management — load, set, and delete user API credentials.
 */

import type { Secret } from '@/types/secrets'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { deleteSecretApi, fetchSecrets, setSecretApi } from '@/services/secrets.api'

const secretsCache = ref<Secret[]>([])
const loading = ref(false)
let loaded = false

export function useSecrets() {
  const secrets = computed<Secret[]>(() => secretsCache.value)

  async function loadSecrets(force = false): Promise<void> {
    if (loaded && !force)
      return
    loading.value = true
    try {
      secretsCache.value = await fetchSecrets()
      loaded = true
    }
    catch {
      toast.error('Failed to load secrets')
    }
    finally {
      loading.value = false
    }
  }

  async function setSecret(name: string, value: string): Promise<boolean> {
    try {
      const secret = await setSecretApi(name, value)
      const index = secretsCache.value.findIndex(s => s.name === name)
      if (index >= 0)
        secretsCache.value[index] = secret
      else
        secretsCache.value = [...secretsCache.value, secret].sort((a, b) => a.name.localeCompare(b.name))
      toast.success(`Saved ${name} key`)
      return true
    }
    catch {
      toast.error(`Failed to save ${name} key`)
      return false
    }
  }

  async function removeSecret(name: string): Promise<void> {
    try {
      await deleteSecretApi(name)
      secretsCache.value = secretsCache.value.filter(s => s.name !== name)
      toast.success(`Removed ${name} key`)
    }
    catch {
      toast.error(`Failed to remove ${name} key`)
    }
  }

  return { secrets, loading, loadSecrets, setSecret, removeSecret }
}
