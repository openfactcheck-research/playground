<script setup lang="ts">
import type { Role } from '@/blockly/blocks/promptTemplate'
import * as Blockly from 'blockly/core'
import { createHighlighter } from 'shiki'
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { templateRows } from '@/blockly/blocks/promptTemplate'

const props = defineProps<{
  block: Blockly.Block
}>()

const LABEL: Record<Role, string> = { system: 'System', user: 'User', assistant: 'Assistant' }
const PLACEHOLDER: Record<Role, string> = {
  system: 'Optional system prompt; may use {{variables}}.',
  user: 'User prompt. Use {{variable}} for run-time values.',
  assistant: 'Assistant message; may use {{variables}}.',
}

type Row = { id: string, role: Role, field: string }

const rows = ref<Row[]>([])
const values = reactive<Record<string, string>>({})
const highlighted = reactive<Record<string, string>>({})

// ---------------------------------------------------------------------------
// Shiki highlighter (markdown, dual theme, line numbers). Defined before the
// watcher below so the immediate mount-time highlight call can reach it.
// ---------------------------------------------------------------------------

let _highlighter: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  return _highlighter ??= createHighlighter({
    themes: ['vitesse-dark', 'vitesse-light'],
    langs: ['markdown'],
  })
}

async function highlight(field: string): Promise<void> {
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
// Reactive binding to the block's message rows and their field values.
// ---------------------------------------------------------------------------

function refresh(): void {
  rows.value = templateRows(props.block)
  for (const { field } of rows.value) {
    values[field] = props.block.getFieldValue(field) ?? ''
    void highlight(field)
  }
}

function syncToBlock(field: string, value: string): void {
  values[field] = value
  props.block.setFieldValue(value, field)
  void highlight(field)
}

function charCount(field: string): number {
  return (values[field] ?? '').length
}

// Sync scroll between each textarea and its backdrop (the preceding sibling).
function syncScroll(event: Event): void {
  const textarea = event.target as HTMLTextAreaElement
  const backdrop = textarea.previousElementSibling as HTMLElement | null
  if (backdrop) {
    backdrop.scrollTop = textarea.scrollTop
    backdrop.scrollLeft = textarea.scrollLeft
  }
}

// Keep the panel in step with mutator changes (rows added, removed, reordered)
// and with edits made directly on the block.
function onWorkspaceChange(event: Blockly.Events.Abstract): void {
  if (event.type !== Blockly.Events.BLOCK_CHANGE)
    return
  const change = event as Blockly.Events.BlockChange
  if (change.blockId !== props.block.id)
    return
  if (change.element === 'mutation') {
    refresh()
  }
  else if (change.element === 'field' && typeof change.name === 'string' && change.name.startsWith('TEXT_')) {
    values[change.name] = props.block.getFieldValue(change.name) ?? ''
    void highlight(change.name)
  }
}

let listeningTo: Blockly.Workspace | null = null

watch(() => props.block, (blk) => {
  if (listeningTo)
    listeningTo.removeChangeListener(onWorkspaceChange)
  listeningTo = blk.workspace
  listeningTo.addChangeListener(onWorkspaceChange)
  refresh()
}, { immediate: true })

onBeforeUnmount(() => {
  if (listeningTo)
    listeningTo.removeChangeListener(onWorkspaceChange)
})
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <!-- Scrolls when the template has more turns than fit. -->
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto min-h-0 pr-1">
      <div v-for="row in rows" :key="row.id" class="flex shrink-0 flex-col gap-2">
        <!-- Section header -->
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-medium text-foreground">{{ LABEL[row.role] }}</span>
          <span
            v-if="values[row.field]"
            class="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
          >
            {{ charCount(row.field) }} char{{ charCount(row.field) !== 1 ? 's' : '' }}
          </span>
          <span
            v-else
            class="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            Empty
          </span>
        </div>

        <!-- Editor: fixed-height textarea overlay on Shiki backdrop -->
        <div class="prompt-editor relative h-40 shrink-0 overflow-hidden rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <!-- Shiki highlighted backdrop -->
          <div
            class="prompt-backdrop absolute inset-0 overflow-hidden pointer-events-none"
            v-html="highlighted[row.field]"
          />

          <!-- Transparent textarea on top -->
          <textarea
            :value="values[row.field]"
            :placeholder="PLACEHOLDER[row.role]"
            class="prompt-textarea absolute inset-0 w-full h-full resize-none bg-transparent p-0 text-transparent caret-foreground outline-none placeholder:text-muted-foreground"
            spellcheck="false"
            @input="syncToBlock(row.field, ($event.target as HTMLTextAreaElement).value)"
            @scroll="syncScroll"
          />
        </div>
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
