<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  activeView: string
  canAdd?: boolean
}>()

const emit = defineEmits<{
  addTab: []
}>()

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
      <img v-if="!isDark" src="/logo_sq_dark.svg" alt="OpenFactCheck" class="h-8 w-8">
      <img v-else src="/logo_sq_light.svg" alt="OpenFactCheck" class="h-8 w-8">
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
