<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import { computed, nextTick, ref, watch } from 'vue'
import 'highlight.js/styles/github-dark.css'

const { code, highlightCode } = defineProps<{
  code: string
  highlightCode?: string
}>()

hljs.registerLanguage('python', python)

const copied = ref(false)
const codeRef = ref<HTMLElement>()

const highlightedLines = computed(() => {
  if (!code)
    return []
  try {
    const html = hljs.highlight(code, { language: 'python' }).value
    const lines = html.split('\n')
    if (lines[lines.length - 1] === '')
      lines.pop()
    return lines
  }
  catch {
    return code.split('\n')
  }
})

const highlightedLineIndices = computed((): Set<number> => {
  if (!highlightCode || !code)
    return new Set()
  const trimmed = highlightCode.trim()
  const startIndex = code.indexOf(trimmed)
  if (startIndex === -1)
    return new Set()
  const startLine = code.substring(0, startIndex).split('\n').length - 1
  const lineCount = trimmed.split('\n').length
  const result = new Set<number>()
  for (let i = startLine; i < startLine + lineCount; i++)
    result.add(i)
  return result
})

watch(() => highlightCode, async () => {
  if (!highlightCode)
    return
  await nextTick()
  codeRef.value?.querySelector('.highlight-line')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

function copyCode() {
  navigator.clipboard.writeText(code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div
    class="pointer-events-auto w-[33vw] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    @pointerdown.stop
    @mousedown.prevent
  >
    <!-- Header -->
    <div class="flex h-10 shrink-0 items-center border-b border-border px-3">
      <span class="text-xs font-medium text-muted-foreground">Generated Code</span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0 overflow-auto p-4 flex flex-col">
      <pre v-if="code" ref="codeRef" class="font-mono text-xs leading-relaxed m-0"><code class="block"><span
        v-for="(line, i) in highlightedLines"
        :key="i"
        class="block -mx-4 px-4"
        :class="highlightedLineIndices.has(i) ? 'highlight-line bg-amber-400/15' : ''"
        v-html="line || '&#8203;'"
      /></code></pre>
      <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 text-muted-foreground/30">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <p class="text-sm text-muted-foreground">
          Add blocks to see generated code
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="code" class="shrink-0 border-t border-border px-3 py-2">
      <button
        class="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-secondary text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        @click="copyCode"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="copied">
            <polyline points="20 6 9 17 4 12" />
          </template>
          <template v-else>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </template>
        </svg>
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>
  </div>
</template>
