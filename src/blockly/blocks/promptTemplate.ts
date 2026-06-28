import * as Blockly from 'blockly/core'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldTextPreview } from '@/blockly/fields/fieldTextPreview'

export const BLOCK_TYPE = 'prompt_template'

const BLOCK_WIDTH = 160
const ROW_WIDTH = 193 // content row width, matches FieldTextPreview width used across blocks

// Lucide "file-text" icon scaled to 12×12
const ICON_FILE_TEXT
  = 'M7 1H3.5A1.5 1.5 0 0 0 2 2.5v7A1.5 1.5 0 0 0 3.5 11h5A1.5 1.5 0 0 0 10 9.5V4L7 1z M7 1v3h3 M8 6.5H4 M8 8.5H4 M5 4.5H4'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Variables referenced across the template's system and user bodies, in
// first-seen order. Either body may carry {{placeholders}}; the union is the
// template's variable contract.
export function templateVariables(templateBlock: Blockly.Block): string[] {
  const text = `${templateBlock.getFieldValue('SYSTEM_TEXT') ?? ''}\n${templateBlock.getFieldValue('USER_TEXT') ?? ''}`
  const vars: string[] = []
  for (const match of text.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!vars.includes(match[1]!))
      vars.push(match[1]!)
  }
  return vars
}

// ---------------------------------------------------------------------------
// Block definition
// ---------------------------------------------------------------------------

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField(new FieldBlockHeader('Prompt Template', ICON_FILE_TEXT, BLOCK_WIDTH))

      this.appendDummyInput('SYSTEM_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('System')
        .appendField(new FieldTextPreview('System prompt, with {{vars}}...', ROW_WIDTH), 'SYSTEM_TEXT')

      this.appendDummyInput('USER_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('User')
        .appendField(new FieldTextPreview('User prompt, with {{vars}}...', ROW_WIDTH), 'USER_TEXT')

      this.setStyle('prompt_blocks')
      this.setPreviousStatement(true, 'PromptTemplate')
      this.setNextStatement(true, 'PromptTemplate')
    },

    saveExtraState(this: Blockly.Block) {
      return {
        system: this.getFieldValue('SYSTEM_TEXT') ?? '',
        user: this.getFieldValue('USER_TEXT') ?? '',
      }
    },

    loadExtraState(this: Blockly.Block, state: { system?: string, user?: string }) {
      if (state.system)
        this.setFieldValue(state.system, 'SYSTEM_TEXT')
      if (state.user)
        this.setFieldValue(state.user, 'USER_TEXT')
    },
  }
}
