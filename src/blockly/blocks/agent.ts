/**
 * Agent Block
 * Runs an AI agent using a model configuration and prompt
 */
import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { PALETTE } from '@/blockly/theme'

export const BLOCK_TYPE = 'agent'

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('𝗔𝗴𝗲𝗻𝘁')

      // LLM config input
      this.appendValueInput('MODEL')
        .setCheck('LLMConfig')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Model')

      // Prompt input
      this.appendValueInput('PROMPT')
        .setCheck(['Prompt', 'String'])
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Prompt')

      // Output format dropdown
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Output')
        .appendField(
          new Blockly.FieldDropdown([
            ['Text', 'text'],
            ['JSON', 'json'],
            ['Structured', 'structured'],
          ]),
          'OUTPUT_FORMAT',
        )

      // Vertical stacking - top/bottom connectors
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setInputsInline(false)
      this.setColour(PALETTE.violet)
      this.setTooltip('Run an AI agent with the connected model and prompt')
      this.setHelpUrl('')
    },
  }

  // Python code generator (statement block)
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const model = generator.valueToCode(block, 'MODEL', Order.ATOMIC) || '{}'
    const prompt = generator.valueToCode(block, 'PROMPT', Order.ATOMIC) || '""'
    const outputFormat = block.getFieldValue('OUTPUT_FORMAT') as string

    // Generate agent code as statement
    const code = `result = run_agent(
    config=${model},
    prompt=${prompt},
    output_format="${outputFormat}"
)\n`

    return code
  }
}
