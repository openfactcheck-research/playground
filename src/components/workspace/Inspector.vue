<script setup lang="ts">
import type { SelectedBlockInfo } from './BlocklyWorkspace.vue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import PanelCode from './PanelCode.vue'
import PanelControls from './PanelControls.vue'

export type InspectorPanel = 'controls' | 'code'

defineProps<{
  code: string
  selectedBlock: SelectedBlockInfo | null
  highlightCode?: string
}>()

const emit = defineEmits<{
  freeze: []
}>()

const activePanel = defineModel<InspectorPanel | null>('activePanel', { default: null })

function togglePanel(panel: InspectorPanel) {
  activePanel.value = activePanel.value === panel ? null : panel
}
</script>

<template>
  <!-- aside spans full workspace height so panels can anchor to it -->
  <aside class="pointer-events-none absolute right-6 inset-y-0 z-20" data-no-deselect>
    <!-- Icon strip: vertically centered -->
    <div
      class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg"
      @pointerdown.stop
      @mousedown.stop.prevent
    >
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            :class="activePanel === 'controls' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
            @click="togglePanel('controls')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69a.979.979 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.447-.166-.856-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61h.001a2.402 2.402 0 0 1 1.704-.707 2.402 2.402 0 0 1 1.704.707l1.568 1.567c.23.23.556.338.877.29c.493-.074.84-.504 1.02-.968a2.5 2.5 0 0 1 4.474 2.202Z" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          Block Controls
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            :class="activePanel === 'code' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
            @click="togglePanel('code')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          Generated Code
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Panels: full workspace height, left of icon strip -->
    <Transition name="panel">
      <PanelControls
        v-if="activePanel === 'controls'"
        class="absolute right-14 top-16 bottom-20"
        :selected-block="selectedBlock"
        @freeze="emit('freeze')"
      />
    </Transition>
    <Transition name="panel">
      <PanelCode
        v-if="activePanel === 'code'"
        class="absolute right-14 top-16 bottom-20"
        :code="code"
        :highlight-code="highlightCode"
      />
    </Transition>
  </aside>
</template>

<style scoped>
.panel-enter-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.panel-leave-active {
  transition:
    opacity 0.1s ease-in,
    transform 0.1s ease-in;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(6px);
}
</style>
