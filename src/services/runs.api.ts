/**
 * Run API service — calls workspace run endpoints.
 */

import type { Run } from '@/types/runs'
import { apiRequest } from '@/lib/api-client'

function base(projectId: string, workspaceId: string): string {
  return `/api/v1/projects/${projectId}/workspaces/${workspaceId}/run`
}

export function startRunApi(projectId: string, workspaceId: string, pipeline: object): Promise<Run> {
  return apiRequest<Run>('POST', base(projectId, workspaceId), { pipeline })
}

export function fetchRunApi(projectId: string, workspaceId: string): Promise<Run | null> {
  return apiRequest<Run | null>('GET', base(projectId, workspaceId))
}
