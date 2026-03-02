<script setup lang="ts">
import type { SelectedBlockInfo } from './BlocklyWorkspace.vue'

const { selectedBlock } = defineProps<{
  selectedBlock: SelectedBlockInfo | null
}>()

const emit = defineEmits<{
  freeze: []
}>()

function formatBlockType(type: string): string {
  return type
    .replace(/_block$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground">
        <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69a.979.979 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.447-.166-.856-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61h.001a2.402 2.402 0 0 1 1.704-.707 2.402 2.402 0 0 1 1.704.707l1.568 1.567c.23.23.556.338.877.29c.493-.074.84-.504 1.02-.968a2.5 2.5 0 0 1 4.474 2.202Z" />
      </svg>
      <span class="text-xs font-medium text-muted-foreground">Block Controls</span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0 overflow-auto p-4 flex flex-col">
      <div v-if="selectedBlock">
        <p class="mb-0.5 text-[11px] text-muted-foreground/70">
          Block Type
        </p>
        <p class="text-sm font-medium text-foreground">
          {{ formatBlockType(selectedBlock.blockType) }}
        </p>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 text-muted-foreground/30">
          <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69a.979.979 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.447-.166-.856-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61h.001a2.402 2.402 0 0 1 1.704-.707 2.402 2.402 0 0 1 1.704.707l1.568 1.567c.23.23.556.338.877.29c.493-.074.84-.504 1.02-.968a2.5 2.5 0 0 1 4.474 2.202Z" />
        </svg>
        <p class="text-sm text-muted-foreground">
          Select a block to see controls
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="selectedBlock" class="shrink-0 border-t border-border px-3 py-2">
      <button
        class="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-secondary text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        :class="selectedBlock.frozen ? 'text-blue-400' : ''"
        @click="emit('freeze')"
      >
        <!-- Snowflake icon when frozen -->
        <template v-if="selectedBlock.frozen">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="2" x2="22" y1="12" y2="12" />
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="m20 16-4-4 4-4" />
            <path d="m4 8 4 4-4 4" />
            <path d="m16 4-4 4-4-4" />
            <path d="m8 20 4-4 4 4" />
          </svg>
          Unfreeze Block
        </template>
        <!-- Lock icon when active -->
        <template v-else>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Freeze Block
        </template>
      </button>
    </div>
  </div>
</template>
