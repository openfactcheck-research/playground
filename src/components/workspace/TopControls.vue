<script setup lang="ts">
import type { Component } from 'vue'
import { ClipboardPaste, Copy, Download, LayoutGrid, Redo2, StickyNote, Trash2, Undo2, Upload } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useVerboseMode } from '@/composables/useVerboseMode'

const props = defineProps<{
  projectId: string
  workspaceId: string
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  copy: []
  paste: []
  clearWorkspace: []
  export: []
  import: []
  templates: []
  addNote: []
}>()

const { verboseMode } = useVerboseMode(() => props.projectId, () => props.workspaceId)

type EmitName = 'undo' | 'redo' | 'copy' | 'paste' | 'clearWorkspace' | 'export' | 'import' | 'templates' | 'addNote'

type ControlButton = {
  emit: EmitName
  tooltip: string
  icon: Component
  label?: string
  destructive?: boolean
}

type ControlItem = ControlButton | { separator: true }

const controls: ControlItem[] = [
  {
    emit: 'undo',
    tooltip: 'Undo',
    icon: Undo2,
  },
  {
    emit: 'redo',
    tooltip: 'Redo',
    icon: Redo2,
  },
  { separator: true },
  {
    emit: 'copy',
    tooltip: 'Copy block (cross-tab)',
    icon: Copy,
  },
  {
    emit: 'paste',
    tooltip: 'Paste blocks',
    icon: ClipboardPaste,
  },
  {
    emit: 'addNote',
    tooltip: 'Add a note',
    icon: StickyNote,
  },
  { separator: true },
  {
    emit: 'clearWorkspace',
    tooltip: 'Clear all blocks',
    icon: Trash2,
    destructive: true,
  },
  { separator: true },
  {
    emit: 'export',
    tooltip: 'Export pipeline',
    icon: Upload,
    label: 'Export',
  },
  {
    emit: 'import',
    tooltip: 'Import pipeline',
    icon: Download,
    label: 'Import',
  },
  {
    emit: 'templates',
    tooltip: 'Pipeline templates',
    icon: LayoutGrid,
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
            <component
              :is="item.icon"
              :size="item.label ? 13 : 15"
            />
            <span v-if="item.label">{{ item.label }}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ item.tooltip }}
        </TooltipContent>
      </Tooltip>
    </template>
    <div class="h-5 w-px bg-border" />
    <label class="flex items-center gap-2 px-1.5 text-xs text-muted-foreground select-none">
      <Switch v-model="verboseMode" />
      Full View
    </label>
  </div>
</template>
