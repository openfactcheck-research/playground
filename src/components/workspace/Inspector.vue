<script setup lang="ts">
import type BlocklyWorkspace from './BlocklyWorkspace.vue'
import type { SelectedBlockInfo } from './BlocklyWorkspace.vue'
import { Code2, Puzzle } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import PanelCode from './PanelCode.vue'
import PanelControls from './PanelControls.vue'

export type InspectorPanel = 'controls' | 'code'

defineProps<{
  code: string
  selectedBlock: SelectedBlockInfo | null
  highlightCode?: string
  blocklyRef?: InstanceType<typeof BlocklyWorkspace> | null
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
            :class="activePanel === 'controls' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
            @click="togglePanel('controls')"
          >
            <Puzzle :size="16" />
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
            :class="activePanel === 'code' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
            @click="togglePanel('code')"
          >
            <Code2 :size="16" />
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
        :blockly-ref="blocklyRef"
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
