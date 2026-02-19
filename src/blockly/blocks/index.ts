/**
 * Custom Blocks Registry
 *
 * All custom blocks are registered here.
 * Import this module once to register all blocks with Blockly.
 */

import * as agent from '@/blockly/blocks/agent'
import * as claimInput from '@/blockly/blocks/claimInput'
import * as claimProcessor from '@/blockly/blocks/claimProcessor'
import * as languageModel from '@/blockly/blocks/languageModel'
import * as promptTemplate from '@/blockly/blocks/promptTemplate'
import * as retriever from '@/blockly/blocks/retriever'
import * as verifier from '@/blockly/blocks/verifier'

// Export block types for use in toolbox config
export { BLOCK_TYPE as AGENT_BLOCK } from '@/blockly/blocks/agent'
export { BLOCK_TYPE as CLAIM_INPUT_BLOCK } from '@/blockly/blocks/claimInput'
export { BLOCK_TYPE as CLAIM_PROCESSOR_BLOCK } from '@/blockly/blocks/claimProcessor'
export { BLOCK_TYPE as LLM_BLOCK } from '@/blockly/blocks/languageModel'
export { BLOCK_TYPE as PROMPT_TEMPLATE_BLOCK } from '@/blockly/blocks/promptTemplate'
export { BLOCK_TYPE as RETRIEVER_BLOCK } from '@/blockly/blocks/retriever'
export { BLOCK_TYPE as VERIFIER_BLOCK } from '@/blockly/blocks/verifier'

/**
 * Register all custom blocks with Blockly.
 * Call this before creating a workspace.
 */
export function registerAllBlocks(): void {
  agent.register()
  claimInput.register()
  claimProcessor.register()
  languageModel.register()
  promptTemplate.register()
  retriever.register()
  verifier.register()
}
