/**
 * Retriever Block
 * Retrieves evidence using various retrieval frameworks or custom prompts
 */
import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { PALETTE } from '@/blockly/theme'

export const BLOCK_TYPE = 'retriever'

const FRAMEWORK_OPTIONS: Array<[string, string]> = [
  ['Factool', 'factool'],
  ['FactCheckGPT', 'factcheckgpt'],
  ['UrduFactCheck', 'urdufactcheck'],
  ['Custom', 'custom'],
]

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('𝗥𝗲𝘁𝗿𝗶𝗲𝘃𝗲𝗿')

      // Framework dropdown
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Framework')
        .appendField(
          new Blockly.FieldDropdown(FRAMEWORK_OPTIONS, function (
            this: Blockly.FieldDropdown,
            newValue: string,
          ) {
            const block = this.getSourceBlock()
            if (block) {
              ;(block as RetrieverBlock).updatePromptInput_(newValue === 'custom')
            }
            return newValue
          }),
          'FRAMEWORK',
        )

      // LLM config input
      this.appendValueInput('MODEL')
        .setCheck('LLMConfig')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Model')

      // Vertical stacking - top/bottom connectors
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setInputsInline(false)
      this.setColour(PALETTE.orange)
      this.setTooltip('Retrieve evidence using a retrieval framework or custom prompt')
      this.setHelpUrl('')
    },

    /**
     * Update the prompt input visibility based on framework selection
     */
    updatePromptInput_(this: RetrieverBlock, showPrompt: boolean): void {
      const hasPromptInput = this.getInput('PROMPT')

      if (showPrompt && !hasPromptInput) {
        // Add prompt input after MODEL
        this.appendValueInput('PROMPT')
          .setCheck(['Prompt', 'String'])
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField('Prompt')
        // Move it to the correct position (after MODEL, before statement connectors)
        this.moveInputBefore('PROMPT', null)
      }
      else if (!showPrompt && hasPromptInput) {
        // Remove prompt input
        this.removeInput('PROMPT')
      }
    },
  }

  // Python code generator (statement block)
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const framework = block.getFieldValue('FRAMEWORK') as string
    const model = generator.valueToCode(block, 'MODEL', Order.ATOMIC) || '{}'
    const prompt = generator.valueToCode(block, 'PROMPT', Order.ATOMIC) || 'None'

    // Generate retriever code as statement
    let code: string

    if (framework === 'custom') {
      code = `evidence = retrieve_evidence(
    claim=claim,
    framework="${framework}",
    model=${model},
    prompt=${prompt}
)\n`
    }
    else {
      code = `evidence = retrieve_evidence(
    claim=claim,
    framework="${framework}",
    model=${model}
)\n`
    }

    return code
  }
}

// Type for the block with custom methods
type RetrieverBlock = Blockly.Block & {
  updatePromptInput_: (showPrompt: boolean) => void
}
