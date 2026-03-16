<script setup lang="ts">
import { ChevronDown, Lock, Trash2, Unlock } from 'lucide-vue-next'
import { ref } from 'vue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const { zoomPercent, locked, trashHasContents } = defineProps<{
  zoomPercent: number
  locked: boolean
  trashHasContents?: boolean
}>()

const emit = defineEmits<{
  toggleLock: []
  zoomIn: []
  zoomOut: []
  zoomReset: []
  zoomToFit: []
  openTrash: []
}>()

type ZoomItem = { label: string, action: () => void } | { separator: true }

const zoomActions: ZoomItem[] = [
  { label: 'Zoom In', action: () => emit('zoomIn') },
  { label: 'Zoom Out', action: () => emit('zoomOut') },
  { separator: true },
  { label: 'Zoom to 100%', action: () => emit('zoomReset') },
  { label: 'Zoom to Fit', action: () => emit('zoomToFit') },
]

const dropdownOpen = ref(false)

function runZoomAction(fn: () => void) {
  dropdownOpen.value = false
  fn()
}

const dropdownItemClass = 'flex w-full items-center px-3 py-2 text-xs text-foreground transition-colors hover:bg-secondary'
</script>

<template>
  <div class="absolute bottom-6 right-6 z-10 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg" @pointerdown.stop @mousedown.prevent>
    <!-- Lock/Unlock button -->
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          :class="locked ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
          @click="emit('toggleLock')"
        >
          <Lock v-if="locked" :size="16" />
          <Unlock v-else :size="16" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {{ locked ? 'Unlock workspace' : 'Lock workspace' }}
      </TooltipContent>
    </Tooltip>

    <div class="h-5 w-px bg-border" />

    <!-- Zoom control -->
    <div class="relative">
      <button
        class="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        @click="dropdownOpen = !dropdownOpen"
      >
        <span class="w-8 text-right tabular-nums">{{ Math.round(zoomPercent * 100) }}%</span>
        <ChevronDown :size="12" class="shrink-0 transition-transform duration-150" :class="dropdownOpen ? 'rotate-180' : ''" />
      </button>

      <div
        v-if="dropdownOpen"
        class="absolute bottom-full right-0 mb-1 min-w-[160px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        @click.stop
      >
        <template v-for="(item, i) in zoomActions" :key="i">
          <div v-if="'separator' in item" class="my-1 h-px bg-border" />
          <button v-else :class="dropdownItemClass" @click="runZoomAction(item.action)">
            {{ item.label }}
          </button>
        </template>
      </div>
    </div>

    <div class="h-5 w-px bg-border" />

    <!-- Trash -->
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          @click="emit('openTrash')"
        >
          <Trash2 :size="16" />
          <span
            v-if="trashHasContents"
            class="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Deleted blocks
      </TooltipContent>
    </Tooltip>
  </div>

  <!-- Click-outside overlay -->
  <div
    v-if="dropdownOpen"
    class="fixed inset-0 z-[9]"
    @click="dropdownOpen = false"
  />
</template>
