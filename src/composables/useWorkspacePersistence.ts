import * as Blockly from 'blockly/core'

export const WORKSPACE_STORAGE_KEY_PREFIX = 'blockly-workspace-state'

export function getStorageKey(prefix: string, id: string): string {
  return `${prefix}-${id}`
}

export function useWorkspacePersistence(
  getWorkspace: () => Blockly.WorkspaceSvg | null,
  workspaceId: () => string,
  onLoad: () => void,
) {
  function saveWorkspace(id?: string): void {
    const workspace = getWorkspace()
    if (!workspace)
      return
    try {
      const state = Blockly.serialization.workspaces.save(workspace)
      const key = getStorageKey(WORKSPACE_STORAGE_KEY_PREFIX, id ?? workspaceId())
      localStorage.setItem(key, JSON.stringify(state))
    }
    catch {
      // Ignore serialization errors
    }
  }

  function loadWorkspace(id?: string): void {
    const workspace = getWorkspace()
    if (!workspace)
      return
    const resolvedId = id ?? workspaceId()
    try {
      const key = getStorageKey(WORKSPACE_STORAGE_KEY_PREFIX, resolvedId)
      const saved = localStorage.getItem(key)
      workspace.clear()
      if (saved) {
        const state = JSON.parse(saved)
        Blockly.serialization.workspaces.load(state, workspace)
      }
      // Clear undo stack after loading - prevents undoing the initial load
      workspace.clearUndo()
    }
    catch {
      // Ignore deserialization errors, start fresh
      localStorage.removeItem(getStorageKey(WORKSPACE_STORAGE_KEY_PREFIX, resolvedId))
    }
  }

  function getState(): object | null {
    const workspace = getWorkspace()
    if (!workspace)
      return null
    try {
      return Blockly.serialization.workspaces.save(workspace)
    }
    catch {
      return null
    }
  }

  function setState(state: object): void {
    const workspace = getWorkspace()
    if (!workspace)
      return
    try {
      workspace.clear()
      Blockly.serialization.workspaces.load(state, workspace)
      onLoad()
    }
    catch {
      // Ignore errors
    }
  }

  return {
    saveWorkspace,
    loadWorkspace,
    getState,
    setState,
  }
}
