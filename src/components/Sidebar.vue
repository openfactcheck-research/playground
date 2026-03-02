<script setup lang="ts">
import { h, onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  activeView: string
}>()

defineEmits<{
  changeView: [view: string]
  logout: []
  help: []
}>()

const isDark = ref(false)
const hoveredId = ref<string | null>(null)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  const stored = localStorage.getItem('theme')
  if (stored) {
    isDark.value = stored === 'dark'
  }
  else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}

const { user } = useAuth()
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(event: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

const WorkspaceIcon = {
  render() {
    return h('svg', { 'width': 20, 'height': 20, 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
      h('path', { d: 'M3 9h18' }),
      h('path', { d: 'M9 21V9' }),
    ])
  },
}

const SettingsIcon = {
  render() {
    return h('svg', { 'width': 20, 'height': 20, 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
      h('circle', { cx: 12, cy: 12, r: 3 }),
    ])
  },
}

const topNavItems = [
  { id: 'workspace', label: 'Workspace', icon: WorkspaceIcon },
]

const bottomNavItems = [
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]
</script>

<template>
  <aside class="flex w-16 flex-col border-r border-border bg-card py-4">
    <!-- Top nav items -->
    <div class="flex flex-col gap-2 px-3">
      <button
        v-for="item in topNavItems"
        :key="item.id"
        class="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        :class="activeView === item.id
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
        :aria-label="item.label"
        @mouseenter="hoveredId = item.id"
        @mouseleave="hoveredId = null"
        @click="$emit('changeView', item.id)"
      >
        <component :is="item.icon" class="shrink-0" />
        <span class="genie-label" :class="hoveredId === item.id ? 'genie-visible' : ''">
          {{ item.label }}
        </span>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Bottom nav -->
    <div class="flex flex-col gap-2 px-3">
      <!-- Help -->
      <button
        class="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        aria-label="Help"
        @mouseenter="hoveredId = 'help'"
        @mouseleave="hoveredId = null"
        @click="$emit('help')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        <span class="genie-label" :class="hoveredId === 'help' ? 'genie-visible' : ''">Help</span>
      </button>

      <!-- Theme toggle -->
      <button
        class="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        :aria-label="isDark ? 'Light mode' : 'Dark mode'"
        @mouseenter="hoveredId = 'theme'"
        @mouseleave="hoveredId = null"
        @click="toggleTheme"
      >
        <svg v-if="isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" /><path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" /><path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <span class="genie-label" :class="hoveredId === 'theme' ? 'genie-visible' : ''">
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </span>
      </button>

      <!-- Settings -->
      <button
        v-for="item in bottomNavItems"
        :key="item.id"
        class="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        :class="activeView === item.id
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
        :aria-label="item.label"
        @mouseenter="hoveredId = item.id"
        @mouseleave="hoveredId = null"
        @click="$emit('changeView', item.id)"
      >
        <component :is="item.icon" class="shrink-0" />
        <span class="genie-label" :class="hoveredId === item.id ? 'genie-visible' : ''">
          {{ item.label }}
        </span>
      </button>

      <!-- Separator -->
      <div class="my-1 h-px bg-border" />

      <!-- User avatar -->
      <div ref="userMenuRef" class="relative">
        <button
          class="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          aria-label="User menu"
          @mouseenter="hoveredId = 'user'"
          @mouseleave="hoveredId = null"
          @click.stop="showUserMenu = !showUserMenu"
        >
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {{ user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?' }}
          </div>
          <span class="genie-label" :class="hoveredId === 'user' ? 'genie-visible' : ''">
            {{ user?.name || user?.email || 'User' }}
          </span>
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showUserMenu"
          class="absolute bottom-0 left-full z-50 ml-2 min-w-48 rounded-md border border-border bg-card py-1 shadow-lg"
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
  </aside>
</template>

<style scoped>
.genie-label {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  z-index: 50;
  pointer-events: none;
  white-space: nowrap;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--foreground);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

  opacity: 0;
  transform: translateY(-50%) scaleX(0.3);
  transform-origin: left center;
  transition:
    opacity 0.15s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.genie-label.genie-visible {
  opacity: 1;
  transform: translateY(-50%) scaleX(1);
}
</style>
