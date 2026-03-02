<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type EmitName = 'undo' | 'redo' | 'copy' | 'paste' | 'clearWorkspace' | 'export' | 'import' | 'templates'

type ControlButton = {
  emit: EmitName
  tooltip: string
  icon: string
  label?: string
  destructive?: boolean
}

type ControlItem = ControlButton | { separator: true }

const emit = defineEmits<{
  undo: []
  redo: []
  copy: []
  paste: []
  clearWorkspace: []
  export: []
  import: []
  templates: []
}>()

const controls: ControlItem[] = [
  {
    emit: 'undo',
    tooltip: 'Undo',
    icon: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  },
  {
    emit: 'redo',
    tooltip: 'Redo',
    icon: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
  },
  { separator: true },
  {
    emit: 'copy',
    tooltip: 'Copy block (cross-tab)',
    icon: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  },
  {
    emit: 'paste',
    tooltip: 'Paste blocks',
    icon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
  },
  { separator: true },
  {
    emit: 'clearWorkspace',
    tooltip: 'Clear all blocks',
    icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    destructive: true,
  },
  { separator: true },
  {
    emit: 'export',
    tooltip: 'Export pipeline',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    label: 'Export',
  },
  {
    emit: 'import',
    tooltip: 'Import pipeline',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    label: 'Import',
  },
  {
    emit: 'templates',
    tooltip: 'Pipeline templates',
    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    label: 'Templates',
  },
]
</script>

<template>
  <div class="absolute top-3 right-6 z-10 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg" @pointerdown.stop @mousedown.prevent>
    <template v-for="(item, i) in controls" :key="i">
      <div v-if="'separator' in item" class="h-5 w-px bg-border" />
      <Tooltip v-else>
        <TooltipTrigger as-child>
          <button
            class="flex h-8 items-center rounded-lg transition-colors"
            :class="[
              item.label
                ? 'gap-1.5 px-2 text-xs font-medium'
                : 'w-8 justify-center',
              item.destructive
                ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ]"
            @click="(emit as (e: EmitName) => void)(item.emit)"
          >
            <svg
              :width="item.label ? 13 : 15"
              :height="item.label ? 13 : 15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-html="item.icon"
            />
            <span v-if="item.label">{{ item.label }}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ item.tooltip }}
        </TooltipContent>
      </Tooltip>
    </template>
  </div>
</template>
