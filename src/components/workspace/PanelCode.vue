<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import { Check, Code2, Copy } from 'lucide-vue-next'
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
        <Code2 :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
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
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>
  </div>
</template>
