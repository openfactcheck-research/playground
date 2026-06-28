import * as Blockly from 'blockly/core'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { BLOCK_TYPE as PROMPT_TEMPLATE_TYPE, templateVariables } from './promptTemplate'

export const BLOCK_TYPE = 'agent'

const BLOCK_WIDTH = 160

// Lucide "bot" icon scaled to 12×12
const ICON_BOT
  = 'M6 4V2H4 M3 4h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M1 7h1 M10 7h1 M7.5 6.5v1 M4.5 6.5v1'

export function varInputName(variable: string): string {
  return `VAR_${variable.toUpperCase()}`
}

// Add or remove value inputs so the block has exactly one per template
// variable, ordered to match and kept between the Prompt and Model rows.
// Returns whether the input list changed. No rendering; callers handle that.
function applyVarInputs(block: Blockly.Block, variables: string[]): boolean {
  const desired = variables.map(varInputName)
  const current = block.inputList.filter(i => i.name.startsWith('VAR_')).map(i => i.name)
  const toRemove = current.filter(name => !desired.includes(name))
  const toAdd = variables.filter(v => !block.getInput(varInputName(v)))

  if (toRemove.length === 0 && toAdd.length === 0)
    return false

  Blockly.Events.disable()
  try {
    for (const name of toRemove)
      block.removeInput(name, true)
    for (const v of variables) {
      if (!block.getInput(varInputName(v))) {
        block.appendValueInput(varInputName(v))
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(v)
      }
    }
    // Keep the variable rows in template order, just below the Prompt row.
    if (block.getInput('MODEL')) {
      for (const v of variables)
        block.moveInputBefore(varInputName(v), 'MODEL')
    }
  }
  finally {
    Blockly.Events.enable()
  }
  return true
}

// Reconcile the variable inputs against the currently connected template and
// re-render. For live edits, not deserialization.
function syncVarInputs(block: Blockly.Block, variables: string[]): void {
  if (applyVarInputs(block, variables)) {
    ;(block as Blockly.BlockSvg).initSvg?.()
    ;(block as Blockly.BlockSvg).render?.()
  }
}

export function connectedTemplateVariables(block: Blockly.Block): string[] {
  const promptBlock = block.getInputTargetBlock('PROMPT')
  return promptBlock?.type === PROMPT_TEMPLATE_TYPE ? templateVariables(promptBlock) : []
}

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new FieldBlockHeader('Agent', ICON_BOT, BLOCK_WIDTH))

      this.appendStatementInput('PROMPT')
        .setAlign(Blockly.inputs.Align.LEFT)
        .setCheck('PromptTemplate')
        .appendField('Prompt')

      this.appendStatementInput('MODEL')
        .setAlign(Blockly.inputs.Align.LEFT)
        .setCheck('LanguageModel')
        .appendField('Model')

      this.appendStatementInput('STRUCTURED_OUTPUT')
        .setAlign(Blockly.inputs.Align.LEFT)
        .setCheck('StructuredOutput')
        .appendField('Output')

      this.setStyle('models_blocks')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setInputsInline(false)
    },

    onchange(this: Blockly.Block, e: Blockly.Events.Abstract) {
      if (this.isInFlyout)
        return

      // The variable rows mirror the connected template, so refresh when the
      // template is connected or disconnected, or when its bodies change.
      let relevant = false
      if (e.type === Blockly.Events.BLOCK_MOVE) {
        const move = e as Blockly.Events.BlockMove
        relevant = move.newParentId === this.id || move.oldParentId === this.id
      }
      else if (e.type === Blockly.Events.BLOCK_CHANGE) {
        const change = e as Blockly.Events.BlockChange
        const promptBlock = this.getInputTargetBlock('PROMPT')
        relevant = promptBlock !== null && change.blockId === promptBlock.id
      }
      if (!relevant)
        return

      setTimeout(() => syncVarInputs(this, connectedTemplateVariables(this)), 0)
    },

    saveExtraState(this: Blockly.Block) {
      return { vars: connectedTemplateVariables(this) }
    },

    loadExtraState(this: Blockly.Block, state: { vars?: string[] }) {
      // Recreate the variable inputs synchronously so saved value-block
      // connections restore into them; onchange reconciles afterwards.
      applyVarInputs(this, state.vars ?? [])
    },
  }
}
