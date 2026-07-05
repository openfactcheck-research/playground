import type * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE, templateMessages } from '@/blockly/blocks/promptTemplate'
import { varNameFor } from './varNames'

// Escape a template body for embedding inside a Python triple-quoted string.
// After escaping backslashes, escape any run of double-quotes that is 3+ long
// (which would close the string early) or that sits at the very end (which
// would merge with the closing delimiter). Shorter internal runs stay literal
// so ordinary "quoted" text reads naturally.
function escapeBody(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\')
  return escaped.replace(/"+/g, (run: string, offset: number) => {
    const atEnd = offset + run.length === escaped.length
    return run.length >= 3 || atEnd ? '\\"'.repeat(run.length) : run
  })
}

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string {
    const varName = varNameFor(block, generator, 'prompt_template')

    // Hoist the import; Blockly groups import statements at the top of the file.
    const importLine = 'from openfactcheck.prompts import PromptTemplate'
      ; (generator as unknown as { definitions_: Record<string, string> }).definitions_[importLine] = importLine

    // Emit each non-empty turn in order, faithfully mirroring the block's roles.
    // Whitespace-only turns are dropped so an untouched System row does not
    // become an empty message (which providers like Anthropic reject).
    const entries = templateMessages(block)
      .filter(({ content }) => content.trim().length > 0)
      .map(({ role, content }) => `  ("${role}", """${escapeBody(content)}"""),`)
      .join('\n')
    const messages = entries ? `[\n${entries}\n]` : '[]'

    return `${varName} = PromptTemplate.from_messages(${messages}, name="${varName}")\n`
  }
}
