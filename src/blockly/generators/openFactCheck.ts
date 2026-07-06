import type * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { BLOCK_TYPE } from '@/blockly/blocks/openFactCheck'
import { samplingArgs } from './modelParams'
import { distinctName, varNameFor } from './varNames'

export function register(): void {
  pythonGenerator.forBlock[BLOCK_TYPE] = (
    block: Blockly.Block,
    generator: typeof pythonGenerator,
  ): string => {
    const pipeline = block.getFieldValue('PIPELINE') ?? 'factool'
    const modelBlock = block.getInputTargetBlock('MODEL')

    // The facade takes the model as a "provider/model" string, or a ModelSpec when the
    // block also sets sampling parameters, and builds the pipeline's own clients from it.
    // So read the connected language model's fields rather than generating a ChatClient.
    const configArgs = [`pipeline="${pipeline}"`]
    const symbols = ['OpenFactCheck', 'OpenFactCheckConfig']
    let usesModelSpec = false
    if (modelBlock) {
      const provider = modelBlock.getFieldValue('PROVIDER') ?? 'openai'
      const model = modelBlock.getFieldValue('MODEL') ?? ''
      const sampling = samplingArgs(modelBlock)
      if (model && sampling.length > 0) {
        // A ModelSpec is laid out over several lines, so its parameters stay readable.
        const specArgs = [`name="${provider}/${model}"`, ...sampling]
          .map(arg => `        ${arg},`)
          .join('\n')
        configArgs.push(`model=ModelSpec(\n${specArgs}\n    )`)
        symbols.push('ModelSpec')
        usesModelSpec = true
      }
      else if (model) {
        configArgs.push(`model="${provider}/${model}"`)
      }
    }

    // Hoist the import; Blockly groups imports into one block at the top.
    const importLine = `from openfactcheck import ${symbols.sort().join(', ')}`
    ;(generator as unknown as { definitions_: Record<string, string> }).definitions_[importLine] = importLine

    // A fresh name for the config, the block's own name for the result. The input
    // text comes from an Input Text block wired above, which assigns `input_text`.
    // A leading blank line separates this block's code from the block above it.
    const configVar = distinctName(generator, 'config')
    const resultVar = varNameFor(block, generator, 'openfactcheck')

    // Break the config across lines only when it nests a ModelSpec; short forms stay inline.
    const configCall = usesModelSpec
      ? `OpenFactCheckConfig(\n${configArgs.map(arg => `    ${arg},`).join('\n')}\n)`
      : `OpenFactCheckConfig(${configArgs.join(', ')})`
    return `\n${configVar} = ${configCall}\n${resultVar} = OpenFactCheck(${configVar}).run(input_text)\n`
  }
}
