import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useProjects } from '@/composables/useProjects'

export function useVerboseMode(projectId: MaybeRefOrGetter<string>, workspaceId: MaybeRefOrGetter<string>) {
  const { getWorkspace, updateWorkspace } = useProjects()

  const verboseMode = computed({
    get: () => getWorkspace(toValue(projectId), toValue(workspaceId))?.settings?.verboseMode ?? false,
    set: (val: boolean) => {
      updateWorkspace(toValue(projectId), toValue(workspaceId), { settings: { verboseMode: val } })
    },
  })
  return { verboseMode }
}
