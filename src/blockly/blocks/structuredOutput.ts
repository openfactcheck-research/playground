import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldHidden } from '@/blockly/fields/fieldHidden'
import { FieldRowButton } from '@/blockly/fields/fieldRowButton'

export const BLOCK_TYPE = 'structured_output'
export const SCHEMA_FIELD = 'SCHEMA_DATA'

const BLOCK_WIDTH = 160
const ROW_WIDTH = 193 // content row width — matches FieldTextPreview width used across blocks

// Lucide "layout-list" icon scaled to 12×12
const ICON_STRUCTURED_OUTPUT = 'M4 3h7 M4 6h7 M4 9h7 M1.5 3h.5 M1.5 6h.5 M1.5 9h.5'

// Lucide "table" icon (24×24) for the button
const ICON_TABLE = 'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M8 21V3M3 9h18M3 15h9'

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new FieldBlockHeader('Structured Output', ICON_STRUCTURED_OUTPUT, BLOCK_WIDTH))
        .appendField(new FieldHidden('[]'), SCHEMA_FIELD)

      this.appendDummyInput('SCHEMA_ROW')
        .appendField(new FieldRowButton('Edit Schema', () => {
          window.dispatchEvent(new CustomEvent('blockly:open-controls'))
        }, ROW_WIDTH, ICON_TABLE))

      this.setStyle('models_blocks')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
    },
  }

  pythonGenerator.forBlock[BLOCK_TYPE] = (): string => {
    return ''
  }
}
