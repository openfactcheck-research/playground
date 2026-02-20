import type { ModelInfo } from '@/services/models.service'
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
  getModelInfo,
  getModelInfoSync,
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
        .appendField(
          new Blockly.FieldDropdown(
            FALLBACK_MODELS,
            function (this: Blockly.FieldDropdown, newModel: string) {
              const block = this.getSourceBlock()
              if (block) {
                // Defer to escape Blockly's event handling lock
                setTimeout(() => updateCapabilityInputs(block as Blockly.Block), 0)
              }
              return newModel
            },
          ),
          'MODEL',
        )

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

      // Note: REASONING_INPUT is added dynamically by updateCapabilityInputs
      // when the model supports reasoning

      // Temperature slider (shown by default, hidden if model doesn't support it)
      this.appendDummyInput('TEMPERATURE_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Temperature')
        .appendField(new FieldSlider(0.7, 0, 2, 0.1), 'TEMPERATURE')

      this.appendDummyInput('TOP_P_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Top P')
        .appendField(new FieldSlider(1.0, 0, 1, 0.05), 'TOP_P')

      this.appendDummyInput('TOP_K_INPUT')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Top K')
        .appendField(new FieldSlider(40, 1, 100, 1), 'TOP_K')

      this.appendDummyInput('MAX_TOKENS_INPUT')
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
    const reasoning = block.getFieldValue('REASONING') as string
    const temperature = block.getFieldValue('TEMPERATURE') as number
    const topP = block.getFieldValue('TOP_P') as number
    const topK = block.getFieldValue('TOP_K') as number
    const maxTokens = block.getFieldValue('MAX_TOKENS') as number

    // Build config object, only include fields that exist on the block
    const configObj: Record<string, unknown> = {
      provider,
      model,
      top_p: topP,
      top_k: topK,
      max_tokens: maxTokens,
    }

    // Only include reasoning if the input exists
    if (block.getInput('REASONING_INPUT')) {
      configObj.reasoning = reasoning === 'true'
    }

    // Only include temperature if the input exists
    if (block.getInput('TEMPERATURE_INPUT')) {
      configObj.temperature = temperature
    }

    const config = JSON.stringify(configObj, null, 4)

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
    // Defer capability update to next frame
    setTimeout(() => updateCapabilityInputs(block), 0)
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
        // Defer capability update to next frame
        setTimeout(() => updateCapabilityInputs(block), 0)
      }
    })
  }
}

function createModelInput(block: Blockly.Block, models: MenuOption[]): void {
  block.appendDummyInput('MODEL_INPUT')
    .setAlign(Blockly.inputs.Align.RIGHT)
    .appendField('Model')
    .appendField(
      new Blockly.FieldDropdown(
        models,
        function (this: Blockly.FieldDropdown, newModel: string) {
          const sourceBlock = this.getSourceBlock()
          if (sourceBlock) {
            // Defer to escape Blockly's event handling lock
            setTimeout(() => updateCapabilityInputs(sourceBlock as Blockly.Block), 0)
          }
          return newModel
        },
      ),
      'MODEL',
    )

  // Move MODEL_INPUT to correct position (after PROVIDER_INPUT)
  // Try REASONING_INPUT first, then TEMPERATURE_INPUT, then TOP_P_INPUT
  if (block.getInput('REASONING_INPUT')) {
    block.moveInputBefore('MODEL_INPUT', 'REASONING_INPUT')
  }
  else if (block.getInput('TEMPERATURE_INPUT')) {
    block.moveInputBefore('MODEL_INPUT', 'TEMPERATURE_INPUT')
  }
  else if (block.getInput('TOP_P_INPUT')) {
    block.moveInputBefore('MODEL_INPUT', 'TOP_P_INPUT')
  }
}

/**
 * Apply capability input changes to the block
 */
function applyCapabilityChanges(block: Blockly.Block, info: ModelInfo | null): void {
  if (block.isDeadOrDying())
    return

  const supportsReasoning = info?.reasoning === true
  const supportsTemperature = info?.temperature !== false // Default to true if not specified

  let changed = false

  // Handle REASONING_INPUT visibility
  const hasReasoningInput = !!block.getInput('REASONING_INPUT')
  if (supportsReasoning && !hasReasoningInput) {
    // Add reasoning input
    block.appendDummyInput('REASONING_INPUT')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField('Reasoning')
      .appendField(new Blockly.FieldDropdown([['Enabled', 'true'], ['Disabled', 'false']]), 'REASONING')
    // Position after MODEL_INPUT
    const tempInput = block.getInput('TEMPERATURE_INPUT')
    if (tempInput) {
      block.moveInputBefore('REASONING_INPUT', 'TEMPERATURE_INPUT')
    }
    else {
      block.moveInputBefore('REASONING_INPUT', 'TOP_P_INPUT')
    }
    changed = true
  }
  else if (!supportsReasoning && hasReasoningInput) {
    // Remove reasoning input
    block.removeInput('REASONING_INPUT', true)
    changed = true
  }

  // Handle TEMPERATURE_INPUT visibility
  const hasTempInput = !!block.getInput('TEMPERATURE_INPUT')
  if (supportsTemperature && !hasTempInput) {
    // Add temperature input
    block.appendDummyInput('TEMPERATURE_INPUT')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField('Temperature')
      .appendField(new FieldSlider(0.7, 0, 2, 0.1), 'TEMPERATURE')
    block.moveInputBefore('TEMPERATURE_INPUT', 'TOP_P_INPUT')
    changed = true
  }
  else if (!supportsTemperature && hasTempInput) {
    // Remove temperature input
    block.removeInput('TEMPERATURE_INPUT', true)
    changed = true
  }

  // Force re-render if inputs changed
  if (changed && block.rendered) {
    requestAnimationFrame(() => {
      if (!block.isDeadOrDying()) {
        const svgBlock = block as Blockly.BlockSvg
        svgBlock.initSvg()
        svgBlock.render()
      }
    })
  }
}

/**
 * Update visibility of REASONING and TEMPERATURE inputs based on model capabilities
 */
function updateCapabilityInputs(block: Blockly.Block): void {
  const provider = block.getFieldValue('PROVIDER') as string
  const model = block.getFieldValue('MODEL') as string

  // Try sync cache first (instant if data is already loaded)
  const syncInfo = getModelInfoSync(provider, model)
  if (syncInfo !== null) {
    applyCapabilityChanges(block, syncInfo)
    return
  }

  // Fall back to async fetch
  getModelInfo(provider, model).then((info) => {
    // Only update if still the same model
    const currentModel = block.getFieldValue('MODEL') as string
    if (currentModel !== model)
      return
    applyCapabilityChanges(block, info)
  })
}
