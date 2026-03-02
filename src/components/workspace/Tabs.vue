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

async function startRename(tabId: string, currentName: string) {
  editingTabId.value = tabId
  editingName.value = currentName
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function resetRename() {
  editingTabId.value = null
  editingName.value = ''
}

function finishRename() {
  if (editingTabId.value && editingName.value.trim())
    emit('rename', editingTabId.value, editingName.value.trim())
  resetRename()
}
</script>

<template>
  <div class="flex w-full items-center border-b border-border bg-muted/30 px-2 py-1.5 gap-1">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="group relative flex flex-1 min-w-0 items-center justify-center rounded-lg py-1.5 text-sm transition-all duration-150"
      :class="tab.id === activeTabId
        ? 'bg-background dark:bg-muted text-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
      @click="emit('select', tab.id)"
      @dblclick.stop="startRename(tab.id, tab.name)"
    >
      <!-- Close button — absolute, left corner, appears on hover -->
      <span
        class="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full w-4 h-4 transition-opacity hover:bg-destructive/20 hover:text-destructive"
        :class="tab.id === activeTabId ? 'opacity-30 group-hover:opacity-80' : 'opacity-0 group-hover:opacity-50'"
        @click.stop="emit('close', tab.id)"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </span>

      <!-- Inline rename input or tab name -->
      <input
        v-if="editingTabId === tab.id"
        ref="inputRef"
        v-model="editingName"
        class="w-24 rounded border border-border bg-background px-1 py-0.5 text-center text-sm outline-none focus:border-primary"
        @blur="finishRename"
        @keydown.enter="finishRename"
        @keydown.escape="resetRename"
        @click.stop
      >
      <span v-else class="truncate px-5">{{ tab.name }}</span>
    </button>
  </div>
</template>
