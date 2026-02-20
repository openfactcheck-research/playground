<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const collapsed = ref(false)
const sampleIndex = ref(0)
const showUrlInput = ref(false)
const showExpandDialog = ref(false)
const urlInput = ref('')
const urlInputEl = ref<HTMLInputElement | null>(null)
const isFetching = ref(false)
const fetchError = ref('')
const fetchSuccess = ref(false)

const samples = [
  'Elon Musk bought Twitter in 2020 and renamed it to X.',
  'Burj Khalifa is the tallest building in the world and is located in Abu Dhabi. I took a photo in front of it.',
  '\u0628\u0631\u062C \u062E\u0644\u06CC\u0641\u06C1 \u062F\u0646\u06CC\u0627 \u06A9\u06CC \u0628\u0644\u0646\u062F \u062A\u0631\u06CC\u0646 \u0639\u0645\u0627\u0631\u062A \u06C1\u06D2 \u0627\u0648\u0631 \u0627\u0628\u0648\u0638\u0628\u06CC \u0645\u06CC\u06BA \u0648\u0627\u0642\u0639 \u06C1\u06D2\u06D4 \u0645\u06CC\u06BA \u0646\u06D2 \u0627\u0633 \u06A9\u06D2 \u0633\u0627\u0645\u0646\u06D2 \u062A\u0635\u0648\u06CC\u0631 \u06A9\u06BE\u06CC\u0646\u0686\u06CC\u06D4',
  '\u0628\u0631\u062C \u062E\u0644\u064A\u0641\u0629 \u0647\u0648 \u0623\u0637\u0648\u0644 \u0645\u0628\u0646\u0649 \u0641\u064A \u0627\u0644\u0639\u0627\u0644\u0645 \u0648\u064A\u0642\u0639 \u0641\u064A \u0623\u0628\u0648\u0638\u0628\u064A. \u0627\u0644\u062A\u0642\u0637\u062A \u0635\u0648\u0631\u0629 \u0623\u0645\u0627\u0645\u0647.',
  '\u4E2D\u56FD\u7684\u957F\u57CE\u662F\u8054\u5408\u56FD\u6559\u79D1\u6587\u7EC4\u7EC7\u7684\u4E16\u754C\u9057\u4EA7\uFF0C\u636E\u8BF4\u53EA\u7528\u4E86\u4E00\u5E74\u5EFA\u6210\u3002',
  'Il Colosseo \u00E8 il pi\u00F9 grande anfiteatro mai costruito, originariamente chiamato Anfiteatro Flavio e si trova a Firenze, in Italia. Ho scattato una foto davanti ad esso.',
]

function cycleSample() {
  const sample = samples[sampleIndex.value]
  if (sample) {
    emit('update:modelValue', sample)
  }
  sampleIndex.value = (sampleIndex.value + 1) % samples.length
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => {
    emit('update:modelValue', reader.result as string)
  }
  reader.readAsText(file)
  input.value = ''
}

async function openUrlInput() {
  showUrlInput.value = true
  fetchError.value = ''
  fetchSuccess.value = false
  await nextTick()
  urlInputEl.value?.focus()
}

async function fetchUrl() {
  const url = urlInput.value.trim()
  if (!url)
    return

  fetchError.value = ''
  fetchSuccess.value = false
  isFetching.value = true

  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    if (!res.ok)
      throw new Error(`Failed to fetch (${res.status})`)
    const html = await res.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc.querySelectorAll('script, style, nav, footer, header, aside, noscript').forEach(el => el.remove())
    const text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()

    if (!text)
      throw new Error('Could not extract text from this URL.')

    emit('update:modelValue', text)
    fetchSuccess.value = true
  }
  catch (e: any) {
    fetchError.value = e.message || 'Failed to fetch content from URL.'
  }
  finally {
    isFetching.value = false
  }
}

const wordCount = computed(() => {
  const trimmed = props.modelValue.trim()
  if (!trimmed)
    return 0
  return trimmed.split(/\s+/).length
})
</script>

<template>
  <section class="flex flex-col border-b border-border bg-card">
    <!-- Header bar with title and action buttons -->
    <div class="flex shrink-0 items-center border-border">
      <!-- Left: toggle button with icon, title, and word count -->
      <button
        class="group flex flex-1 items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30"
        @click="collapsed = !collapsed"
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="shrink-0 text-primary"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        <span class="text-sm font-semibold text-foreground">Input Text</span>
        <span
          v-if="modelValue"
          class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}
        </span>
        <span
          v-else
          class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          Empty
        </span>
      </button>

      <!-- Right: action buttons -->
      <span class="text-[10px] text-muted-foreground/60">{{ sampleIndex + 1 }}/{{ samples.length }}</span>
      <!-- Try sample button -->
      <button
        class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Load a sample claim"
        aria-label="Try a sample"
        @click.stop="cycleSample"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <span>Sample</span>
      </button>
      <!-- Upload button -->
      <label
        class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Upload a text file"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Upload</span>
        <input
          type="file"
          accept=".txt,.text,text/plain"
          class="sr-only"
          @change="handleFileUpload"
        >
      </label>
      <!-- URL button -->
      <button
        class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Fetch content from URL"
        aria-label="From URL"
        @click.stop="openUrlInput"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>URL</span>
      </button>
      <!-- Expand in dialog button -->
      <button
        class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Expand in dialog"
        aria-label="Expand in dialog"
        @click.stop="showExpandDialog = true"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <span>Expand</span>
      </button>
      <!-- Collapse/expand button -->
      <button
        class="flex shrink-0 items-center justify-center px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/30"
        @click="collapsed = !collapsed"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="transition-transform duration-200"
          :class="collapsed ? '' : 'rotate-180'"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- Collapsible content -->
    <div v-show="!collapsed" class="border-t border-border px-5 py-2">
      <!-- URL input row (shown when active) -->
      <div v-if="showUrlInput" class="flex items-center gap-2 pb-2">
        <div class="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-1 focus-within:border-primary/50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <input
            ref="urlInputEl"
            v-model="urlInput"
            type="url"
            placeholder="https://example.com/article"
            class="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
            @keydown.enter="fetchUrl"
          >
          <button
            v-if="urlInput.trim()"
            class="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            @click="urlInput = ''; showUrlInput = false"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <button
          :disabled="!urlInput.trim() || isFetching"
          class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          :class="[
            urlInput.trim() && !isFetching
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-muted-foreground cursor-not-allowed',
          ]" @click="fetchUrl"
        >
          <svg
            v-if="isFetching"
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ isFetching ? 'Fetching...' : 'Fetch' }}
        </button>
        <button
          class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          aria-label="Close URL input"
          @click="showUrlInput = false; urlInput = ''; fetchError = ''; fetchSuccess = false"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p v-if="fetchError" class="pb-2 text-[11px] text-red-400">
        {{ fetchError }}
      </p>
      <p v-else-if="fetchSuccess" class="pb-2 text-[11px] text-emerald-400">
        Content fetched and loaded.
      </p>

      <textarea
        :value="modelValue"
        placeholder="Paste or type the text you want to fact-check..."
        class="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-sans leading-relaxed"
        rows="3"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </section>

  <!-- Expand Dialog -->
  <DialogRoot v-model:open="showExpandDialog">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 flex h-[95vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div class="flex items-center gap-3">
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-primary"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <DialogTitle class="text-base font-semibold text-foreground">
              Input Text
            </DialogTitle>
            <span
              v-if="modelValue"
              class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}
            </span>
          </div>
          <DialogClose
            class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogClose>
        </div>

        <!-- Content -->
        <div class="flex min-h-0 flex-1 p-6">
          <textarea
            :value="modelValue"
            placeholder="Paste or type the text you want to fact-check..."
            class="h-full w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 font-sans leading-relaxed"
            @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
