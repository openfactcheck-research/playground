import type * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE } from '@/blockly/blocks/languageModel'
import { samplingArgs } from './modelParams'
import { varNameFor } from './varNames'

// Maps the block's provider onto the chat layer's per-provider config class.
const CONFIG_CLASS: Record<string, string> = {
  openai: 'OpenAIConfig',
  anthropic: 'AnthropicConfig',
  openrouter: 'OpenRouterConfig',
}

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string => {
    const provider = block.getFieldValue('PROVIDER') ?? 'openai'
    const model = block.getFieldValue('MODEL') ?? ''
    const configClass = CONFIG_CLASS[provider] ?? 'OpenAIConfig'

    // Map the visible block fields onto the provider config, using the chat layer's
    // own field names and skipping fields the chosen provider's config does not accept.
    const config: string[] = [`model="${model}"`, ...samplingArgs(block)]

    // Hoist the import: Blockly groups import statements into one block at the top.
    // The API key is resolved server-side from the user's stored secrets, so none is emitted here.
    const importLine = `from openfactcheck.chat import ${['ChatClient', configClass].sort().join(', ')}`
    ;(generator as unknown as { definitions_: Record<string, string> }).definitions_[importLine] = importLine

    const configArgs = config.map(arg => `        ${arg},`).join('\n')
    const varName = varNameFor(block, generator, 'client')
    return `${varName} = ChatClient(\n    config=${configClass}(\n${configArgs}\n    ),\n)\n`
  }
}
