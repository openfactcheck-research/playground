/**
 * Language Model Block
 * Configures an LLM for use in fact-checking pipelines
 * Models fetched dynamically from models.dev
 */
import { FieldSlider } from '@blockly/field-slider'
import * as Blockly from 'blockly/core'
import { Order, pythonGenerator } from 'blockly/python'
import { PALETTE } from '@/blockly/theme'
import {
  FALLBACK_MODELS,
  FALLBACK_PROVIDERS,
  fetchModelsData,
  getModelOptions,
} from '@/services/models.service'

// MenuOption type: [label, value]
type MenuOption = [string, string]

// Cache for loaded models per provider
const modelCache = new Map<string, MenuOption[]>()
let cachedProviders: MenuOption[] = FALLBACK_PROVIDERS

export const BLOCK_TYPE = 'llm'

// Pre-fetch models data on module load
async function preloadModelsData(): Promise<void> {
  try {
    const data = await fetchModelsData()
    const providers: MenuOption[] = []

    for (const [id, provider] of data.providers) {
      providers.push([provider.name, id])
    }

    if (providers.length > 0) {
      cachedProviders = providers
    }
  }
  catch {
    // Use fallbacks
  }
}

// Start preloading immediately
preloadModelsData()

/**
 * Get models for a provider (async with caching)
 */
async function loadModelsForProvider(providerId: string): Promise<MenuOption[]> {
  // Check cache first
  const cached = modelCache.get(providerId)
  if (cached)
    return cached

  try {
    const models = await getModelOptions(providerId)
    modelCache.set(providerId, models)
    return models
  }
  catch {
    return FALLBACK_MODELS
  }
}

export function register(): void {
  // Logo URL helper
  const getLogoUrl = (provider: string) => `https://models.dev/logos/${provider}.svg`
  const DEFAULT_PROVIDER = 'openai'

  // Block definition
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField('𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 𝗠𝗼𝗱𝗲𝗹')

      // Provider dropdown with dynamic menu generator
      this.appendDummyInput('PROVIDER_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new Blockly.FieldImage(getLogoUrl(DEFAULT_PROVIDER), 24, 24, 'Provider Logo'), 'LOGO')
        .appendField('Provider')
        .appendField(
          new Blockly.FieldDropdown(
            () => cachedProviders,
            function (this: Blockly.FieldDropdown, newProvider: string) {
              const block = this.getSourceBlock()
              if (block) {
                // Update provider logo
                const logoField = block.getField('LOGO') as Blockly.FieldImage
                if (logoField) {
                  logoField.setValue(getLogoUrl(newProvider))
                }
                updateModelDropdown(block as Blockly.Block, newProvider)
              }
              return newProvider
            },
          ),
          'PROVIDER',
        )

      // Model dropdown - starts with loading state
      this.appendDummyInput('MODEL_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Model')
        .appendField(new Blockly.FieldDropdown(FALLBACK_MODELS), 'MODEL')

      // Load initial models for default provider
      const block = this as Blockly.Block
      setTimeout(() => {
        const provider = block.getFieldValue('PROVIDER') as string
        if (provider) {
          // Update logo for initial provider
          const logoField = block.getField('LOGO') as Blockly.FieldImage
          if (logoField) {
            logoField.setValue(getLogoUrl(provider))
          }
          updateModelDropdown(block, provider)
        }
      }, 0)

      this.appendDummyInput('TEMPERATURE_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Temperature')
        .appendField(new FieldSlider(0.7, 0, 2, 0.1), 'TEMPERATURE')

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Top P')
        .appendField(new FieldSlider(1.0, 0, 1, 0.05), 'TOP_P')

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Top K')
        .appendField(new FieldSlider(40, 1, 100, 1), 'TOP_K')

      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Max Tokens')
        .appendField(new FieldSlider(1024, 1, 8192, 128), 'MAX_TOKENS')

      this.setOutput(true, 'LLMConfig')
      this.setInputsInline(false)
      this.setColour(PALETTE.violet)
      this.setTooltip('Configure an LLM for inference in your pipeline')
      this.setHelpUrl('https://models.dev')
    },
  }

  // Python code generator
  pythonGenerator.forBlock[BLOCK_TYPE] = function (
    block: Blockly.Block,
    _generator: typeof pythonGenerator,
  ): [string, Order] {
    const provider = block.getFieldValue('PROVIDER') as string
    const model = block.getFieldValue('MODEL') as string
    const temperature = block.getFieldValue('TEMPERATURE') as number
    const topP = block.getFieldValue('TOP_P') as number
    const topK = block.getFieldValue('TOP_K') as number
    const maxTokens = block.getFieldValue('MAX_TOKENS') as number

    const config = `{
    "provider": "${provider}",
    "model": "${model}",
    "temperature": ${temperature},
    "top_p": ${topP},
    "top_k": ${topK},
    "max_tokens": ${maxTokens}
}`

    return [config, Order.ATOMIC]
  }
}

function updateModelDropdown(block: Blockly.Block, provider: string): void {
  // Remove the entire MODEL_INPUT and recreate it
  block.removeInput('MODEL_INPUT', true)

  // Check if we have cached models
  const cached = modelCache.get(provider)

  if (cached) {
    // Use cached models immediately
    createModelInput(block, cached)
  }
  else {
    // Show loading state and fetch models async
    createModelInput(block, FALLBACK_MODELS)

    loadModelsForProvider(provider).then((models) => {
      // Only update if still the same provider
      const currentProvider = block.getFieldValue('PROVIDER') as string
      if (currentProvider === provider && models !== FALLBACK_MODELS) {
        block.removeInput('MODEL_INPUT', true)
        createModelInput(block, models)
      }
    })
  }
}

function createModelInput(block: Blockly.Block, models: MenuOption[]): void {
  block.appendDummyInput('MODEL_INPUT')
    .setAlign(Blockly.inputs.Align.RIGHT)
    .appendField('Model')
    .appendField(new Blockly.FieldDropdown(models), 'MODEL')

  // Move MODEL_INPUT to correct position (after PROVIDER_INPUT)
  block.moveInputBefore('MODEL_INPUT', 'TEMPERATURE_INPUT')
}
