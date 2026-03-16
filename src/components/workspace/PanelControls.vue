<script setup lang="ts">
import type { SelectedBlockInfo } from './BlocklyWorkspace.vue'
import { Lock, Puzzle, Snowflake } from 'lucide-vue-next'

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
      <Puzzle :size="14" class="shrink-0 text-muted-foreground" />
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
        <Puzzle :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
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
          <Snowflake :size="13" />
          Unfreeze Block
        </template>
        <!-- Lock icon when active -->
        <template v-else>
          <Lock :size="13" />
          Freeze Block
        </template>
      </button>
    </div>
  </div>
</template>
