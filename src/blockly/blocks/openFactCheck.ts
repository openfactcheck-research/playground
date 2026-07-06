import * as Blockly from 'blockly/core'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'

export const BLOCK_TYPE = 'openfactcheck'

const BLOCK_WIDTH = 160

// Lucide "check-check" scaled to 12×12.
const ICON_CHECK = 'M9 3 3.5 8.5 1 6 M11 5 5.5 10.5 4.5 9.5'

// The prebuilt pipelines the library registers (registered_pipelines()).
const PIPELINE_OPTIONS: Array<[string, string]> = [
  ['Factool', 'factool'],
  ['FactCheckGPT', 'factcheckgpt'],
  ['RARR', 'rarr'],
]

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new FieldBlockHeader('OpenFactCheck', ICON_CHECK, BLOCK_WIDTH))

      this.appendDummyInput('PIPELINE_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Pipeline')
        .appendField(new Blockly.FieldDropdown(PIPELINE_OPTIONS), 'PIPELINE')

      this.appendStatementInput('MODEL')
        .setAlign(Blockly.inputs.Align.LEFT)
        .setCheck('LanguageModel')
        .appendField('Model')

      this.setStyle('factcheck_blocks')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setInputsInline(false)
      this.setTooltip('Run a prebuilt fact-checking pipeline over the input text')
    },
  }
}
