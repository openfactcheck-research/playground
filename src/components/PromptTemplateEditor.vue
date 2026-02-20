<script setup lang="ts">
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { Decoration, EditorView, MatchDecorator, placeholder, ViewPlugin } from '@codemirror/view'
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark'
import { vsCodeLight } from '@fsegurai/codemirror-theme-vscode-light'
import { minimalSetup } from 'codemirror'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
// Custom highlighter for {{variable}} placeholders
const variableMatcher = new MatchDecorator({
  regexp: /\{\{\w+\}\}/g,
  decoration: Decoration.mark({ class: 'cm-variable-placeholder' }),
})

const variableHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = variableMatcher.createDeco(view)
    }

    update(update: ViewUpdate) {
      this.decorations = variableMatcher.updateDeco(update, this.decorations)
    }
  },
  { decorations: v => v.decorations },
)

const editorRef = ref<HTMLDivElement | null>(null)
let editorView: EditorView | null = null

onMounted(() => {
  if (!editorRef.value)
    return

  // Check if dark mode at mount time
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    || document.documentElement.classList.contains('dark')

  const extensions = [
    minimalSetup,
    markdown(),
    variableHighlighter,
    placeholder('Enter your prompt template...\n\nUse {{variable}} syntax for placeholders.\nVariables will be automatically detected and shown as inputs on the block.'),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit('update:modelValue', update.state.doc.toString())
      }
    }),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '12px',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-variable-placeholder': {
        backgroundColor: '#005355',
        color: '#ffffff',
        borderRadius: '3px',
        padding: '1px 4px',
        fontWeight: '500',
      },
    }),
    isDark ? vsCodeDark : vsCodeLight,
  ]

  editorView = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions,
    }),
    parent: editorRef.value,
  })
})

onUnmounted(() => {
  editorView?.destroy()
})

// Sync external changes
watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue,
      },
    })
  }
})
</script>

<template>
  <div
    ref="editorRef"
    class="h-full min-h-[300px] overflow-hidden rounded-md border border-input"
  />
</template>

<style>
/* CodeMirror light mode adjustments */
.cm-editor {
  background: var(--background);
}

.cm-editor .cm-gutters {
  background: var(--muted);
  border-right: 1px solid var(--border);
}

.cm-editor .cm-activeLineGutter {
  background: var(--accent);
}

.cm-editor .cm-activeLine {
  background: var(--accent);
}

.cm-editor .cm-cursor {
  border-left-color: var(--foreground);
}

.cm-editor .cm-selectionBackground {
  background: var(--primary) !important;
  opacity: 0.2;
}

.cm-editor.cm-focused {
  outline: 2px solid var(--ring);
  outline-offset: -1px;
}

/* Variable placeholder highlighting */
.cm-variable-placeholder {
  background-color: #005355;
  color: #ffffff;
  border-radius: 3px;
  padding: 1px 4px;
  font-weight: 500;
}

:root.dark .cm-variable-placeholder,
.dark .cm-variable-placeholder {
  background-color: #006668;
  color: #ffffff;
}
</style>
