<script setup lang="ts">
import type { FactCheckResult, VerdictLabel } from '@/types/result'
import type { Run } from '@/types/runs'
import { CheckCircle, ClipboardCheck, Loader2, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'
import { parseResult } from '@/types/result'

const { run } = defineProps<{
  run: Run | null
}>()

const result = computed<FactCheckResult | null>(() => (run?.output ? parseResult(run.output) : null))

// Per-label display: a readable name and the colour it reads in.
const LABEL_META: Record<VerdictLabel, { text: string, dot: string, chip: string }> = {
  supported: { text: 'Supported', dot: 'bg-green-500', chip: 'text-green-600 bg-green-500/10 dark:text-green-400' },
  refuted: { text: 'Refuted', dot: 'bg-red-500', chip: 'text-red-600 bg-red-500/10 dark:text-red-400' },
  not_enough_evidence: { text: 'Not enough evidence', dot: 'bg-amber-500', chip: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
}

// The overall factuality read, derived from the summary.
const factual = computed(() => {
  const summary = result.value?.summary
  if (!summary)
    return null
  if (summary.factual === true)
    return { text: 'Factual', chip: 'text-green-600 bg-green-500/10 dark:text-green-400' }
  if (summary.factual === false)
    return { text: 'Not factual', chip: 'text-red-600 bg-red-500/10 dark:text-red-400' }
  return { text: 'Inconclusive', chip: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' }
})
</script>

<template>
  <div
    class="pointer-events-auto w-[33vw] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    @pointerdown.stop
    @mousedown.prevent
  >
    <!-- Header -->
    <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
      <span class="text-xs font-medium text-muted-foreground">Results</span>
      <template v-if="run">
        <Loader2 v-if="run.status === 'running'" :size="12" class="animate-spin text-muted-foreground" />
        <span v-else-if="factual" class="rounded-full px-2 py-0.5 text-[10px] font-medium" :class="factual.chip">
          {{ factual.text }}
        </span>
      </template>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0 overflow-auto p-4 flex flex-col select-text" @mousedown.stop>
      <!-- Empty state -->
      <div v-if="!run" class="flex-1 flex flex-col items-center justify-center text-center">
        <ClipboardCheck :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          Run a fact-checking pipeline to see results
        </p>
      </div>

      <!-- Loading -->
      <div v-else-if="run.status === 'running'" class="flex-1 flex flex-col items-center justify-center text-center">
        <Loader2 :size="32" :stroke-width="1.5" class="mb-3 animate-spin text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">
          Running pipeline...
        </p>
      </div>

      <!-- Not a fact-check result -->
      <div v-else-if="!result" class="flex-1 flex flex-col items-center justify-center text-center">
        <ClipboardCheck :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          This run produced no fact-checking result
        </p>
      </div>

      <!-- Result -->
      <template v-else>
        <!-- Summary counts -->
        <div class="mb-4 flex flex-wrap gap-3 text-xs">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-green-500" />
            {{ result.summary.supported }} supported
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-red-500" />
            {{ result.summary.refuted }} refuted
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-500" />
            {{ result.summary.not_enough_evidence }} unclear
          </span>
        </div>

        <!-- Revised passage (pipelines that revise, such as RARR) -->
        <div v-if="result.revision" class="mb-4 rounded-md border border-border bg-secondary/40 p-3">
          <div class="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Revised
          </div>
          <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
            {{ result.revision }}
          </p>
        </div>

        <!-- Per-claim verdicts -->
        <ul class="flex flex-col gap-3">
          <li
            v-for="(verdict, index) in result.verdicts"
            :key="index"
            class="rounded-md border border-border p-3"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="flex-1 text-xs font-medium leading-relaxed text-foreground">
                {{ verdict.claim.text }}
              </p>
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="LABEL_META[verdict.label].chip"
              >
                <CheckCircle v-if="verdict.label === 'supported'" :size="10" />
                <XCircle v-else-if="verdict.label === 'refuted'" :size="10" />
                {{ LABEL_META[verdict.label].text }}
              </span>
            </div>

            <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
              {{ verdict.reasoning }}
            </p>

            <p v-if="verdict.correction" class="mt-2 text-xs leading-relaxed text-green-600 dark:text-green-400">
              Correction: {{ verdict.correction }}
            </p>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
