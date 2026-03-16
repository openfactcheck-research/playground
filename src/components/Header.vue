<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

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
  nextTick(() => inputRef.value?.select())
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

const isDark = ref(false)
let observer: MutationObserver | null = null

function checkTheme() {
  isDark.value = document.documentElement.classList.contains('dark')
}

onMounted(() => {
  checkTheme()
  // Watch for theme changes on document
  observer = new MutationObserver(checkTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-border bg-card px-4">
    <div class="flex items-center gap-3">
      <RouterLink to="/projects" class="flex items-center">
        <img v-if="!isDark" src="/logo_sq_dark.svg" alt="OpenFactCheck" class="h-8 w-8">
        <img v-else src="/logo_sq_light.svg" alt="OpenFactCheck" class="h-8 w-8">
      </RouterLink>
      <span v-if="projectName" class="text-muted-foreground/40">/</span>
      <input
        v-if="editing"
        ref="inputRef"
        v-model="editName"
        class="h-7 w-48 rounded-md border border-border bg-secondary px-2 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
        @blur="finishEdit"
        @keydown.enter="finishEdit"
        @keydown.escape="editing = false"
      >
      <span
        v-else-if="projectName"
        class="cursor-default text-sm font-medium text-foreground"
        @dblclick="startEdit"
      >
        {{ projectName }}
      </span>
    </div>
    <button
      v-if="canAdd"
      class="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="New workspace"
      @click="emit('addTab')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </header>
</template>
