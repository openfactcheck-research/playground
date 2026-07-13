<script setup lang="ts">
import type { Run, RunProgress, StageStatus } from '@/types/runs'
import { Check, CheckCircle, Copy, Loader2, Terminal, WrapText, X, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { highlight } from '@/lib/highlighter'

const { run, progress = null } = defineProps<{
  run: Run | null
  progress?: RunProgress | null
}>()

const copied = ref(false)
const highlightedOutput = ref('')

// Off by default: long lines scroll horizontally. The header button turns wrapping on.
const wrap = ref(false)

const copyText = computed(() => (run ? [run.error, run.output].filter(Boolean).join('\n\n') : ''))

// The output is JSON when it parses as an object or array (a fact-check result, say),
// which we syntax-highlight like the code panel; anything else stays plain text.
const isJson = computed(() => {
  const text = run?.output?.trim()
  if (!text || !(text.startsWith('{') || text.startsWith('[')))
    return false
  try {
    JSON.parse(text)
    return true
  }
  catch {
    return false
  }
})

watch(
  () => run?.output,
  async (output) => {
    highlightedOutput.value = output && isJson.value ? await highlight(output, 'json') : ''
  },
  { immediate: true },
)

// Circular step marker styling: filled green when done, outlined for the active and failed steps.
function stageMarkerClass(status: StageStatus): string {
  if (status === 'done')
    return 'border-transparent bg-green-500 text-white'
  if (status === 'failed')
    return 'border-red-500 bg-card text-red-500'
  return 'border-primary bg-card text-primary'
}

function copyOutput() {
  if (!copyText.value)
    return
  navigator.clipboard.writeText(copyText.value)
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
    <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
      <span class="text-xs font-medium text-muted-foreground">Output</span>
      <template v-if="run">
        <Loader2 v-if="run.status === 'running'" :size="12" class="animate-spin text-muted-foreground" />
        <CheckCircle v-else-if="run.status === 'completed'" :size="12" class="text-green-500" />
        <XCircle v-else-if="run.status === 'failed'" :size="12" class="text-red-500" />
      </template>

      <Tooltip v-if="run?.output">
        <TooltipTrigger as-child>
          <button
            class="ml-auto flex h-6 w-6 items-center justify-center rounded transition-colors"
            :class="wrap ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
            @click="wrap = !wrap"
          >
            <WrapText :size="14" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ wrap ? 'Wrapping on' : 'Wrap lines' }}
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Content (select-text + stop so the panel's mousedown guard does not block selection) -->
    <div class="flex-1 min-h-0 overflow-auto p-4 flex flex-col select-text" @mousedown.stop>
      <!-- Empty state -->
      <div v-if="!run" class="flex-1 flex flex-col items-center justify-center text-center">
        <Terminal :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          Click Run to execute your pipeline
        </p>
      </div>

      <!-- Loading state: a live stepper of pipeline stages, or a spinner before the first event -->
      <div v-else-if="run.status === 'running'" class="flex-1 flex flex-col min-h-0">
        <ol v-if="progress && progress.stages.length" class="relative flex flex-col">
          <li
            v-for="(stage, index) in progress.stages"
            :key="stage.role"
            class="relative flex items-center gap-3 pb-5 last:pb-0"
          >
            <!-- Rail connecting this marker to the next; turns green once the step is done. -->
            <span
              v-if="index < progress.stages.length - 1"
              class="absolute left-3 top-6 h-full w-px -translate-x-1/2"
              :class="stage.status === 'done' ? 'bg-green-500/40' : 'bg-border'"
            />
            <span
              class="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-card"
              :class="stageMarkerClass(stage.status)"
            >
              <Loader2 v-if="stage.status === 'running'" :size="12" class="animate-spin" />
              <Check v-else-if="stage.status === 'done'" :size="12" :stroke-width="3" />
              <X v-else :size="12" :stroke-width="3" />
            </span>
            <span
              class="text-sm"
              :class="stage.status === 'failed'
                ? 'font-medium text-red-600 dark:text-red-400'
                : stage.status === 'running' ? 'font-medium text-foreground' : 'text-foreground'"
            >
              {{ stage.label }}
            </span>
          </li>
        </ol>
        <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
          <Loader2 :size="32" :stroke-width="1.5" class="mb-3 animate-spin text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">
            Running pipeline...
          </p>
        </div>
      </div>

      <!-- Result -->
      <template v-else>
        <!-- Error -->
        <div v-if="run.error" class="mb-3 whitespace-pre-wrap break-words rounded-md bg-red-500/10 px-3 py-2 font-mono text-xs text-red-500">
          {{ run.error }}
        </div>

        <!-- Output: JSON is syntax-highlighted like the code panel, everything else is plain text -->
        <div
          v-if="run.output && isJson && highlightedOutput"
          class="shiki-wrapper flex-1 text-xs leading-normal"
          :class="{ 'no-wrap': !wrap }"
          v-html="highlightedOutput"
        />
        <pre
          v-else-if="run.output"
          class="flex-1 font-mono text-xs leading-relaxed text-foreground"
          :class="wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'"
        >{{ run.output }}</pre>

        <!-- No output -->
        <div v-else-if="!run.error" class="flex-1 flex flex-col items-center justify-center text-center">
          <p class="text-sm text-muted-foreground">
            Pipeline completed with no output
          </p>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <div v-if="copyText" class="shrink-0 border-t border-border px-3 py-2">
      <Button
        variant="secondary"
        size="sm"
        class="w-full"
        @click="copyOutput"
      >
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
        {{ copied ? 'Copied!' : 'Copy Output' }}
      </Button>
    </div>
  </div>
</template>

<style>
/* Unwrapped: let long lines extend so the panel scrolls horizontally, overriding the
   wrapping rule the code panel sets globally on `.shiki-wrapper`. */
.shiki-wrapper.no-wrap pre {
  white-space: pre;
  word-break: normal;
  overflow-x: visible;
}
</style>
