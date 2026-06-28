import type * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE, VALUE_BLOCK_TYPE } from '@/blockly/blocks/textInput'
import { varNameFor } from './varNames'

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')
}

export function register(): void {
  // Statement form assigns `input_text`.
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const varName = varNameFor(block, generator, 'input_text')
    return `${varName} = """${escapeText(block.getFieldValue('INPUT_TEXT') ?? '')}"""\n`
  }

  // Value form yields the string expression for a slot.
  pythonGenerator.forBlock[VALUE_BLOCK_TYPE] = function (block: Blockly.Block): [string, Order] {
    return [`"""${escapeText(block.getFieldValue('INPUT_TEXT') ?? '')}"""`, Order.ATOMIC]
  }
}
