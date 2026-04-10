/**
 * Run state management — execute pipelines and poll for results.
 */

import type { Run } from '@/types/runs'
import { computed, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import { createRunApi, fetchRunApi } from '@/services/runs.api'

const POLL_INTERVAL_MS = 500

export function useRuns() {
  const currentRun = ref<Run | null>(null)
  const isRunning = computed(() =>
    currentRun.value?.status === 'pending' || currentRun.value?.status === 'running',
  )

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  async function pollRun(projectId: string, runId: string): Promise<void> {
    try {
      const run = await fetchRunApi(projectId, runId)
      currentRun.value = run
      if (run.status === 'completed' || run.status === 'failed') {
        stopPolling()
        if (run.status === 'failed')
          toast.error(run.error || 'Pipeline execution failed')
      }
    }
    catch {
      stopPolling()
      toast.error('Failed to fetch run status')
    }
  }

  async function executeRun(projectId: string, workspaceId: string, pipeline: object): Promise<void> {
    stopPolling()
    try {
      const run = await createRunApi(projectId, workspaceId, pipeline)
      currentRun.value = run
      pollTimer = setInterval(() => {
        void pollRun(projectId, run.id)
      }, POLL_INTERVAL_MS)
    }
    catch {
      toast.error('Failed to start pipeline execution')
    }
  }

  onBeforeUnmount(() => {
    stopPolling()
  })

  return { currentRun, isRunning, executeRun }
}
