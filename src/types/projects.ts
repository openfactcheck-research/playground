/**
 * Shared project/workspace types — used by composables, services, and pages.
 */

export type WorkspaceSettings = {
  verboseMode?: boolean
}

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type Workspace = {
  id: string
  projectId: string
  name: string
  description: string
  locked: boolean
  sortOrder: number
  settings: WorkspaceSettings
  createdAt: string
  updatedAt: string
}
