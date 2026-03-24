import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'

export const BLOCK_TYPE = 'agent'

const BLOCK_WIDTH = 160

// Lucide "bot" icon scaled to 12×12
const ICON_BOT
  = 'M6 4V2H4 M3 4h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M1 7h1 M10 7h1 M7.5 6.5v1 M4.5 6.5v1'

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

      this.appendStatementInput('TOOLS')
        .setAlign(Blockly.inputs.Align.LEFT)
        .appendField('Tools')

      this.setStyle('models_blocks')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setInputsInline(false)
    },
  }

  pythonGenerator.forBlock[BLOCK_TYPE] = (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string => {
    const promptBlock = block.getInputTargetBlock('PROMPT')
    const modelBlock = block.getInputTargetBlock('MODEL')
    const promptCode = promptBlock ? (generator.blockToCode(promptBlock) as string) : ''
    const modelCode = modelBlock ? (generator.blockToCode(modelBlock) as string) : ''
    return `${promptCode}${modelCode}agent = Agent(prompt_template=prompt_template, language_model=language_model)\n`
  }
}
