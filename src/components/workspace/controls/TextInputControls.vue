<script setup lang="ts">
import type * as Blockly from 'blockly/core'
import SAMPLES from '@data/templates/textInputSamples.json'
import { Globe, Link, RefreshCw, Upload, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { fetchTextFromUrl } from '@/services/jina.service'

const props = defineProps<{
  block: Blockly.Block
}>()

// ---------------------------------------------------------------------------
// Reactive binding to the Blockly field value.
// ---------------------------------------------------------------------------

const fieldValue = ref(props.block.getFieldValue('INPUT_TEXT') ?? '')

watch(() => props.block, (blk) => {
  fieldValue.value = blk.getFieldValue('INPUT_TEXT') ?? ''
}, { immediate: true })

function syncToBlock(value: string) {
  fieldValue.value = value
  props.block.setFieldValue(value, 'INPUT_TEXT')
}

// ---------------------------------------------------------------------------
// Sample text cycling.
// ---------------------------------------------------------------------------

const sampleIndex = ref(0)

function cycleSample() {
  syncToBlock(SAMPLES[sampleIndex.value]!)
  sampleIndex.value = (sampleIndex.value + 1) % SAMPLES.length
}

// ---------------------------------------------------------------------------
// File upload.
// ---------------------------------------------------------------------------

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => syncToBlock(reader.result as string)
  reader.readAsText(file)
  input.value = ''
}

// ---------------------------------------------------------------------------
// URL fetch.
// ---------------------------------------------------------------------------

const showUrlInput = ref(false)
const urlInput = ref('')
const urlInputEl = ref<HTMLInputElement | null>(null)
const isFetching = ref(false)
const fetchError = ref('')
const fetchSuccess = ref(false)

async function openUrlInput() {
  showUrlInput.value = true
  fetchError.value = ''
  fetchSuccess.value = false
  await nextTick()
  urlInputEl.value?.focus()
}

function closeUrlInput() {
  showUrlInput.value = false
  urlInput.value = ''
  fetchError.value = ''
  fetchSuccess.value = false
}

async function fetchUrl() {
  const url = urlInput.value.trim()
  if (!url)
    return

  fetchError.value = ''
  fetchSuccess.value = false
  isFetching.value = true

  try {
    const text = await fetchTextFromUrl(url)
    if (!text)
      throw new Error('Could not extract text from this URL.')
    syncToBlock(text)
    fetchSuccess.value = true
  }
  catch (e: unknown) {
    fetchError.value = e instanceof Error ? e.message : 'Failed to fetch content from URL.'
  }
  finally {
    isFetching.value = false
  }
}

// ---------------------------------------------------------------------------
// Word count.
// ---------------------------------------------------------------------------

const wordCount = computed(() => {
  const trimmed = fieldValue.value.trim()
  if (!trimmed)
    return 0
  return trimmed.split(/\s+/).length
})
</script>

<template>
  <TooltipProvider>
    <div class="flex flex-1 flex-col gap-3">
      <!-- Action buttons row -->
      <div class="flex flex-wrap items-center gap-1">
        <span class="text-[10px] text-muted-foreground/60">{{ sampleIndex + 1 }}/{{ SAMPLES.length }}</span>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="sm" class="h-7 gap-1 px-1.5 text-[11px] text-muted-foreground" @click="cycleSample">
              <RefreshCw :size="12" />
              Sample
            </Button>
          </TooltipTrigger>
          <TooltipContent>Load a sample text</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button as="label" variant="ghost" size="sm" class="h-7 cursor-pointer gap-1 px-1.5 text-[11px] text-muted-foreground">
              <Upload :size="12" />
              Upload
              <input
                type="file"
                accept=".txt,.text,text/plain"
                class="sr-only"
                @change="handleFileUpload"
              >
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload a text file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="sm" class="h-7 gap-1 px-1.5 text-[11px] text-muted-foreground" @click="openUrlInput">
              <Link :size="12" />
              URL
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fetch from URL</TooltipContent>
        </Tooltip>

        <!-- Word count badge -->
        <span
          v-if="fieldValue"
          class="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
        >
          {{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}
        </span>
        <span
          v-else
          class="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          Empty
        </span>
      </div>

      <!-- URL input row -->
      <div v-if="showUrlInput" class="flex items-center gap-2">
        <div class="relative flex-1">
          <Globe :size="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref="urlInputEl"
            v-model="urlInput"
            type="url"
            placeholder="https://example.com/article"
            class="h-7 rounded-full pl-7 text-[11px]"
            @keydown.enter="fetchUrl"
          />
        </div>
        <Button
          size="sm"
          :disabled="!urlInput.trim() || isFetching"
          class="h-7 rounded-full px-2.5 text-[11px]"
          @click="fetchUrl"
        >
          {{ isFetching ? 'Fetching...' : 'Fetch' }}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          class="h-5 w-5 text-muted-foreground"
          @click="closeUrlInput"
        >
          <X :size="12" />
        </Button>
      </div>

      <p v-if="fetchError" class="text-[11px] text-red-400">
        {{ fetchError }}
      </p>
      <p v-else-if="fetchSuccess" class="text-[11px] text-emerald-400">
        Content fetched and loaded.
      </p>

      <!-- Textarea -->
      <textarea
        :value="fieldValue"
        placeholder="Paste or type the text you want to fact-check..."
        class="w-full flex-1 resize-none rounded-md border border-input bg-transparent p-2.5 text-xs text-foreground leading-relaxed shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @input="syncToBlock(($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </TooltipProvider>
</template>
