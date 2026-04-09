/**
 * Workspace API service — calls /api/v1/projects/{pid}/workspaces endpoints.
 */

import type { Workspace, WorkspaceContent, WorkspaceSettings } from '@/types/projects'
import { apiRequest } from '@/lib/api-client'

function base(projectId: string): string {
  return `/api/v1/projects/${projectId}/workspaces`
}

export function fetchWorkspaces(projectId: string): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('GET', base(projectId))
}

export function fetchWorkspace(projectId: string, workspaceId: string): Promise<Workspace> {
  return apiRequest<Workspace>('GET', `${base(projectId)}/${workspaceId}`)
}

export function createWorkspaceApi(projectId: string, name: string, description = ''): Promise<Workspace> {
  return apiRequest<Workspace>('POST', base(projectId), { name, description })
}

export function updateWorkspaceApi(
  projectId: string,
  workspaceId: string,
  fields: { name?: string, description?: string, locked?: boolean, settings?: WorkspaceSettings, content?: WorkspaceContent },
): Promise<Workspace> {
  return apiRequest<Workspace>('PATCH', `${base(projectId)}/${workspaceId}`, fields)
}

export function deleteWorkspaceApi(projectId: string, workspaceId: string): Promise<void> {
  return apiRequest<void>('DELETE', `${base(projectId)}/${workspaceId}`)
}

export function duplicateWorkspaceApi(projectId: string, workspaceId: string): Promise<Workspace> {
  return apiRequest<Workspace>('POST', `${base(projectId)}/${workspaceId}/duplicate`)
}

export function reorderWorkspacesApi(projectId: string, orderedIds: string[]): Promise<void> {
  return apiRequest<void>('PUT', `${base(projectId)}/reorder`, { orderedIds })
}
