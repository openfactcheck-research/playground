<script setup lang="ts">
import type * as Blockly from 'blockly/core'
import { createHighlighter } from 'shiki'
import { reactive, watch } from 'vue'

const props = defineProps<{
  block: Blockly.Block
}>()

// The template's two message bodies, each its own editor.
const SECTIONS = [
  { field: 'SYSTEM_TEXT', label: 'System', placeholder: 'Optional system prompt; may use {{variables}}.' },
  { field: 'USER_TEXT', label: 'User', placeholder: 'User prompt. Use {{variable}} for run-time values.' },
] as const

// ---------------------------------------------------------------------------
// Reactive binding to the Blockly field values.
// ---------------------------------------------------------------------------

const values = reactive<Record<string, string>>({})
const highlighted = reactive<Record<string, string>>({})

watch(() => props.block, (blk) => {
  for (const { field } of SECTIONS) {
    values[field] = blk.getFieldValue(field) ?? ''
    void highlight(field)
  }
}, { immediate: true })

function syncToBlock(field: string, value: string) {
  values[field] = value
  props.block.setFieldValue(value, field)
  void highlight(field)
}

function charCount(field: string): number {
  return (values[field] ?? '').length
}

// ---------------------------------------------------------------------------
// Shiki highlighter (markdown, dual theme, line numbers).
// ---------------------------------------------------------------------------

let _highlighter: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  return _highlighter ??= createHighlighter({
    themes: ['vitesse-dark', 'vitesse-light'],
    langs: ['markdown'],
  })
}

async function highlight(field: string) {
  // Use a zero-width space for empty content so Shiki produces at least one
  // line (keeps line numbers visible).
  const source = values[field] || '​'

  const highlighter = await getHighlighter()
  // Strip newlines from the HTML output: Shiki puts \n between <span class="line"> elements
  // inside <pre>. With white-space: pre-wrap + display:block on .line, those \n text nodes
  // render as blank visual rows, shifting every line down by one row vs the textarea.
  highlighted[field] = highlighter.codeToHtml(source, {
    lang: 'markdown',
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
          return html
            .replace(/\n/g, '')
            .replace(/\{\{([^}]*)\}\}/g, '<span class="prompt-var">{{$1}}</span>')
        },
      },
    ],
  })
}

// ---------------------------------------------------------------------------
// Sync scroll between each textarea and its backdrop (the preceding sibling).
// ---------------------------------------------------------------------------

function syncScroll(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  const backdrop = textarea.previousElementSibling as HTMLElement | null
  if (backdrop) {
    backdrop.scrollTop = textarea.scrollTop
    backdrop.scrollLeft = textarea.scrollLeft
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 min-h-0">
    <div v-for="section in SECTIONS" :key="section.field" class="flex flex-1 flex-col gap-2 min-h-0">
      <!-- Section header -->
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-medium text-foreground">{{ section.label }}</span>
        <span
          v-if="values[section.field]"
          class="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
        >
          {{ charCount(section.field) }} char{{ charCount(section.field) !== 1 ? 's' : '' }}
        </span>
        <span
          v-else
          class="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          Empty
        </span>
      </div>

      <!-- Editor: textarea overlay on Shiki backdrop -->
      <div class="prompt-editor relative flex-1 min-h-0 overflow-hidden rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <!-- Shiki highlighted backdrop -->
        <div
          class="prompt-backdrop absolute inset-0 overflow-hidden pointer-events-none"
          v-html="highlighted[section.field]"
        />

        <!-- Transparent textarea on top -->
        <textarea
          :value="values[section.field]"
          :placeholder="section.placeholder"
          class="prompt-textarea absolute inset-0 w-full h-full resize-none bg-transparent p-0 text-transparent caret-foreground outline-none placeholder:text-muted-foreground"
          spellcheck="false"
          @input="syncToBlock(section.field, ($event.target as HTMLTextAreaElement).value)"
          @scroll="syncScroll"
        />
      </div>
    </div>
  </div>
</template>

<style>
/* ---- Shared font / sizing ---- */
.prompt-editor .prompt-textarea,
.prompt-editor .prompt-backdrop pre,
.prompt-editor .prompt-backdrop pre code,
.prompt-editor .prompt-backdrop pre code .line,
.prompt-editor .prompt-backdrop pre code .line span {
  font-family: 'Geist Mono', monospace !important;
  font-size: 12px;
  line-height: 19.5px;
  letter-spacing: 0;
  word-spacing: 0;
  tab-size: 4;
}

/* ---- Textarea — the source of truth for layout ---- */
.prompt-editor .prompt-textarea {
  padding: 8px 12px 8px 40px;
  white-space: pre-wrap;
  word-break: break-all;
  border: none;
  scrollbar-width: none; /* Firefox — hide scrollbar so content width matches backdrop */
}

.prompt-editor .prompt-textarea::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* ---- Shiki backdrop — matches textarea pixel-for-pixel ---- */
.prompt-editor .prompt-backdrop pre {
  margin: 0;
  background: transparent !important;
  padding: 8px 12px 8px 40px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: hidden;
  min-height: 100%;
  box-sizing: border-box;
}

.prompt-editor .prompt-backdrop pre code {
  margin: 0;
  padding: 0;
  background: transparent !important;
}

/* ---- Line styling with line numbers ---- */
.prompt-editor .prompt-backdrop code .line {
  display: block;
  position: relative;
  min-height: 19.5px; /* prevent empty lines from collapsing */
}

.prompt-editor .prompt-backdrop code .line::before {
  content: attr(data-line);
  position: absolute;
  left: -32px;
  width: 20px;
  text-align: right;
  color: color-mix(in srgb, currentColor 30%, transparent);
  pointer-events: none;
  user-select: none;
}

/* ---- Dual-theme colors ---- */
.prompt-editor .shiki,
.prompt-editor .shiki span {
  color: var(--shiki-dark);
}

:root:not(.dark) .prompt-editor .shiki,
:root:not(.dark) .prompt-editor .shiki span {
  color: var(--shiki-light);
}

/* ---- Template variable highlighting: {{variable}} ---- */
.prompt-editor .prompt-var {
  color: #e8a252 !important;
  background-color: rgba(232, 162, 82, 0.12);
  border-radius: 3px;
  padding: 0 1px;
}

:root:not(.dark) .prompt-editor .prompt-var {
  color: #b8721a !important;
  background-color: rgba(184, 114, 26, 0.1);
}
</style>
