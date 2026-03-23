<script setup lang="ts">
import type * as Blockly from 'blockly/core'
import type { AcceptableValue } from 'reka-ui'
import { Eye, EyeOff } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getModelOptions, getProviderOptions } from '@/services/models.service'

const props = defineProps<{
  block: Blockly.Block
}>()

// ---------------------------------------------------------------------------
// Provider dropdown.
// ---------------------------------------------------------------------------

const providerOptions = ref<Array<[string, string]>>([])
const provider = ref(props.block.getFieldValue('PROVIDER') ?? 'openai')

// ---------------------------------------------------------------------------
// Model dropdown.
// ---------------------------------------------------------------------------

const modelOptions = ref<Array<[string, string]>>([])
const model = ref(props.block.getFieldValue('MODEL') ?? '')

onMounted(async () => {
  providerOptions.value = await getProviderOptions()
  modelOptions.value = await getModelOptions(provider.value)
})

// When provider changes, reload model options and sync block value.
watch(provider, async (newProvider) => {
  modelOptions.value = await getModelOptions(newProvider)
  // Wait for the block's loadAndRebuildModelRow (triggered via setFieldValue validator) to settle.
  setTimeout(() => {
    model.value = props.block.getFieldValue('MODEL') ?? modelOptions.value[0]?.[1] ?? ''
    refreshTemperature()
    refreshTopP()
    refreshMaxTokens()
    refreshFreqPenalty()
    refreshPresPenalty()
    refreshReasoningEffort()
  }, 300)
})

function syncProvider(value: AcceptableValue) {
  if (typeof value !== 'string')
    return
  provider.value = value
  // Block's PROVIDER validator fires loadAndRebuildModelRow automatically.
  props.block.setFieldValue(value, 'PROVIDER')
}

function syncModel(value: AcceptableValue) {
  if (typeof value !== 'string')
    return
  model.value = value
  props.block.setFieldValue(value, 'MODEL')
  // Block's MODEL validator fires updateTemperatureRow async; check after it settles.
  setTimeout(() => {
    refreshTemperature()
    refreshTopP()
    refreshMaxTokens()
    refreshFreqPenalty()
    refreshPresPenalty()
    refreshReasoningEffort()
  }, 200)
}

// ---------------------------------------------------------------------------
// API Key.
// ---------------------------------------------------------------------------

const apiKey = ref(props.block.getFieldValue('API_KEY') ?? '')
const showKey = ref(false)

function syncApiKey(value: string) {
  apiKey.value = value
  props.block.setFieldValue(value, 'API_KEY')
}

// ---------------------------------------------------------------------------
// Temperature (conditional — only when model supports it).
// ---------------------------------------------------------------------------

const hasTemperature = ref(!!props.block.getInput('TEMPERATURE_ROW'))
const temperature = ref(Number(props.block.getFieldValue('TEMPERATURE') ?? 0.7))

function refreshTemperature() {
  hasTemperature.value = !!props.block.getInput('TEMPERATURE_ROW')
  if (hasTemperature.value)
    temperature.value = Number(props.block.getFieldValue('TEMPERATURE') ?? 0.7)
}

function syncTemperature(value: number[] | undefined) {
  if (!value)
    return
  temperature.value = value[0]!
  props.block.setFieldValue(String(value[0]), 'TEMPERATURE')
}

// ---------------------------------------------------------------------------
// Top P (conditional — same visibility as temperature).
// ---------------------------------------------------------------------------

const hasTopP = ref(!!props.block.getInput('TOP_P_ROW'))
const topP = ref(Number(props.block.getFieldValue('TOP_P') ?? 1.0))

function refreshTopP() {
  hasTopP.value = !!props.block.getInput('TOP_P_ROW')
  if (hasTopP.value)
    topP.value = Number(props.block.getFieldValue('TOP_P') ?? 1.0)
}

function syncTopP(value: number[] | undefined) {
  if (!value)
    return
  topP.value = value[0]!
  props.block.setFieldValue(String(value[0]), 'TOP_P')
}

// ---------------------------------------------------------------------------
// Max Tokens (conditional — same visibility as temperature).
// ---------------------------------------------------------------------------

const hasMaxTokens = ref(!!props.block.getInput('MAX_TOKENS_ROW'))
const maxTokens = ref(Number(props.block.getFieldValue('MAX_TOKENS') ?? 4096))
const maxTokensLimit = ref(Number((props.block as any).__outputLimit ?? 16384))

function refreshMaxTokens() {
  hasMaxTokens.value = !!props.block.getInput('MAX_TOKENS_ROW')
  maxTokensLimit.value = Number((props.block as any).__outputLimit ?? 16384)
  if (hasMaxTokens.value)
    maxTokens.value = Number(props.block.getFieldValue('MAX_TOKENS') ?? 4096)
}

function syncMaxTokens(value: string | number) {
  const num = Math.max(1, Math.min(maxTokensLimit.value, Math.round(Number(value) || 4096)))
  maxTokens.value = num
  props.block.setFieldValue(String(num), 'MAX_TOKENS')
}

// ---------------------------------------------------------------------------
// Frequency Penalty (conditional — same visibility as temperature).
// ---------------------------------------------------------------------------

const hasFreqPenalty = ref(!!props.block.getInput('FREQ_PENALTY_ROW'))
const freqPenalty = ref(Number(props.block.getFieldValue('FREQ_PENALTY') ?? 0))

function refreshFreqPenalty() {
  hasFreqPenalty.value = !!props.block.getInput('FREQ_PENALTY_ROW')
  if (hasFreqPenalty.value)
    freqPenalty.value = Number(props.block.getFieldValue('FREQ_PENALTY') ?? 0)
}

function syncFreqPenalty(value: number[] | undefined) {
  if (!value)
    return
  freqPenalty.value = value[0]!
  props.block.setFieldValue(String(value[0]), 'FREQ_PENALTY')
}

// ---------------------------------------------------------------------------
// Presence Penalty (conditional — same visibility as temperature).
// ---------------------------------------------------------------------------

const hasPresPenalty = ref(!!props.block.getInput('PRES_PENALTY_ROW'))
const presPenalty = ref(Number(props.block.getFieldValue('PRES_PENALTY') ?? 0))

function refreshPresPenalty() {
  hasPresPenalty.value = !!props.block.getInput('PRES_PENALTY_ROW')
  if (hasPresPenalty.value)
    presPenalty.value = Number(props.block.getFieldValue('PRES_PENALTY') ?? 0)
}

function syncPresPenalty(value: number[] | undefined) {
  if (!value)
    return
  presPenalty.value = value[0]!
  props.block.setFieldValue(String(value[0]), 'PRES_PENALTY')
}

// ---------------------------------------------------------------------------
// Reasoning Effort (conditional — only for reasoning models without temperature).
// ---------------------------------------------------------------------------

const REASONING_EFFORT_OPTIONS: Array<[string, string]> = [
  ['Low', 'low'],
  ['Medium', 'medium'],
  ['High', 'high'],
]

const hasReasoningEffort = ref(!!props.block.getInput('REASONING_EFFORT_ROW'))
const reasoningEffort = ref(props.block.getFieldValue('REASONING_EFFORT') ?? 'medium')

function refreshReasoningEffort() {
  hasReasoningEffort.value = !!props.block.getInput('REASONING_EFFORT_ROW')
  if (hasReasoningEffort.value)
    reasoningEffort.value = props.block.getFieldValue('REASONING_EFFORT') ?? 'medium'
}

function syncReasoningEffort(value: AcceptableValue) {
  if (typeof value !== 'string')
    return
  reasoningEffort.value = value
  props.block.setFieldValue(value, 'REASONING_EFFORT')
}
</script>

<template>
  <TooltipProvider>
    <div class="flex flex-1 flex-col gap-4">
      <!-- Provider -->
      <div class="flex flex-col gap-1.5">
        <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Provider
        </Label>
        <Select :model-value="provider" @update:model-value="syncProvider">
          <SelectTrigger class="w-full" size="sm">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent data-no-deselect>
            <SelectItem
              v-for="[label, value] in providerOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Model -->
      <div class="flex flex-col gap-1.5">
        <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Model
        </Label>
        <Select :model-value="model" @update:model-value="syncModel">
          <SelectTrigger class="w-full font-mono" size="sm">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent data-no-deselect>
            <SelectItem
              v-for="[label, value] in modelOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- API Key -->
      <div class="flex flex-col gap-1.5">
        <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
          API Key
        </Label>
        <div class="relative">
          <Input
            :model-value="apiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="Paste your API key…"
            class="h-8 pr-8 font-mono text-xs"
            @update:model-value="syncApiKey(String($event))"
          />
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon-sm"
                class="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
                @click="showKey = !showKey"
              >
                <EyeOff v-if="showKey" :size="14" />
                <Eye v-else :size="14" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {{ showKey ? 'Hide key' : 'Show key' }}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- Temperature -->
      <div v-if="hasTemperature" class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Temperature
          </Label>
          <span class="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            {{ temperature.toFixed(1) }}
          </span>
        </div>
        <Slider
          :model-value="[temperature]"
          :min="0"
          :max="2"
          :step="0.1"
          class="w-full"
          @update:model-value="syncTemperature"
        />
        <div class="flex justify-between text-[10px] text-muted-foreground/50">
          <span>0 · Precise</span>
          <span>2 · Creative</span>
        </div>
      </div>

      <!-- Top P -->
      <div v-if="hasTopP" class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Top P
          </Label>
          <span class="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            {{ topP.toFixed(2) }}
          </span>
        </div>
        <Slider
          :model-value="[topP]"
          :min="0"
          :max="1"
          :step="0.05"
          class="w-full"
          @update:model-value="syncTopP"
        />
        <div class="flex justify-between text-[10px] text-muted-foreground/50">
          <span>0 · Narrow</span>
          <span>1 · Full</span>
        </div>
      </div>

      <!-- Max Tokens -->
      <div v-if="hasMaxTokens" class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Max Tokens
          </Label>
          <span class="text-[10px] text-muted-foreground/40">
            max {{ maxTokensLimit.toLocaleString() }}
          </span>
        </div>
        <Input
          :model-value="maxTokens"
          type="number"
          :min="1"
          :max="maxTokensLimit"
          class="h-8 font-mono text-xs"
          @update:model-value="syncMaxTokens"
        />
      </div>

      <!-- Frequency Penalty -->
      <div v-if="hasFreqPenalty" class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Freq Penalty
          </Label>
          <span class="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            {{ freqPenalty.toFixed(1) }}
          </span>
        </div>
        <Slider
          :model-value="[freqPenalty]"
          :min="0"
          :max="2"
          :step="0.1"
          class="w-full"
          @update:model-value="syncFreqPenalty"
        />
        <div class="flex justify-between text-[10px] text-muted-foreground/50">
          <span>0 · Off</span>
          <span>2 · Strong</span>
        </div>
      </div>

      <!-- Presence Penalty -->
      <div v-if="hasPresPenalty" class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Pres Penalty
          </Label>
          <span class="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">
            {{ presPenalty.toFixed(1) }}
          </span>
        </div>
        <Slider
          :model-value="[presPenalty]"
          :min="0"
          :max="2"
          :step="0.1"
          class="w-full"
          @update:model-value="syncPresPenalty"
        />
        <div class="flex justify-between text-[10px] text-muted-foreground/50">
          <span>0 · Off</span>
          <span>2 · Strong</span>
        </div>
      </div>

      <!-- Reasoning Effort -->
      <div v-if="hasReasoningEffort" class="flex flex-col gap-1.5">
        <Label class="text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Reasoning Effort
        </Label>
        <Select :model-value="reasoningEffort" @update:model-value="syncReasoningEffort">
          <SelectTrigger class="w-full" size="sm">
            <SelectValue placeholder="Select effort" />
          </SelectTrigger>
          <SelectContent data-no-deselect>
            <SelectItem
              v-for="[label, value] in REASONING_EFFORT_OPTIONS"
              :key="value"
              :value="value"
            >
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </TooltipProvider>
</template>
