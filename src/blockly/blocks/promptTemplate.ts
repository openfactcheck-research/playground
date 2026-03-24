import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldTextPreview } from '@/blockly/fields/fieldTextPreview'

export const BLOCK_TYPE = 'prompt_template'

const BLOCK_WIDTH = 160

// Lucide "file-text" icon scaled to 12×12
const ICON_FILE_TEXT
  = 'M7 1H3.5A1.5 1.5 0 0 0 2 2.5v7A1.5 1.5 0 0 0 3.5 11h5A1.5 1.5 0 0 0 10 9.5V4L7 1z M7 1v3h3 M8 6.5H4 M8 8.5H4 M5 4.5H4'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractVariables(template: string): string[] {
  const vars: string[] = []
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!vars.includes(match[1]!))
      vars.push(match[1]!)
  }
  return vars
}

function updateVariableInputs(block: Blockly.Block, template: string): void {
  const variables = extractVariables(template)

  const currentVarInputs = block.inputList
    .filter(i => i.name.startsWith('VAR_'))
    .map(i => i.name)

  const toRemove = currentVarInputs.filter(
    name => !variables.includes(name.slice(4).toLowerCase()),
  )
  const toAdd = variables.filter(v => !block.getInput(`VAR_${v.toUpperCase()}`))

  if (toRemove.length === 0 && toAdd.length === 0)
    return

  setTimeout(() => {
    Blockly.Events.disable()
    try {
      for (const name of toRemove)
        block.removeInput(name, true)
      for (const v of toAdd) {
        block.appendValueInput(`VAR_${v.toUpperCase()}`)
          .setCheck(null)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(v)
      }
    }
    finally {
      Blockly.Events.enable()
    }
    ;(block as Blockly.BlockSvg).initSvg?.()
    ;(block as Blockly.BlockSvg).render?.()
  }, 0)
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

      this.appendDummyInput('TEMPLATE_TEXT_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new FieldTextPreview('Enter your prompt template...', 193), 'TEMPLATE_TEXT')

      this.setStyle('models_blocks')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
    },

    onchange(this: Blockly.Block, e: Blockly.Events.Abstract) {
      if (e.type !== Blockly.Events.BLOCK_CHANGE)
        return
      const change = e as Blockly.Events.BlockChange
      if (change.blockId === this.id && change.name === 'TEMPLATE_TEXT')
        updateVariableInputs(this, change.newValue as string)
    },

    saveExtraState(this: Blockly.Block) {
      return { template: this.getFieldValue('TEMPLATE_TEXT') ?? '' }
    },

    loadExtraState(this: Blockly.Block, state: { template: string }) {
      if (state.template)
        updateVariableInputs(this, state.template)
    },
  }

  // ---------------------------------------------------------------------------
  // Python generator
  // ---------------------------------------------------------------------------

  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const template = block.getFieldValue('TEMPLATE_TEXT') ?? ''
    const variables = extractVariables(template)

    let escaped = template
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\"\\"\\"')

    if (variables.length === 0) {
      return `prompt_template = """${escaped}"""\n`
    }

    const formatArgs: string[] = []
    for (const v of variables) {
      const value = generator.valueToCode(block, `VAR_${v.toUpperCase()}`, Order.ATOMIC) || '""'
      formatArgs.push(`${v}=${value}`)
      escaped = escaped.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), `{${v}}`)
    }

    return `prompt_template = """${escaped}""".format(${formatArgs.join(', ')})\n`
  }
}
