/**
 * Prompt Template Block
 * Creates prompt templates with variable placeholders for fact-checking pipelines
 */
import type { PromptExpandEvent, PromptUpdateEvent } from '@/blockly/events'
import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { blocklyEvents, PROMPT_EXPAND_EVENT, PROMPT_UPDATE_EVENT } from '@/blockly/events'
import { PALETTE } from '@/blockly/theme'

export const BLOCK_TYPE = 'prompt_template'

// Expand icon as data URL (maximize/expand arrows) - white icon on dark background for visibility
const EXPAND_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="0" y="0" width="24" height="24" rx="4" fill="#5b21b6"/>
  <polyline points="14 4 20 4 20 10" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="10 20 4 20 4 14" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="20" y1="4" x2="13" y2="11" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="4" y1="20" x2="11" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
`.trim())}`

// Default prompt template
const DEFAULT_TEMPLATE = `You are a helpful assistant.

## Instructions

Enter your prompt here. Use {{variable}} for placeholders.`

export function register(): void {
  // Helper to extract variable names from template
  function extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g
    const vars: string[] = []
    const matches = template.matchAll(regex)
    for (const match of matches) {
      const varName = match[1]!
      if (!vars.includes(varName)) {
        vars.push(varName)
      }
    }
    return vars
  }

  // Helper to update variable inputs based on template content
  function updateVariableInputs(block: Blockly.Block, template: string): void {
    const variables = extractVariables(template)

    // Get current variable inputs (those starting with VAR_)
    const currentInputs: string[] = []
    for (const input of block.inputList) {
      if (input.name.startsWith('VAR_')) {
        currentInputs.push(input.name)
      }
    }

    // Remove inputs that are no longer needed
    for (const inputName of currentInputs) {
      const varName = inputName.replace('VAR_', '').toLowerCase()
      if (!variables.includes(varName)) {
        block.removeInput(inputName)
      }
    }

    // Add new inputs for variables that don't exist yet
    for (const varName of variables) {
      const inputName = `VAR_${varName.toUpperCase()}`
      if (!block.getInput(inputName)) {
        block.appendValueInput(inputName)
          .setCheck(['String', 'Array'])
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(`{{${varName}}}`)
      }
    }
  }

  Blockly.Blocks[BLOCK_TYPE] = {
    // Store template content on the block instance
    templateContent: DEFAULT_TEMPLATE,

    init(this: Blockly.Block & { templateContent: string }): void {
      // Helper to update display text
      const updateDisplay = (): void => {
        const displayField = this.getField('DISPLAY') as Blockly.FieldLabel | null
        if (!displayField)
          return
        // Flatten to single line and truncate
        const flat = this.templateContent.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
        const preview = flat.length > 20 ? `${flat.substring(0, 20)}…` : flat
        displayField.setValue(preview || 'Click to edit...')
      }

      // Display field showing truncated preview (read-only)
      const displayField = new Blockly.FieldLabel('Click to edit...')

      // Name field with 20 character limit
      const nameField = new Blockly.FieldTextInput('')
      nameField.setValidator((newValue: string) => {
        if (newValue.length > 20) {
          return newValue.substring(0, 20)
        }
        return newValue
      })

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField(nameField, 'NAME')
        .appendField('𝗣𝗿𝗼𝗺𝗽𝘁 𝗧𝗲𝗺𝗽𝗹𝗮𝘁𝗲')

      // Edit button row with display preview
      this.appendDummyInput('EDIT_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(displayField, 'DISPLAY')
        .appendField(
          new Blockly.FieldImage(
            EXPAND_ICON,
            14,
            14,
            'Edit template',
            () => {
              blocklyEvents.emit<PromptExpandEvent>(PROMPT_EXPAND_EVENT, {
                blockId: this.id,
                templateContent: this.templateContent,
              })
            },
          ),
          'EXPAND_BTN',
        )

      // Initialize display
      updateDisplay()

      // Listen for updates from the expanded editor
      blocklyEvents.on<PromptUpdateEvent>(PROMPT_UPDATE_EVENT, (data) => {
        if (data.blockId === this.id) {
          this.templateContent = data.newContent
          updateDisplay()
          updateVariableInputs(this, data.newContent)
        }
      })

      // Initialize variable inputs based on initial template
      updateVariableInputs(this, DEFAULT_TEMPLATE)

      this.setOutput(true, 'Prompt')
      this.setInputsInline(false)
      this.setColour(PALETTE.violet)
      this.setTooltip('Create a prompt template with variable placeholders')
      this.setHelpUrl('')
    },

    // Save template content to JSON
    saveExtraState(this: Blockly.Block & { templateContent: string }): { template: string } {
      return { template: this.templateContent }
    },

    // Load template content from JSON
    loadExtraState(this: Blockly.Block & { templateContent: string }, state: { template: string }): void {
      this.templateContent = state.template || DEFAULT_TEMPLATE
      // Update display after load
      const displayField = this.getField('DISPLAY') as Blockly.FieldLabel | null
      if (displayField) {
        const flat = this.templateContent.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
        const preview = flat.length > 20 ? `${flat.substring(0, 20)}…` : flat
        displayField.setValue(preview || 'Click to edit...')
      }
      // Update variable inputs
      updateVariableInputs(this, this.templateContent)
    },
  }

  // Python code generator - dynamically handles all variables
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): [string, Order] {
    const blockWithTemplate = block as Blockly.Block & { templateContent: string }
    const template = blockWithTemplate.templateContent || DEFAULT_TEMPLATE
    const variables = extractVariables(template)

    // Build format arguments dynamically
    const formatArgs: string[] = []
    let escapedTemplate = template
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\"\\"\\"')

    for (const varName of variables) {
      const inputName = `VAR_${varName.toUpperCase()}`
      const value = generator.valueToCode(block, inputName, Order.ATOMIC) || '""'
      formatArgs.push(`${varName}=${value}`)
      // Replace {{varName}} with {varName} for Python format
      escapedTemplate = escapedTemplate.replace(
        new RegExp(`\\{\\{${varName}\\}\\}`, 'g'),
        `{${varName}}`,
      )
    }

    const code = formatArgs.length > 0
      ? `"""${escapedTemplate}""".format(${formatArgs.join(', ')})`
      : `"""${escapedTemplate}"""`

    return [code, Order.FUNCTION_CALL]
  }
}
