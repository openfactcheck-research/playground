/**
 * Prompt Template Block
 * Creates prompt templates with variable placeholders for fact-checking pipelines
 */
import { FieldMultilineInput } from '@blockly/field-multilineinput'
import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { PALETTE } from '@/blockly/theme'

export const BLOCK_TYPE = 'prompt_template'

// Preset prompt templates for fact-checking
const PRESET_TEMPLATES: Array<[string, string]> = [
  ['Custom', 'custom'],
  ['Verify Claim', 'verify'],
  ['Find Evidence', 'evidence'],
  ['Explain Reasoning', 'reasoning'],
  ['Rate Confidence', 'confidence'],
  ['Compare Sources', 'compare'],
]

const TEMPLATE_CONTENT: Record<string, string> = {
  custom: 'Enter your prompt here...\n\nUse {{variable}} for placeholders.',
  verify: `You are a fact-checker. Analyze the following claim and determine if it is true, false, or unverifiable.

Claim: {{claim}}

Provide:
1. Verdict: TRUE / FALSE / UNVERIFIABLE
2. Confidence: 1-5
3. Brief explanation`,
  evidence: `Find evidence to support or refute the following claim:

Claim: {{claim}}

Search for credible sources and provide:
1. Supporting evidence (if any)
2. Contradicting evidence (if any)
3. Source reliability assessment`,
  reasoning: `Explain the logical reasoning behind this claim:

Claim: {{claim}}

Identify:
1. Key premises
2. Logical structure
3. Potential fallacies
4. Missing context`,
  confidence: `Rate your confidence in the following claim on a scale of 1-5:

Claim: {{claim}}

1 = Definitely false
2 = Likely false
3 = Uncertain
4 = Likely true
5 = Definitely true

Provide your rating and justification.`,
  compare: `Compare the following sources regarding this claim:

Claim: {{claim}}

Sources:
{{sources}}

Analyze:
1. Agreement/disagreement between sources
2. Source credibility
3. Potential biases
4. Consensus conclusion`,
}

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('𝗣𝗿𝗼𝗺𝗽𝘁 𝗧𝗲𝗺𝗽𝗹𝗮𝘁𝗲')

      // Preset dropdown
      this.appendDummyInput('PRESET_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Preset')
        .appendField(
          new Blockly.FieldDropdown(
            PRESET_TEMPLATES,
            function (this: Blockly.FieldDropdown, newPreset: string) {
              const block = this.getSourceBlock()
              if (block && newPreset !== 'custom') {
                const templateField = block.getField('TEMPLATE') as FieldMultilineInput
                if (templateField) {
                  templateField.setValue(TEMPLATE_CONTENT[newPreset] || '')
                }
              }
              return newPreset
            },
          ),
          'PRESET',
        )

      // Multi-line template input
      this.appendDummyInput('TEMPLATE_INPUT')
        .appendField(
          new FieldMultilineInput(TEMPLATE_CONTENT.custom),
          'TEMPLATE',
        )

      // Variable inputs - claim is always available
      this.appendValueInput('CLAIM')
        .setCheck('String')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('{{claim}}')

      // Optional sources input
      this.appendValueInput('SOURCES')
        .setCheck(['String', 'Array'])
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('{{sources}}')

      this.setOutput(true, 'Prompt')
      this.setInputsInline(false)
      this.setColour(PALETTE.violet)
      this.setTooltip('Create a prompt template with variable placeholders')
      this.setHelpUrl('')
    },
  }

  // Python code generator
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): [string, Order] {
    const template = block.getFieldValue('TEMPLATE') as string
    const claim = generator.valueToCode(block, 'CLAIM', Order.ATOMIC) || '""'
    const sources = generator.valueToCode(block, 'SOURCES', Order.ATOMIC) || '""'

    // Escape template for Python string
    const escapedTemplate = template
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\"\\"\\"')
      .replace(/\{\{claim\}\}/g, '{claim}')
      .replace(/\{\{sources\}\}/g, '{sources}')

    const code = `"""${escapedTemplate}""".format(claim=${claim}, sources=${sources})`

    return [code, Order.FUNCTION_CALL]
  }
}
