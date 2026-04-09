/**
 * Shared project/workspace types — used by composables, services, and pages.
 */

export type WorkspaceSettings = {
  verboseMode?: boolean
}

export type Project = {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export type WorkspaceContent = {
  blockly?: object
  notes?: StickyNote[]
}

export type StickyNote = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  text: string
}

export type Workspace = {
  id: string
  projectId: string
  name: string
  description: string
  locked: boolean
  sortOrder: number
  settings: WorkspaceSettings
  content?: WorkspaceContent | null
  createdAt: string
  updatedAt: string
}
