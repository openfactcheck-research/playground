/**
 * Project secret API service — calls /api/v1/secrets/projects/{projectId} endpoints.
 *
 * Project secrets override the user's global secrets for one project.
 */

import type { Secret } from '@/types/secrets'
import { apiRequest } from '@/lib/api-client'

function base(projectId: string): string {
  return `/api/v1/secrets/projects/${projectId}`
}

export function fetchProjectSecrets(projectId: string): Promise<Secret[]> {
  return apiRequest<Secret[]>('GET', base(projectId))
}

export function setProjectSecretApi(projectId: string, name: string, value: string): Promise<Secret> {
  return apiRequest<Secret>('PUT', `${base(projectId)}/${name}`, { value })
}

export function deleteProjectSecretApi(projectId: string, name: string): Promise<void> {
  return apiRequest<void>('DELETE', `${base(projectId)}/${name}`)
}
