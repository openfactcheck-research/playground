import type { Project, Workspace, WorkspaceContent, WorkspaceSettings } from '@/types/projects'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjects,
  updateProjectApi,
} from '@/services/projects.api'
import {
  createWorkspaceApi,
  deleteWorkspaceApi,
  duplicateWorkspaceApi,
  fetchWorkspaces,
  reorderWorkspacesApi,
  updateWorkspaceApi,
} from '@/services/workspaces.api'

export type { Project, Workspace, WorkspaceSettings } from '@/types/projects'

// ---------------------------------------------------------------------------
// Reactive cache
// ---------------------------------------------------------------------------

const MAX_WORKSPACES = 5

const projectsCache = ref<Project[]>([])
const workspacesCache = ref<Workspace[]>([])

const projectsLoading = ref(false)
const workspacesLoading = ref(false)

// Track latest loadWorkspaces request per project to avoid races
const workspacesLoadIds = new Map<string, number>()

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useProjects() {
  // =========================================================================
  // Reads — from cache (synchronous)
  // =========================================================================

  const projects = computed<Project[]>(() => projectsCache.value)

  function getProject(projectId: string): Project | undefined {
    return projectsCache.value.find(p => p.id === projectId)
  }

  function getWorkspaces(projectId: string): Workspace[] {
    return workspacesCache.value
      .filter(w => w.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  function getWorkspace(projectId: string, workspaceId: string): Workspace | undefined {
    return workspacesCache.value.find(w => w.id === workspaceId && w.projectId === projectId)
  }

  function canAddWorkspace(projectId: string): boolean {
    return getWorkspaces(projectId).length < MAX_WORKSPACES
  }

  // =========================================================================
  // Cache management
  // =========================================================================

  function clearCache(): void {
    projectsCache.value = []
    workspacesCache.value = []
  }

  // =========================================================================
  // Data loading
  // =========================================================================

  async function loadProjects(): Promise<void> {
    projectsLoading.value = true
    try {
      projectsCache.value = await fetchProjects()
    }
    catch {
      toast.error('Failed to load projects')
    }
    finally {
      projectsLoading.value = false
    }
  }

  async function loadWorkspaces(projectId: string): Promise<void> {
    const requestId = (workspacesLoadIds.get(projectId) ?? 0) + 1
    workspacesLoadIds.set(projectId, requestId)
    workspacesLoading.value = true
    try {
      const ws = await fetchWorkspaces(projectId)
      if (requestId !== workspacesLoadIds.get(projectId))
        return
      workspacesCache.value = [
        ...workspacesCache.value.filter(w => w.projectId !== projectId),
        ...ws,
      ]
    }
    catch {
      if (requestId === workspacesLoadIds.get(projectId))
        toast.error('Failed to load workspaces')
    }
    finally {
      if (requestId === workspacesLoadIds.get(projectId))
        workspacesLoading.value = false
    }
  }

  // =========================================================================
  // Mutations
  // =========================================================================

  async function createProject(name: string, description = ''): Promise<Project> {
    try {
      const project = await createProjectApi(name, description)
      projectsCache.value.push(project)
      return project
    }
    catch (e) {
      toast.error('Failed to create project')
      throw e
    }
  }

  async function renameProject(projectId: string, name: string): Promise<void> {
    return updateProject(projectId, { name })
  }

  async function updateProject(projectId: string, fields: { name?: string, description?: string }): Promise<void> {
    const prev = projectsCache.value.find(p => p.id === projectId)
    const snapshot = prev ? { ...prev } : undefined

    if (prev) {
      if (fields.name !== undefined)
        prev.name = fields.name
      if (fields.description !== undefined)
        prev.description = fields.description
    }

    try {
      const updated = await updateProjectApi(projectId, fields)
      if (prev)
        Object.assign(prev, updated)
    }
    catch {
      if (prev && snapshot)
        Object.assign(prev, snapshot)
      toast.error('Failed to update project')
    }
  }

  async function deleteProject(projectId: string): Promise<void> {
    const prevProjects = [...projectsCache.value]
    const prevWorkspaces = [...workspacesCache.value]
    projectsCache.value = projectsCache.value.filter(p => p.id !== projectId)
    workspacesCache.value = workspacesCache.value.filter(w => w.projectId !== projectId)

    try {
      await deleteProjectApi(projectId)
    }
    catch {
      projectsCache.value = prevProjects
      workspacesCache.value = prevWorkspaces
      toast.error('Failed to delete project')
    }
  }

  async function createWorkspace(projectId: string, name: string, description = ''): Promise<Workspace | null> {
    if (!canAddWorkspace(projectId)) {
      toast.error('Workspace limit reached')
      return null
    }

    try {
      const ws = await createWorkspaceApi(projectId, name, description)
      workspacesCache.value.push(ws)
      return ws
    }
    catch {
      toast.error('Failed to create workspace')
      return null
    }
  }

  async function renameWorkspace(projectId: string, workspaceId: string, name: string): Promise<void> {
    return updateWorkspace(projectId, workspaceId, { name })
  }

  async function updateWorkspace(projectId: string, workspaceId: string, fields: { name?: string, description?: string, locked?: boolean, settings?: WorkspaceSettings }): Promise<void> {
    const ws = workspacesCache.value.find(w => w.id === workspaceId && w.projectId === projectId)
    const prev = ws ? { ...ws } : undefined

    if (ws) {
      if (fields.name !== undefined)
        ws.name = fields.name
      if (fields.description !== undefined)
        ws.description = fields.description
      if (fields.locked !== undefined)
        ws.locked = fields.locked
      if (fields.settings !== undefined)
        ws.settings = { ...ws.settings, ...fields.settings }
    }

    try {
      const updated = await updateWorkspaceApi(projectId, workspaceId, fields)
      if (ws)
        Object.assign(ws, updated)
    }
    catch {
      if (ws && prev)
        Object.assign(ws, prev)
      toast.error('Failed to update workspace')
    }
  }

  async function duplicateWorkspace(projectId: string, workspaceId: string): Promise<Workspace | null> {
    try {
      const ws = await duplicateWorkspaceApi(projectId, workspaceId)
      workspacesCache.value.push(ws)
      return ws
    }
    catch {
      toast.error('Failed to duplicate workspace')
      return null
    }
  }

  async function deleteWorkspace(projectId: string, workspaceId: string): Promise<void> {
    const prevWorkspaces = [...workspacesCache.value]
    workspacesCache.value = workspacesCache.value.filter(w => !(w.id === workspaceId && w.projectId === projectId))

    try {
      await deleteWorkspaceApi(projectId, workspaceId)
    }
    catch {
      workspacesCache.value = prevWorkspaces
      toast.error('Failed to delete workspace')
    }
  }

  async function reorderWorkspaces(projectId: string, orderedIds: string[]): Promise<void> {
    const prevWorkspaces = workspacesCache.value.map(w => ({ ...w }))
    orderedIds.forEach((id, index) => {
      const ws = workspacesCache.value.find(w => w.id === id && w.projectId === projectId)
      if (ws)
        ws.sortOrder = index
    })

    try {
      await reorderWorkspacesApi(projectId, orderedIds)
    }
    catch {
      workspacesCache.value = prevWorkspaces
      toast.error('Failed to reorder workspaces')
    }
  }

  async function saveWorkspaceContent(projectId: string, workspaceId: string, content: WorkspaceContent): Promise<void> {
    const ws = workspacesCache.value.find(w => w.id === workspaceId && w.projectId === projectId)
    const prev = ws?.content
    if (ws)
      ws.content = content
    try {
      await updateWorkspaceApi(projectId, workspaceId, { content })
    }
    catch {
      if (ws)
        ws.content = prev
      toast.error('Failed to save workspace content')
    }
  }

  return {
    projects,
    projectsLoading,
    workspacesLoading,
    getProject,
    getWorkspaces,
    getWorkspace,
    canAddWorkspace,
    clearCache,
    loadProjects,
    loadWorkspaces,
    createProject,
    renameProject,
    updateProject,
    deleteProject,
    createWorkspace,
    renameWorkspace,
    updateWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    reorderWorkspaces,
    saveWorkspaceContent,
  }
}
