/**
 * Run types — pipeline execution state on a workspace.
 */

export type RunStatus = 'running' | 'completed' | 'failed'

export type Run = {
  status: RunStatus
  output: string
  error: string
}
