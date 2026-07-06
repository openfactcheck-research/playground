import type * as Blockly from 'blockly/core'

// Reads the sampling parameter rows a Language Model block currently shows and maps
// them onto the chat layer's field names, which the provider config and ModelSpec share.
// Penalties and reasoning effort go only to OpenAI-compatible providers, which are the
// ones that accept them.
export function samplingArgs(block: Blockly.Block): string[] {
  const provider = block.getFieldValue('PROVIDER') ?? 'openai'
  const openAICompatible = provider === 'openai' || provider === 'openrouter'

  const args: string[] = []
  if (block.getInput('TEMPERATURE_ROW'))
    args.push(`temperature=${block.getFieldValue('TEMPERATURE') ?? 0.7}`)
  if (block.getInput('TOP_P_ROW'))
    args.push(`top_p=${block.getFieldValue('TOP_P') ?? 1.0}`)
  if (block.getInput('MAX_TOKENS_ROW'))
    args.push(`max_output_tokens=${block.getFieldValue('MAX_TOKENS') ?? 4096}`)
  if (openAICompatible && block.getInput('FREQ_PENALTY_ROW'))
    args.push(`frequency_penalty=${block.getFieldValue('FREQ_PENALTY') ?? 0}`)
  if (openAICompatible && block.getInput('PRES_PENALTY_ROW'))
    args.push(`presence_penalty=${block.getFieldValue('PRES_PENALTY') ?? 0}`)
  if (openAICompatible && block.getInput('REASONING_EFFORT_ROW'))
    args.push(`reasoning_effort="${block.getFieldValue('REASONING_EFFORT') ?? 'medium'}"`)
  return args
}
