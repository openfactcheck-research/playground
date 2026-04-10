<script setup lang="ts">
import { Pencil, Plus } from 'lucide-vue-next'
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LogoImage from '@/components/LogoImage.vue'

const props = defineProps<{
  activeView: string
  canAdd?: boolean
  projectName?: string
}>()

const emit = defineEmits<{
  addTab: []
  renameProject: [name: string]
}>()

const editing = ref(false)
const editName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  editName.value = props.projectName ?? ''
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function finishEdit() {
  if (!editing.value)
    return
  editing.value = false
  const trimmed = editName.value.trim()
  if (trimmed && trimmed !== props.projectName) {
    emit('renameProject', trimmed)
  }
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-border bg-card px-4">
    <div class="flex items-center gap-3">
      <RouterLink to="/projects" class="flex items-center">
        <LogoImage variant="square" class="h-8 w-8" />
      </RouterLink>
      <span v-if="projectName" class="text-muted-foreground/40">/</span>
      <input
        v-if="editing"
        ref="inputRef"
        v-model="editName"
        aria-label="Project name"
        class="border-none bg-transparent text-sm font-medium text-foreground outline-none"
        @blur="finishEdit"
        @keydown.enter="finishEdit"
        @keydown.escape="editing = false"
      >
      <span
        v-else-if="projectName"
        class="group flex cursor-default items-center gap-1.5 text-sm font-medium text-foreground"
        @dblclick="startEdit"
      >
        {{ projectName }}
        <Pencil :size="11" class="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity cursor-pointer text-foreground" @click.stop="startEdit" />
      </span>
    </div>
    <div class="flex items-center gap-3">
      <button
        v-if="canAdd"
        class="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="New workspace"
        @click="emit('addTab')"
      >
        <Plus :size="16" />
      </button>
    </div>
  </header>
</template>
