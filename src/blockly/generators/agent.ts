import type * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE, connectedTemplateVariables, varInputName } from '@/blockly/blocks/agent'
import { BLOCK_TYPE as STRUCTURED_OUTPUT_TYPE } from '@/blockly/blocks/structuredOutput'
import { varNameFor } from './varNames'

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string => {
    const promptBlock = block.getInputTargetBlock('PROMPT')
    const modelBlock = block.getInputTargetBlock('MODEL')
    const outputBlock = block.getInputTargetBlock('STRUCTURED_OUTPUT')

    // Generate the children first so each allocates its variable name, then
    // read those real names back so this agent references the right objects.
    const promptCode = promptBlock ? (generator.blockToCode(promptBlock) as string) : ''
    const modelCode = modelBlock ? (generator.blockToCode(modelBlock) as string) : ''
    const outputCode = outputBlock ? (generator.blockToCode(outputBlock) as string) : ''
    const promptVar = promptBlock ? varNameFor(promptBlock, generator, 'prompt_template') : 'prompt_template'
    const modelVar = modelBlock ? varNameFor(modelBlock, generator, 'client') : 'client'

    // Fill the template's variables, then send the messages to the client.
    const variables = connectedTemplateVariables(block)
    const fillArgs = variables
      .map(v => `${v}=${generator.valueToCode(block, varInputName(v), Order.ATOMIC) || '""'}`)
      .join(', ')
    const messages = `${promptVar}.to_messages(${fillArgs})`
    const responseVar = varNameFor(block, generator, 'response')

    // A connected schema constrains the reply to that model; otherwise free text.
    const responseLine = outputBlock?.type === STRUCTURED_OUTPUT_TYPE
      ? `${responseVar} = ${modelVar}.completion_as(${messages}, ${varNameFor(outputBlock, generator, 'Output')})`
      : `${responseVar} = ${modelVar}.completion(${messages})`

    // Separate each statement with a blank line so the generated code reads clearly.
    // (`outputCode` is empty: the schema model is hoisted to the top of the file.)
    const statements = [promptCode, modelCode, outputCode, responseLine]
      .map(part => part.trim())
      .filter(Boolean)
    return `${statements.join('\n\n')}\n`
  }
}
