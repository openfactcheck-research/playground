/**
 * Claim Input Block
 * Starting block for fact-checking pipelines - uses claim from external input area
 */
import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { PALETTE } from '@/blockly/theme'

export const BLOCK_TYPE = 'claim_input'

// Module-level storage for input text (set from Vue component)
let _inputText = ''

/**
 * Set the input text from the external text editor.
 * Called by BlocklyWorkspace when the editor text changes.
 */
export function setInputText(text: string): void {
  _inputText = text
}

/**
 * Get the current input text for code generation.
 */
export function getInputText(): string {
  return _inputText
}

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('𝗜𝗻𝗽𝘂𝘁 𝗧𝗲𝘅𝘁')

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('(from text area above)')

      // Top terminal only (starting block) - no previous statement
      this.setNextStatement(true, null)
      this.setInputsInline(false)
      this.setColour(PALETTE.orange)
      this.setTooltip('Starting block - uses the claim from the input text area above')
      this.setHelpUrl('')

      // Hat-shaped top (makes it stand out as a starting block)
      this.hat = 'cap'
    },
  }

  // Python code generator
  pythonGenerator.forBlock[BLOCK_TYPE] = function (): string {
    // Escape the input text for Python string literal
    const escaped = _inputText
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\"\\"\\"')
    return `claim = """${escaped}"""\n`
  }
}
