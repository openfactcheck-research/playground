/**
 * Project API service — calls /api/v1/projects endpoints.
 */

import type { Project } from '@/types/projects'
import { apiRequest } from '@/lib/api-client'

const BASE = '/api/v1/projects'

export function fetchProjects(limit = 50, offset = 0): Promise<Project[]> {
  return apiRequest<Project[]>('GET', `${BASE}?limit=${limit}&offset=${offset}`)
}

export function fetchProject(id: string): Promise<Project> {
  return apiRequest<Project>('GET', `${BASE}/${id}`)
}

export function createProjectApi(name: string): Promise<Project> {
  return apiRequest<Project>('POST', BASE, { name })
}

export function updateProjectApi(id: string, fields: { name?: string }): Promise<Project> {
  return apiRequest<Project>('PATCH', `${BASE}/${id}`, fields)
}

export function deleteProjectApi(id: string): Promise<void> {
  return apiRequest<void>('DELETE', `${BASE}/${id}`)
}
