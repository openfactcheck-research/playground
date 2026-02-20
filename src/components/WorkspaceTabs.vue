<script setup lang="ts">
import { nextTick, ref } from 'vue'

export type WorkspaceTab = {
  id: string
  name: string
}

defineProps<{
  tabs: WorkspaceTab[]
  activeTabId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  rename: [id: string, name: string]
}>()

const editingTabId = ref<string | null>(null)
const editingName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startRename(tabId: string, currentName: string) {
  editingTabId.value = tabId
  editingName.value = currentName
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function finishRename() {
  if (editingTabId.value && editingName.value.trim()) {
    emit('rename', editingTabId.value, editingName.value.trim())
  }
  editingTabId.value = null
  editingName.value = ''
}

function cancelRename() {
  editingTabId.value = null
  editingName.value = ''
}
</script>

<template>
  <div class="flex items-center border-b border-border bg-card/50">
    <!-- Tabs spanning full width -->
    <div class="flex flex-1 items-center gap-1 px-2 py-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="group relative flex flex-1 items-center justify-center gap-2 rounded-t-md px-3 py-1.5 text-sm transition-colors"
        :class="tab.id === activeTabId
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
        @click="emit('select', tab.id)"
        @dblclick.stop="startRename(tab.id, tab.name)"
      >
        <!-- Close button (only if more than 1 tab) - positioned left -->
        <button
          v-if="tabs.length > 1"
          class="absolute left-2 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
          :class="tab.id === activeTabId ? 'opacity-60' : ''"
          @click.stop="emit('close', tab.id)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <!-- Editable name -->
        <input
          v-if="editingTabId === tab.id"
          ref="inputRef"
          v-model="editingName"
          class="w-20 rounded border border-border bg-background px-1 py-0.5 text-center text-sm outline-none focus:border-primary"
          @blur="finishRename"
          @keydown.enter="finishRename"
          @keydown.escape="cancelRename"
          @click.stop
        >
        <span v-else>{{ tab.name }}</span>
      </button>
    </div>
  </div>
</template>
