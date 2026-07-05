/**
 * Project secret state — load, set, and delete a project's secret overrides.
 *
 * Scoped to one project (not a shared singleton like useSecrets), so the page
 * holds its own list for the project it is viewing.
 */

import type { Secret } from '@/types/secrets'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { deleteProjectSecretApi, fetchProjectSecrets, setProjectSecretApi } from '@/services/projectSecrets.api'

export function useProjectSecrets(projectId: string) {
  const secrets = ref<Secret[]>([])
  const loading = ref(false)

  async function loadProjectSecrets(): Promise<void> {
    loading.value = true
    try {
      secrets.value = await fetchProjectSecrets(projectId)
    }
    catch {
      toast.error('Failed to load project secrets')
    }
    finally {
      loading.value = false
    }
  }

  async function setProjectSecret(name: string, value: string): Promise<boolean> {
    try {
      const secret = await setProjectSecretApi(projectId, name, value)
      const index = secrets.value.findIndex(s => s.name === name)
      if (index >= 0)
        secrets.value[index] = secret
      else
        secrets.value = [...secrets.value, secret].sort((a, b) => a.name.localeCompare(b.name))
      toast.success(`Saved ${name} override`)
      return true
    }
    catch {
      toast.error(`Failed to save ${name} override`)
      return false
    }
  }

  async function removeProjectSecret(name: string): Promise<void> {
    try {
      await deleteProjectSecretApi(projectId, name)
      secrets.value = secrets.value.filter(s => s.name !== name)
      toast.success(`Removed ${name} override`)
    }
    catch {
      toast.error(`Failed to revert ${name}`)
    }
  }

  return { secrets, loading, loadProjectSecrets, setProjectSecret, removeProjectSecret }
}
