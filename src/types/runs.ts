/**
 * Run types — used by composables, services, and pages.
 */

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'

export type Run = {
  id: string
  projectId: string
  workspaceId: string
  status: RunStatus
  output: string | null
  error: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
