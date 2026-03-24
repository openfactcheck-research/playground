import type { ModelInfo } from '@/services/models.service'
import { FieldSlider } from '@blockly/field-slider'
import * as Blockly from 'blockly/core'
import { pythonGenerator } from 'blockly/python'
import { FieldBlockHeader } from '@/blockly/fields/fieldBlockHeader'
import { FieldPasswordInput } from '@/blockly/fields/fieldPasswordInput'
import {
  FALLBACK_MODELS,
  FALLBACK_PROVIDERS,
  getModelInfo,
  getModelInfoSync,
  getModelOptions,
  getProviderOptions,
} from '@/services/models.service'

export const BLOCK_TYPE = 'language_model'

// Blockly warns when it tries to restore TEMPERATURE/TOP_P/MAX_TOKENS/FREQ_PENALTY/PRES_PENALTY
// before their rows are dynamically added. This is harmless — we restore values manually via
// pending fields in the apply functions.
const _warn = console.warn.bind(console)
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (typeof args[0] === 'string' && (args[0].includes('TEMPERATURE') || args[0].includes('TOP_P') || args[0].includes('MAX_TOKENS') || args[0].includes('FREQ_PENALTY') || args[0].includes('PRES_PENALTY') || args[0].includes('REASONING_EFFORT')) && args[0].includes(BLOCK_TYPE))
    return
  _warn(...args)
}

const BLOCK_WIDTH = 160

// Lucide sparkles path scaled to 12×12 (÷2 from 24×24 source)
const ICON_SPARKLES = 'M4.969 7.75A1 1 0 0 0 4.25 7.031l-3.068-.791a.25.25 0 0 1 0-.481L4.25 4.969A1 1 0 0 0 4.969 4.25l.791-3.068a.25.25 0 0 1 .481 0L7.031 4.25A1 1 0 0 0 7.75 4.969l3.068.791a.25.25 0 0 1 0 .481L7.75 7.031a1 1 0 0 0-.719.719l-.791 3.068a.25.25 0 0 1-.481 0z M10 1.5v2 M11 2.5h-2 M2 8.5v1 M2.5 9H1.5'

const API_KEY_LABELS: Record<string, string> = {
  openai: 'OpenAI API Key',
  anthropic: 'Anthropic API Key',
  google: 'Google API Key',
}

// FieldSlider that skips Blockly's auto-serialization — handled via saveExtraState/loadExtraState.
class FieldDeferredSlider extends FieldSlider {
  override saveState(): null {
    return null
  }
}

// FieldNumber that skips Blockly's auto-serialization — handled via saveExtraState/loadExtraState.
class FieldDeferredNumber extends Blockly.FieldNumber {
  override saveState(): null {
    return null
  }
}

// FieldDropdown that silently accepts values not yet in its options list.
// Used for MODEL — options load async so Blockly's "unavailable option" warning is a false positive.
// saveState returns null so Blockly doesn't serialize this field; handled via saveExtraState instead.
class FieldDeferredDropdown extends Blockly.FieldDropdown {
  override doValueInvalid_(_text: string): void {
    // Suppress warning — options haven't loaded yet
  }

  override saveState(): null {
    return null
  }
}

// Populated async on module load; read sync by the provider dropdown generator
let providerOptions: Array<[string, string]> = FALLBACK_PROVIDERS

getProviderOptions().then((opts) => {
  providerOptions = opts
})

function fireChange(block: Blockly.Block): void {
  Blockly.Events.fire(new Blockly.Events.BlockChange(block, 'field', 'PROVIDER', null, null))
}

function applyTemperatureRow(block: Blockly.Block, show: boolean): void {
  const hasRow = !!block.getInput('TEMPERATURE_ROW')
  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('TEMPERATURE_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Temperature')
        .appendField(new FieldDeferredSlider(0.7, 0, 2, 0.1), 'TEMPERATURE')
      // Restore pending temperature from deserialization
      const pendingTemp = (block as any).__pendingTemp
      if (pendingTemp !== null && pendingTemp !== undefined) {
        block.setFieldValue(String(pendingTemp), 'TEMPERATURE')
        ;(block as any).__pendingTemp = null
      }
    }
    else {
      block.removeInput('TEMPERATURE_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

function applyTopPRow(block: Blockly.Block, show: boolean): void {
  const hasRow = !!block.getInput('TOP_P_ROW')
  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('TOP_P_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Top P')
        .appendField(new FieldDeferredSlider(1.0, 0, 1, 0.05), 'TOP_P')
      const pendingTopP = (block as any).__pendingTopP
      if (pendingTopP !== null && pendingTopP !== undefined) {
        block.setFieldValue(String(pendingTopP), 'TOP_P')
        ;(block as any).__pendingTopP = null
      }
    }
    else {
      block.removeInput('TOP_P_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_OUTPUT_LIMIT = 16384

function applyMaxTokensRow(block: Blockly.Block, show: boolean): void {
  const outputLimit = (block as any).__outputLimit ?? DEFAULT_OUTPUT_LIMIT
  const hasRow = !!block.getInput('MAX_TOKENS_ROW')

  if (show && hasRow) {
    // Row exists — just update the field's max constraint
    const field = block.getField('MAX_TOKENS') as FieldDeferredNumber | null
    if (field) {
      ;(field as any).max_ = outputLimit
      // Clamp current value if it exceeds new max
      const current = Number(field.getValue()) || DEFAULT_MAX_TOKENS
      if (current > outputLimit)
        block.setFieldValue(String(outputLimit), 'MAX_TOKENS')
    }
    return
  }

  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('MAX_TOKENS_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Max Tokens')
        .appendField(new FieldDeferredNumber(DEFAULT_MAX_TOKENS, 1, outputLimit, 1), 'MAX_TOKENS')
      const pending = (block as any).__pendingMaxTokens
      if (pending !== null && pending !== undefined) {
        const clamped = Math.min(Number(pending), outputLimit)
        block.setFieldValue(String(clamped), 'MAX_TOKENS')
        ;(block as any).__pendingMaxTokens = null
      }
    }
    else {
      block.removeInput('MAX_TOKENS_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

function applyFreqPenaltyRow(block: Blockly.Block, show: boolean): void {
  const hasRow = !!block.getInput('FREQ_PENALTY_ROW')
  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('FREQ_PENALTY_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Freq Penalty')
        .appendField(new FieldDeferredSlider(0, 0, 2, 0.1), 'FREQ_PENALTY')
      const pending = (block as any).__pendingFreqPenalty
      if (pending !== null && pending !== undefined) {
        block.setFieldValue(String(pending), 'FREQ_PENALTY')
        ;(block as any).__pendingFreqPenalty = null
      }
    }
    else {
      block.removeInput('FREQ_PENALTY_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

function applyPresPenaltyRow(block: Blockly.Block, show: boolean): void {
  const hasRow = !!block.getInput('PRES_PENALTY_ROW')
  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('PRES_PENALTY_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Pres Penalty')
        .appendField(new FieldDeferredSlider(0, 0, 2, 0.1), 'PRES_PENALTY')
      const pending = (block as any).__pendingPresPenalty
      if (pending !== null && pending !== undefined) {
        block.setFieldValue(String(pending), 'PRES_PENALTY')
        ;(block as any).__pendingPresPenalty = null
      }
    }
    else {
      block.removeInput('PRES_PENALTY_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

const REASONING_EFFORT_OPTIONS: Array<[string, string]> = [
  ['Low', 'low'],
  ['Medium', 'medium'],
  ['High', 'high'],
]

function applyReasoningEffortRow(block: Blockly.Block, show: boolean): void {
  const hasRow = !!block.getInput('REASONING_EFFORT_ROW')
  if (show === hasRow)
    return
  Blockly.Events.disable()
  try {
    if (show) {
      block.appendDummyInput('REASONING_EFFORT_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Reasoning')
        .appendField(new FieldDeferredDropdown(REASONING_EFFORT_OPTIONS), 'REASONING_EFFORT')
      const pending = (block as any).__pendingReasoningEffort
      if (pending !== null && pending !== undefined) {
        block.setFieldValue(String(pending), 'REASONING_EFFORT')
        ;(block as any).__pendingReasoningEffort = null
      }
    }
    else {
      block.removeInput('REASONING_EFFORT_ROW', true)
    }
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

function applyModelParams(block: Blockly.Block, info: ModelInfo | null): void {
  const supportsTemp = info ? info.temperature !== false : true
  const isReasoningOnly = info ? info.reasoning === true && info.temperature === false : false
  // Store the model's output limit so applyMaxTokensRow can use it
  ;(block as any).__outputLimit = info?.limit?.output ?? DEFAULT_OUTPUT_LIMIT
  applyTemperatureRow(block, supportsTemp)
  applyTopPRow(block, supportsTemp)
  applyMaxTokensRow(block, supportsTemp || isReasoningOnly)
  applyFreqPenaltyRow(block, supportsTemp)
  applyPresPenaltyRow(block, supportsTemp)
  applyReasoningEffortRow(block, isReasoningOnly)
}

function updateTemperatureRow(block: Blockly.Block, providerId: string, modelId: string): void {
  const syncInfo = getModelInfoSync(providerId, modelId)
  if (syncInfo !== null) {
    applyModelParams(block, syncInfo)
    return
  }
  getModelInfo(providerId, modelId).then((info) => {
    if (block.getFieldValue('MODEL') !== modelId)
      return
    applyModelParams(block, info)
  })
}

function rebuildModelRow(block: Blockly.Block, models: Array<[string, string]>): void {
  Blockly.Events.disable()
  try {
    block.removeInput('MODEL_ROW', true)
    block.appendDummyInput('MODEL_ROW')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField('Name')
      .appendField(
        new FieldDeferredDropdown(models, (newModel: string) => {
          const providerId = block.getFieldValue('PROVIDER') ?? 'openai'
          setTimeout(() => updateTemperatureRow(block, providerId, newModel), 0)
          return newModel
        }),
        'MODEL',
      )
    block.moveInputBefore('MODEL_ROW', 'API_KEY_ROW')
  }
  finally {
    Blockly.Events.enable()
  }
  ;(block as Blockly.BlockSvg).initSvg()
  ;(block as Blockly.BlockSvg).render()
  fireChange(block)
}

function loadAndRebuildModelRow(block: Blockly.Block, providerId: string): void {
  block.setFieldValue(API_KEY_LABELS[providerId] ?? 'API Key', 'API_KEY_LABEL')
  rebuildModelRow(block, FALLBACK_MODELS)

  getModelOptions(providerId).then((opts) => {
    if (block.getFieldValue('PROVIDER') !== providerId)
      return
    rebuildModelRow(block, opts)

    // Restore saved model from deserialization, or fall back to first option
    const pendingModel = (block as any).__pendingModel as string | null
    const modelToUse = pendingModel && opts.some(([, v]) => v === pendingModel)
      ? pendingModel
      : opts[0]?.[1]
    if (modelToUse) {
      block.setFieldValue(modelToUse, 'MODEL')
      ;(block as any).__pendingModel = null
    }

    updateTemperatureRow(block, providerId, block.getFieldValue('MODEL') ?? modelToUse ?? '')
  })
}

export function register(): void {
  Blockly.Blocks[BLOCK_TYPE] = {
    init(this: Blockly.Block): void {
      this.appendDummyInput()
        .appendField(new FieldBlockHeader('Language Model', ICON_SPARKLES, BLOCK_WIDTH))

      this.appendDummyInput('PROVIDER_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Provider')
        .appendField(
          new Blockly.FieldDropdown(
            () => providerOptions,
            (newProvider: string) => {
              setTimeout(() => loadAndRebuildModelRow(this, newProvider), 0)
              return newProvider
            },
          ),
          'PROVIDER',
        )

      this.appendDummyInput('MODEL_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('Name')
        .appendField(new FieldDeferredDropdown(FALLBACK_MODELS), 'MODEL')

      this.appendDummyInput('API_KEY_ROW')
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField(new Blockly.FieldLabel(API_KEY_LABELS.openai), 'API_KEY_LABEL')
        .appendField(new FieldPasswordInput(''), 'API_KEY')

      this.setPreviousStatement(true, 'LanguageModel')
      this.setNextStatement(true, 'LanguageModel')
      this.setInputsInline(false)
      this.setStyle('models_blocks')
      this.setTooltip('Configure a language model')
    },

    saveExtraState(this: Blockly.Block) {
      return {
        model: this.getFieldValue('MODEL'),
        temperature: this.getInput('TEMPERATURE_ROW')
          ? Number(this.getFieldValue('TEMPERATURE'))
          : null,
        topP: this.getInput('TOP_P_ROW')
          ? Number(this.getFieldValue('TOP_P'))
          : null,
        maxTokens: this.getInput('MAX_TOKENS_ROW')
          ? Number(this.getFieldValue('MAX_TOKENS'))
          : null,
        freqPenalty: this.getInput('FREQ_PENALTY_ROW')
          ? Number(this.getFieldValue('FREQ_PENALTY'))
          : null,
        presPenalty: this.getInput('PRES_PENALTY_ROW')
          ? Number(this.getFieldValue('PRES_PENALTY'))
          : null,
        reasoningEffort: this.getInput('REASONING_EFFORT_ROW')
          ? this.getFieldValue('REASONING_EFFORT')
          : null,
      }
    },

    loadExtraState(this: Blockly.Block, state: Record<string, unknown>) {
      ;(this as any).__pendingModel = state?.model ?? null
      ;(this as any).__pendingTemp = state?.temperature ?? null
      ;(this as any).__pendingTopP = state?.topP ?? null
      ;(this as any).__pendingMaxTokens = state?.maxTokens ?? null
      ;(this as any).__pendingFreqPenalty = state?.freqPenalty ?? null
      ;(this as any).__pendingPresPenalty = state?.presPenalty ?? null
      ;(this as any).__pendingReasoningEffort = state?.reasoningEffort ?? null
    },
  }

  pythonGenerator.forBlock[BLOCK_TYPE] = (block: Blockly.Block): string => {
    const provider = block.getFieldValue('PROVIDER') ?? 'openai'
    const model = block.getFieldValue('MODEL') ?? 'default'
    const apiKey = block.getFieldValue('API_KEY') ?? ''
    const temp = block.getInput('TEMPERATURE_ROW')
      ? `temperature=${block.getFieldValue('TEMPERATURE') ?? 0.7}, `
      : ''
    const topP = block.getInput('TOP_P_ROW')
      ? `top_p=${block.getFieldValue('TOP_P') ?? 1.0}, `
      : ''
    const maxTokens = block.getInput('MAX_TOKENS_ROW')
      ? `max_tokens=${block.getFieldValue('MAX_TOKENS') ?? 4096}, `
      : ''
    const freqPenalty = block.getInput('FREQ_PENALTY_ROW')
      ? `frequency_penalty=${block.getFieldValue('FREQ_PENALTY') ?? 0}, `
      : ''
    const presPenalty = block.getInput('PRES_PENALTY_ROW')
      ? `presence_penalty=${block.getFieldValue('PRES_PENALTY') ?? 0}, `
      : ''
    const reasoningEffort = block.getInput('REASONING_EFFORT_ROW')
      ? `reasoning_effort="${block.getFieldValue('REASONING_EFFORT') ?? 'medium'}", `
      : ''
    return `language_model = LanguageModel(provider="${provider}", model="${model}", ${temp}${topP}${maxTokens}${freqPenalty}${presPenalty}${reasoningEffort}api_key="${apiKey}")\n`
  }
}
