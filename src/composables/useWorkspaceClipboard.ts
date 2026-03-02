import * as Blockly from 'blockly/core'

export const CLIPBOARD_STORAGE_KEY = 'blockly-blocks-clipboard'

export function useWorkspaceClipboard(
  getWorkspace: () => Blockly.WorkspaceSvg | null,
  onPaste: () => void,
) {
  function copySelectedBlocks(): boolean {
    const workspace = getWorkspace()
    if (!workspace)
      return false

    const selected = Blockly.getSelected()
    if (!selected || !(selected instanceof Blockly.BlockSvg))
      return false

    try {
      // Serialize the selected block (includes child blocks)
      const blockState = Blockly.serialization.blocks.save(selected)
      localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(blockState))
      return true
    }
    catch {
      return false
    }
  }

  function pasteBlocks(): boolean {
    const workspace = getWorkspace()
    if (!workspace)
      return false

    try {
      const clipboardData = localStorage.getItem(CLIPBOARD_STORAGE_KEY)
      if (!clipboardData)
        return false

      const blockState = JSON.parse(clipboardData)

      // Offset position slightly so pasted blocks don't overlap originals
      if (blockState.x !== undefined)
        blockState.x += 20
      if (blockState.y !== undefined)
        blockState.y += 20

      // Append the block to the workspace
      Blockly.serialization.blocks.append(blockState, workspace)
      onPaste()
      return true
    }
    catch {
      return false
    }
  }

  function hasSelectedBlocks(): boolean {
    const workspace = getWorkspace()
    if (!workspace)
      return false
    const selected = Blockly.getSelected()
    return selected instanceof Blockly.BlockSvg
  }

  function hasClipboardData(): boolean {
    return !!localStorage.getItem(CLIPBOARD_STORAGE_KEY)
  }

  return {
    copySelectedBlocks,
    pasteBlocks,
    hasSelectedBlocks,
    hasClipboardData,
  }
}
