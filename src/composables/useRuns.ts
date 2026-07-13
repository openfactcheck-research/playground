/**
 * Run state management — stream a pipeline run's live progress as newline-delimited JSON.
 */

import type { VerdictLabel } from '@/types/result'
import type { Run, RunProgress, StageStatus } from '@/types/runs'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { streamRunApi } from '@/services/runs.api'

// Human labels for the pipeline steps a run reports, keyed by the step's role.
const STAGE_LABELS: Record<string, string> = {
  claim_processor: 'Extracting claims',
  query_generator: 'Generating queries',
  retriever: 'Retrieving evidence',
  verifier: 'Verifying claims',
  aggregator: 'Aggregating results',
  reviser: 'Revising',
}

// A component node id is "<namespace>/<role>"; internal, start, and end nodes have no recognised
// role and are hidden. Returns the role, or null to skip the node.
function stageRole(nodeId: string): string | null {
  const parts = nodeId.split('/')
  const role = parts[1]
  return parts.length === 2 && role !== undefined && STAGE_LABELS[role] !== undefined ? role : null
}

type VerdictPayload = { label: VerdictLabel | null, reasoning: string, correction: string | null }

export function useRuns() {
  const currentRun = ref<Run | null>(null)
  const progress = ref<RunProgress | null>(null)
  const isRunning = computed(() => currentRun.value?.status === 'running')

  function upsertStage(nodeId: string, status: StageStatus): void {
    const role = stageRole(nodeId)
    const p = progress.value
    if (!role || !p)
      return
    const existing = p.stages.find(s => s.role === role)
    if (existing)
      existing.status = status
    else
      p.stages.push({ role, label: STAGE_LABELS[role] ?? role, status })
  }

  // The claim processor's output seeds one verifying card per claim; the verifier then streams
  // reasoning into each and resolves its label, keyed by fan-out branch index.
  function seedVerdicts(claims: string[]): void {
    if (progress.value)
      progress.value.verdicts = claims.map(claim => ({ claim, reasoning: '', correction: null, label: null, status: 'verifying' }))
  }

  function streamReasoning(branch: number, reasoning: string): void {
    const verdict = progress.value?.verdicts[branch]
    if (verdict)
      verdict.reasoning = reasoning
  }

  function resolveVerdict(branch: number, payload: VerdictPayload): void {
    const verdict = progress.value?.verdicts[branch]
    if (!verdict)
      return
    verdict.label = payload.label
    verdict.reasoning = payload.reasoning || verdict.reasoning
    verdict.correction = payload.correction
    verdict.status = 'done'
  }

  async function streamRun(projectId: string, workspaceId: string, pipeline: object): Promise<void> {
    currentRun.value = { status: 'running', output: '', error: '' }
    progress.value = { status: 'running', stages: [], verdicts: [] }
    let finished = false
    try {
      for await (const event of streamRunApi(projectId, workspaceId, pipeline)) {
        switch (event.type) {
          case 'node_started':
            upsertStage(event.nodeId, 'running')
            break
          case 'node_finished':
            upsertStage(event.nodeId, 'done')
            if (stageRole(event.nodeId) === 'claim_processor' && Array.isArray(event.output))
              seedVerdicts(event.output as string[])
            else if (stageRole(event.nodeId) === 'verifier' && event.branch !== null && event.output)
              resolveVerdict(event.branch, event.output as VerdictPayload)
            break
          case 'node_failed':
            upsertStage(event.nodeId, 'failed')
            break
          case 'node_emitted':
            if (stageRole(event.nodeId) === 'verifier' && event.branch !== null)
              streamReasoning(event.branch, (event.data as { reasoning?: string }).reasoning ?? '')
            break
          case 'finished':
            finished = true
            currentRun.value = {
              status: event.success ? 'completed' : 'failed',
              output: event.output,
              error: event.error ?? '',
            }
            if (progress.value)
              progress.value.status = event.success ? 'completed' : 'failed'
            if (!event.success)
              toast.error(event.error || 'Pipeline execution failed')
            break
          case 'output':
            // The final result is surfaced via the finished event; intermediate output is not shown.
            break
        }
      }
      // The stream ended with no terminal event: the connection dropped mid-run.
      if (!finished) {
        currentRun.value = { status: 'failed', output: '', error: 'Run ended unexpectedly' }
        if (progress.value)
          progress.value.status = 'failed'
        toast.error('Run ended unexpectedly')
      }
    }
    catch (error) {
      currentRun.value = { status: 'failed', output: '', error: error instanceof Error ? error.message : 'Run failed' }
      if (progress.value)
        progress.value.status = 'failed'
      toast.error('Failed to run pipeline')
    }
  }

  return { currentRun, progress, isRunning, streamRun }
}
