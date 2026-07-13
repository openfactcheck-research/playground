/**
 * Run types — pipeline execution state on a workspace.
 */

import type { VerdictLabel } from '@/types/result'

export type RunStatus = 'running' | 'completed' | 'failed'

export type Run = {
  status: RunStatus
  output: string
  error: string
}

/** Events streamed from a run, mirroring the engine's wire events (keys camelCased). */
export type RunEvent
  = | { type: 'node_started', nodeId: string, branch: number | null }
    | { type: 'node_finished', nodeId: string, duration: number, branch: number | null, output: unknown }
    | { type: 'node_failed', nodeId: string, error: string, branch: number | null }
    | { type: 'node_emitted', nodeId: string, branch: number | null, data: unknown }
    | { type: 'output', text: string }
    | { type: 'finished', success: boolean, output: string, error: string | null }

export type StageStatus = 'running' | 'done' | 'failed'

export type Stage = {
  role: string
  label: string
  status: StageStatus
}

/** A per-claim verdict as it fills in live: reasoning streams first, then the label resolves. */
export type LiveVerdict = {
  claim: string
  reasoning: string
  correction: string | null
  label: VerdictLabel | null
  status: 'verifying' | 'done'
}

/** Live progress accumulated from a run's event stream. */
export type RunProgress = {
  status: RunStatus
  stages: Stage[]
  verdicts: LiveVerdict[]
}
