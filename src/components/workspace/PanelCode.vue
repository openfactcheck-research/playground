<script setup lang="ts">
import { Check, Code2, Copy } from 'lucide-vue-next'
import { createHighlighter } from 'shiki'
import { computed, nextTick, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'

const { code, highlightCode } = defineProps<{
  code: string
  highlightCode?: string
}>()

const copied = ref(false)
const codeRef = ref<HTMLElement>()
const highlightedHtml = ref('')

let _highlighter: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  return _highlighter ??= createHighlighter({
    themes: ['vitesse-dark', 'vitesse-light'],
    langs: ['python'],
  })
}

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

async function highlight() {
  if (!code) {
    highlightedHtml.value = ''
    return
  }

  const highlighter = await getHighlighter()

  highlightedHtml.value = highlighter.codeToHtml(code, {
    lang: 'python',
    themes: {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    },
    defaultColor: false,
    transformers: [
      {
        line(node: any, line: number) {
          node.properties['data-line'] = line
        },
        postprocess(html: string) {
          return html.replace(/\n/g, '')
        },
      },
    ],
  })
}

function applyLineHighlight() {
  if (!codeRef.value)
    return
  const lines = codeRef.value.querySelectorAll('.line')
  const indices = highlightedLineIndices.value
  lines.forEach((el, i) => {
    el.classList.toggle('highlight-line', indices.has(i))
  })

  if (indices.size > 0)
    codeRef.value.querySelector('.highlight-line')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(() => code, highlight, { immediate: true })

watch([() => highlightCode, highlightedHtml], async () => {
  await nextTick()
  applyLineHighlight()
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
      <div
        v-if="code"
        ref="codeRef"
        class="shiki-wrapper flex-1 text-xs leading-normal"
        v-html="highlightedHtml"
      />
      <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
        <Code2 :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          Add blocks to see generated code
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="code" class="shrink-0 border-t border-border px-3 py-2">
      <Button
        variant="secondary"
        size="sm"
        class="w-full"
        @click="copyCode"
      >
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </Button>
    </div>
  </div>
</template>

<style>
/* Shiki dual-theme: dark mode (default) */
.shiki-wrapper .shiki,
.shiki-wrapper .shiki span {
  color: var(--shiki-dark);
}

/* Shiki dual-theme: light mode */
:root:not(.dark) .shiki-wrapper .shiki,
:root:not(.dark) .shiki-wrapper .shiki span {
  color: var(--shiki-light);
}

/* Code block reset */
.shiki-wrapper pre,
.shiki-wrapper pre code {
  margin: 0;
  background: transparent !important;
}

.shiki-wrapper pre,
.shiki-wrapper pre code,
.shiki-wrapper pre code span {
  font-family: 'Geist Mono', monospace !important;
}

.shiki-wrapper pre {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: hidden;
  min-height: 100%;
}

/* Line styling + highlight */
.shiki-wrapper code .line {
  display: block;
  margin-inline: -0.75rem;
  padding-inline: 0.75rem;
  padding-left: 2rem;
  position: relative;
}

.shiki-wrapper code .line::before {
  content: attr(data-line);
  position: absolute;
  left: 0;
  width: 1.25rem;
  text-align: right;
  color: color-mix(in srgb, currentColor 30%, transparent);
  pointer-events: none;
  user-select: none;
}

.shiki-wrapper code .highlight-line {
  background-color: rgb(251 191 36 / 0.15);
}
</style>
