<script setup lang="ts">
import { ref, watch } from 'vue'
import VerdictBadge from './VerdictBadge.vue'

export type Evidence = {
  source: string
  summary: string
  supports: 'supports' | 'contradicts' | 'neutral'
}

export type ClaimCategory = 'supported' | 'conflicted' | 'controversial' | 'unverified'

export type Claim = {
  text: string
  verdict: 'true' | 'false' | 'partially-true' | 'unverified'
  category: ClaimCategory
  evidence: Evidence[]
  reasoning: string
}

export type FactCheckResults = {
  claims: Claim[]
  summary: string
  totalEvidences: number
  overallFactuality: boolean
  overallCredibility: number
}

const props = defineProps<{
  results: FactCheckResults | null
}>()

const sectionCollapsed = ref(true)
const expandedClaims = ref(new Set<number>())

// Auto-expand when new results arrive, collapse when cleared
watch(() => props.results, (newResults) => {
  if (newResults) {
    sectionCollapsed.value = false
    expandedClaims.value = new Set()
  }
  else {
    sectionCollapsed.value = true
    expandedClaims.value = new Set()
  }
})

function toggleClaim(index: number) {
  const next = new Set(expandedClaims.value)
  if (next.has(index)) {
    next.delete(index)
  }
  else {
    next.add(index)
  }
  expandedClaims.value = next
}

function categoryStyle(category: ClaimCategory): string {
  switch (category) {
    case 'supported': return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
    case 'conflicted': return 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
    case 'controversial': return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
    case 'unverified': return 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20'
  }
}

function categoryLabel(category: ClaimCategory): string {
  switch (category) {
    case 'supported': return 'Supported'
    case 'conflicted': return 'Conflicted'
    case 'controversial': return 'Controversial'
    case 'unverified': return 'Unverified'
  }
}

function evidenceDotColor(supports: Evidence['supports']): string {
  switch (supports) {
    case 'supports': return 'bg-emerald-400'
    case 'contradicts': return 'bg-red-400'
    case 'neutral': return 'bg-amber-400'
  }
}
</script>

<template>
  <section class="flex flex-col border-t border-border bg-card" :class="sectionCollapsed ? '' : 'flex-1 min-h-0'">
    <!-- Always-visible toggle header -->
    <button
      class="group flex w-full items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30"
      @click="sectionCollapsed = !sectionCollapsed"
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="shrink-0 text-primary"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span class="text-sm font-semibold text-foreground">Fact-Check Results</span>

      <!-- Stats pills when results exist -->
      <template v-if="results">
        <div class="flex items-center gap-2">
          <!-- Evidences -->
          <span class="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            {{ results.totalEvidences }} evidences
          </span>
          <!-- Factuality -->
          <span
            class="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="[
              results.overallFactuality
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400',
            ]"
          >
            <svg v-if="results.overallFactuality" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {{ results.overallFactuality ? 'Factual' : 'Not Factual' }}
          </span>
          <!-- Credibility -->
          <span
            class="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="[
              results.overallCredibility >= 70
                ? 'bg-emerald-500/15 text-emerald-400'
                : results.overallCredibility >= 40
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400',
            ]"
          >
            {{ results.overallCredibility }}% credible
          </span>
        </div>
      </template>
      <span
        v-else
        class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
      >
        No results
      </span>

      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="ml-auto shrink-0 text-muted-foreground transition-transform duration-200"
        :class="sectionCollapsed ? '' : 'rotate-180'"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Collapsible content -->
    <div
      v-show="!sectionCollapsed"
      class="flex-1 overflow-y-auto min-h-0"
    >
      <!-- Has results -->
      <template v-if="results">
        <!-- Claims list -->
        <div class="flex flex-col gap-3 border-t border-border p-4">
          <div
            v-for="(claim, index) in results.claims"
            :key="index"
            class="rounded-lg border border-border bg-background overflow-hidden"
          >
            <!-- Claim header (clickable to toggle) -->
            <button
              class="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/30"
              @click="toggleClaim(index)"
            >
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {{ index + 1 }}
                </span>
                <p class="text-sm font-medium leading-relaxed text-foreground truncate">
                  {{ claim.text }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" :class="[
                    categoryStyle(claim.category),
                  ]"
                >
                  {{ categoryLabel(claim.category) }}
                </span>
                <VerdictBadge :verdict="claim.verdict" />
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="text-muted-foreground transition-transform duration-200"
                  :class="expandedClaims.has(index) ? 'rotate-180' : ''"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            <!-- Collapsible detail -->
            <div
              v-show="expandedClaims.has(index)"
              class="border-t border-border px-4 pb-4"
            >
              <p class="mt-3 text-sm leading-relaxed text-foreground">
                {{ claim.text }}
              </p>

              <!-- Evidence -->
              <div class="mt-3">
                <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence
                </p>
                <ul class="flex flex-col gap-1.5">
                  <li
                    v-for="(ev, ei) in claim.evidence"
                    :key="ei"
                    class="flex items-start gap-2 text-xs leading-relaxed text-secondary-foreground"
                  >
                    <span class="mt-1 h-1 w-1 shrink-0 rounded-full" :class="evidenceDotColor(ev.supports)" />
                    <span>
                      <span class="font-medium text-foreground">{{ ev.source }}:</span> {{ ev.summary }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Reasoning -->
              <div class="mt-3 rounded-md bg-secondary/50 px-3 py-2">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Reasoning
                </p>
                <p class="text-xs leading-relaxed text-secondary-foreground">
                  {{ claim.reasoning }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Overall summary -->
        <div class="border-t border-border px-4 py-3">
          <div class="flex items-center gap-2 mb-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span class="text-xs font-semibold text-foreground">Summary</span>
          </div>
          <p class="text-xs leading-relaxed text-secondary-foreground">
            {{ results.summary }}
          </p>
        </div>
      </template>

      <!-- No results yet -->
      <div v-else class="flex items-center justify-center border-t border-border py-6 text-center">
        <p class="text-xs text-muted-foreground">
          Enter text above and click Run to fact-check
        </p>
      </div>
    </div>
  </section>
</template>
