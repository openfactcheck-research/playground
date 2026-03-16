import { nanoid } from 'nanoid'
import { computed, ref, watch } from 'vue'

// ---------------------------------------------------------------------------
// Types — mirrors the DynamoDB single-table schema
// ---------------------------------------------------------------------------

/**
 * DynamoDB item shape for a Project.
 *   PK:    USER#<userId>#PROJECT#<projectId>
 *   GS1PK: USER#<userId>
 */
export type ProjectRecord = {
  PK: string
  GS1PK: string
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * DynamoDB item shape for a Workspace.
 *   PK:    USER#<userId>#PROJECT#<projectId>#WORKSPACE#<workspaceId>
 *   GS1PK: USER#<userId>#PROJECT#<projectId>
 */
export type WorkspaceRecord = {
  PK: string
  GS1PK: string
  id: string
  projectId: string
  name: string
  description: string
  locked: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Key helpers — same format DynamoDB will use
// ---------------------------------------------------------------------------

function projectPK(userId: string, projectId: string): string {
  return `USER#${userId}#PROJECT#${projectId}`
}

function projectGS1PK(userId: string): string {
  return `USER#${userId}`
}

function workspacePK(userId: string, projectId: string, workspaceId: string): string {
  return `USER#${userId}#PROJECT#${projectId}#WORKSPACE#${workspaceId}`
}

function workspaceGS1PK(userId: string, projectId: string): string {
  return `USER#${userId}#PROJECT#${projectId}`
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ofc-projects-db'
const MAX_WORKSPACES = 5

type LocalDB = {
  projects: ProjectRecord[]
  workspaces: WorkspaceRecord[]
}

function loadDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDB
      if (parsed.projects && parsed.workspaces)
        return parsed
    }
  }
  catch {
    // ignore
  }
  return { projects: [], workspaces: [] }
}

function saveDB(db: LocalDB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

// ---------------------------------------------------------------------------
// Shared reactive state
// ---------------------------------------------------------------------------

const db = ref<LocalDB>(loadDB())

watch(db, val => saveDB(val), { deep: true })

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useProjects(userId: () => string) {
  // -- Projects --

  const projects = computed(() =>
    db.value.projects
      .filter(p => p.GS1PK === projectGS1PK(userId()))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  )

  function getProject(projectId: string): ProjectRecord | undefined {
    return db.value.projects.find(p => p.PK === projectPK(userId(), projectId))
  }

  function createProject(name: string): ProjectRecord {
    const id = nanoid(12)
    const now = new Date().toISOString()
    const record: ProjectRecord = {
      PK: projectPK(userId(), id),
      GS1PK: projectGS1PK(userId()),
      id,
      name,
      createdAt: now,
      updatedAt: now,
    }
    db.value.projects.push(record)
    return record
  }

  function renameProject(projectId: string, name: string): void {
    const project = getProject(projectId)
    if (project) {
      project.name = name
      project.updatedAt = new Date().toISOString()
    }
  }

  function deleteProject(projectId: string): void {
    // Delete all workspaces in the project
    const wsGS1 = workspaceGS1PK(userId(), projectId)
    const wsToRemove = db.value.workspaces.filter(w => w.GS1PK === wsGS1)
    for (const ws of wsToRemove) {
      localStorage.removeItem(`blockly-workspace-state-${ws.id}`)
    }
    db.value.workspaces = db.value.workspaces.filter(w => w.GS1PK !== wsGS1)
    // Delete the project
    db.value.projects = db.value.projects.filter(p => p.PK !== projectPK(userId(), projectId))
  }

  // -- Workspaces --

  function getWorkspaces(projectId: string): WorkspaceRecord[] {
    return db.value.workspaces
      .filter(w => w.GS1PK === workspaceGS1PK(userId(), projectId))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }

  function getWorkspace(projectId: string, workspaceId: string): WorkspaceRecord | undefined {
    return db.value.workspaces.find(w => w.PK === workspacePK(userId(), projectId, workspaceId))
  }

  function createWorkspace(projectId: string, name: string): WorkspaceRecord | null {
    const existing = getWorkspaces(projectId)
    if (existing.length >= MAX_WORKSPACES)
      return null
    const id = nanoid(12)
    const now = new Date().toISOString()
    const maxOrder = existing.reduce((max, w) => Math.max(max, w.sortOrder ?? 0), 0)
    const record: WorkspaceRecord = {
      PK: workspacePK(userId(), projectId, id),
      GS1PK: workspaceGS1PK(userId(), projectId),
      id,
      projectId,
      name,
      description: '',
      locked: false,
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }
    db.value.workspaces.push(record)
    // Touch parent project
    const project = getProject(projectId)
    if (project)
      project.updatedAt = now
    return record
  }

  function renameWorkspace(projectId: string, workspaceId: string, name: string): void {
    const ws = getWorkspace(projectId, workspaceId)
    if (ws) {
      ws.name = name
      ws.updatedAt = new Date().toISOString()
    }
  }

  function updateWorkspace(projectId: string, workspaceId: string, fields: { name?: string, description?: string, locked?: boolean }): void {
    const ws = getWorkspace(projectId, workspaceId)
    if (!ws)
      return
    if (fields.name !== undefined)
      ws.name = fields.name
    if (fields.description !== undefined)
      ws.description = fields.description
    if (fields.locked !== undefined)
      ws.locked = fields.locked
    ws.updatedAt = new Date().toISOString()
  }

  function duplicateWorkspace(projectId: string, workspaceId: string): WorkspaceRecord | null {
    const source = getWorkspace(projectId, workspaceId)
    if (!source)
      return null
    const copy = createWorkspace(projectId, `${source.name} (copy)`)
    if (!copy)
      return null
    copy.description = source.description
    copy.locked = source.locked
    // Copy Blockly state
    const blocklyState = localStorage.getItem(`blockly-workspace-state-${workspaceId}`)
    if (blocklyState)
      localStorage.setItem(`blockly-workspace-state-${copy.id}`, blocklyState)
    return copy
  }

  function deleteWorkspace(projectId: string, workspaceId: string): void {
    const pk = workspacePK(userId(), projectId, workspaceId)
    localStorage.removeItem(`blockly-workspace-state-${workspaceId}`)
    db.value.workspaces = db.value.workspaces.filter(w => w.PK !== pk)
  }

  function touchWorkspace(projectId: string, workspaceId: string): void {
    const ws = getWorkspace(projectId, workspaceId)
    if (ws)
      ws.updatedAt = new Date().toISOString()
  }

  function canAddWorkspace(projectId: string): boolean {
    return getWorkspaces(projectId).length < MAX_WORKSPACES
  }

  function reorderWorkspaces(projectId: string, orderedIds: string[]): void {
    orderedIds.forEach((id, index) => {
      const ws = getWorkspace(projectId, id)
      if (ws)
        ws.sortOrder = index
    })
  }

  return {
    projects,
    getProject,
    createProject,
    renameProject,
    deleteProject,
    getWorkspaces,
    getWorkspace,
    createWorkspace,
    renameWorkspace,
    updateWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    touchWorkspace,
    canAddWorkspace,
    reorderWorkspaces,
  }
}
