<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  activeView: string
}>()

defineEmits<{
  run: []
  clear: []
  undo: []
  redo: []
  logout: []
  help: []
}>()

const { user } = useAuth()
const isDark = ref(false)
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  // Check system preference or stored preference
  const stored = localStorage.getItem('theme')
  if (stored) {
    isDark.value = stored === 'dark'
  }
  else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()

  // Close menu on outside click
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(event: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  // Update color-scheme for light-dark() CSS function
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-border bg-card px-4">
    <div class="flex items-center gap-3">
      <img v-if="!isDark" src="/logo_dark.svg" alt="OpenFactCheck" class="h-8">
      <img v-else src="/logo_light.svg" alt="OpenFactCheck" class="h-8">
    </div>

    <div class="flex items-center gap-2">
      <button
        class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Undo"
        aria-label="Undo"
        @click="$emit('undo')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>
      <button
        class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Redo"
        aria-label="Redo"
        @click="$emit('redo')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        </svg>
      </button>

      <div class="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <button
        class="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Clear workspace"
        @click="$emit('clear')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        Clear
      </button>

      <button
        data-tour="run"
        class="flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        @click="$emit('run')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Run
      </button>

      <div class="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <!-- Help button -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Show tour"
        aria-label="Show tour"
        @click="$emit('help')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>

      <!-- Theme toggle -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <!-- Sun icon (shown in dark mode) -->
        <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <!-- Moon icon (shown in light mode) -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>

      <!-- User menu -->
      <div ref="userMenuRef" class="relative">
        <button
          class="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          @click.stop="showUserMenu = !showUserMenu"
        >
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {{ user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?' }}
          </div>
          <span class="max-w-32 truncate">{{ user?.name || user?.email || 'User' }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <!-- Dropdown -->
        <div
          v-if="showUserMenu"
          class="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-md border border-border bg-card py-1 shadow-lg"
        >
          <div class="border-b border-border px-3 py-2">
            <p class="text-sm font-medium text-foreground">
              {{ user?.name || 'User' }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ user?.email }}
            </p>
          </div>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
            @click="showUserMenu = false; $emit('logout')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
