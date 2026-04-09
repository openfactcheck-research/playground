import * as Blockly from 'blockly/core'

export function useWorkspacePersistence(
  getWorkspace: () => Blockly.WorkspaceSvg | null,
  onLoad: () => void,
  onSave: () => void,
) {
  function saveWorkspace(): void {
    onSave()
  }

  function loadWorkspace(blocklyState?: object | null): void {
    const workspace = getWorkspace()
    if (!workspace)
      return
    try {
      workspace.clear()
      if (blocklyState)
        Blockly.serialization.workspaces.load(blocklyState, workspace)
      workspace.clearUndo()
    }
    catch {
      // Ignore deserialization errors, start fresh
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
