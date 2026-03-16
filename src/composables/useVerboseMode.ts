import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useProjects } from '@/composables/useProjects'

export function useVerboseMode(projectId: MaybeRefOrGetter<string>, workspaceId: MaybeRefOrGetter<string>) {
  const { user } = useAuth()
  const { getWorkspace, updateWorkspace } = useProjects(
    () => user.value?.userId ?? 'anonymous',
  )

  const verboseMode = computed({
    get: () => getWorkspace(toValue(projectId), toValue(workspaceId))?.settings?.verboseMode ?? false,
    set: (val: boolean) => updateWorkspace(toValue(projectId), toValue(workspaceId), { settings: { verboseMode: val } }),
  })
  return { verboseMode }
}
