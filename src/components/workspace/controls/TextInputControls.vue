<script setup lang="ts">
import type * as Blockly from 'blockly/core'
import SAMPLES from '@data/templates/textInputSamples.json'
import { Globe, Link, Maximize2, RefreshCw, Upload, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
// Expand dialog.
// ---------------------------------------------------------------------------

const showExpandDialog = ref(false)

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
  <div class="flex flex-1 flex-col gap-3">
    <!-- Action buttons row -->
    <div class="flex flex-wrap items-center gap-1">
      <span class="text-[10px] text-muted-foreground/60">{{ sampleIndex + 1 }}/{{ SAMPLES.length }}</span>
      <button
        class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Load a sample"
        @click="cycleSample"
      >
        <RefreshCw :size="12" />
        Sample
      </button>
      <label
        class="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Upload a text file"
      >
        <Upload :size="12" />
        Upload
        <input
          type="file"
          accept=".txt,.text,text/plain"
          class="sr-only"
          @change="handleFileUpload"
        >
      </label>
      <button
        class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Fetch from URL"
        @click="openUrlInput"
      >
        <Link :size="12" />
        URL
      </button>
      <button
        class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Expand in dialog"
        @click="showExpandDialog = true"
      >
        <Maximize2 :size="12" />
        Expand
      </button>
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
      <div class="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 transition-colors focus-within:border-primary/50">
        <Globe :size="12" class="shrink-0 text-muted-foreground" />
        <input
          ref="urlInputEl"
          v-model="urlInput"
          type="url"
          placeholder="https://example.com/article"
          class="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          @keydown.enter="fetchUrl"
        >
      </div>
      <button
        :disabled="!urlInput.trim() || isFetching"
        class="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
        :class="urlInput.trim() && !isFetching
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-secondary text-muted-foreground cursor-not-allowed'"
        @click="fetchUrl"
      >
        {{ isFetching ? 'Fetching...' : 'Fetch' }}
      </button>
      <button
        class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        @click="closeUrlInput"
      >
        <X :size="12" />
      </button>
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
      class="w-full flex-1 resize-none rounded-md border border-border bg-background p-2.5 text-xs text-foreground leading-relaxed placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      @input="syncToBlock(($event.target as HTMLTextAreaElement).value)"
    />
  </div>

  <!-- Expand dialog -->
  <Dialog v-model:open="showExpandDialog">
    <DialogContent class="flex h-[80vh] max-w-2xl flex-col">
      <DialogHeader>
        <DialogTitle>Input Text</DialogTitle>
        <span
          v-if="fieldValue"
          class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}
        </span>
        <DialogClose />
      </DialogHeader>
      <div class="flex min-h-0 flex-1 p-4">
        <textarea
          :value="fieldValue"
          placeholder="Paste or type the text you want to fact-check..."
          class="h-full w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground leading-relaxed placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          @input="syncToBlock(($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
