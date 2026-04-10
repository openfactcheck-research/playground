/**
 * Run API service — calls /api/v1/projects/{pid}/runs endpoints.
 */

import type { Run } from '@/types/runs'
import { apiRequest } from '@/lib/api-client'

function base(projectId: string): string {
  return `/api/v1/projects/${projectId}/runs`
}

export function createRunApi(projectId: string, workspaceId: string, pipeline: object): Promise<Run> {
  return apiRequest<Run>('POST', base(projectId), { workspaceId, pipeline })
}

export function fetchRunApi(projectId: string, runId: string): Promise<Run> {
  return apiRequest<Run>('GET', `${base(projectId)}/${runId}`)
}

export function fetchRunsApi(projectId: string, workspaceId?: string, limit = 20): Promise<Run[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (workspaceId)
    params.set('workspaceId', workspaceId)
  return apiRequest<Run[]>('GET', `${base(projectId)}?${params}`)
}
