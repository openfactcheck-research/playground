import type * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE } from '@/blockly/blocks/promptTemplate'
import { varNameFor } from './varNames'

// Escape a template body for embedding inside a Python triple-quoted string.
function escapeBody(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')
}

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const system = block.getFieldValue('SYSTEM_TEXT') ?? ''
    const user = block.getFieldValue('USER_TEXT') ?? ''
    const varName = varNameFor(block, generator, 'prompt_template')

    // Hoist the import; Blockly groups import statements at the top of the file.
    const importLine = 'from openfactcheck.prompts import PromptTemplate'
      ; (generator as unknown as { definitions_: Record<string, string> }).definitions_[importLine] = importLine

    // One (role, text) entry per non-empty part; fall back to a lone user
    // message so a fresh block still emits a valid template.
    const parts: Array<[string, string]> = []
    if (system.trim())
      parts.push(['system', system])
    if (user.trim() || parts.length === 0)
      parts.push(['user', user])

    const entries = parts
      .map(([role, text]) => `  ("${role}", """${escapeBody(text)}"""),`)
      .join('\n')

    return `${varName} = PromptTemplate.from_messages([\n${entries}\n],name="${varName}")\n`
  }
}
