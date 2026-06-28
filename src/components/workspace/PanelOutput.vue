<script setup lang="ts">
import type { Run } from '@/types/runs'
import { Check, CheckCircle, Copy, Loader2, Terminal, XCircle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'

const { run } = defineProps<{
  run: Run | null
}>()

const copied = ref(false)

const copyText = computed(() => (run ? [run.error, run.output].filter(Boolean).join('\n\n') : ''))

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

      <!-- Loading state -->
      <div v-else-if="run.status === 'running'" class="flex-1 flex flex-col items-center justify-center text-center">
        <Loader2 :size="32" :stroke-width="1.5" class="mb-3 animate-spin text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">
          Running pipeline...
        </p>
      </div>

      <!-- Result -->
      <template v-else>
        <!-- Error -->
        <div v-if="run.error" class="mb-3 whitespace-pre-wrap break-words rounded-md bg-red-500/10 px-3 py-2 font-mono text-xs text-red-500">
          {{ run.error }}
        </div>

        <!-- Output -->
        <pre
          v-if="run.output"
          class="flex-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground"
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
