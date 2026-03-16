<script setup lang="ts">
import { AppWindow, CircleHelp, LogOut, Moon, Settings, Sun } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
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

const topNavItems = [
  { id: 'workspace', label: 'Workspace', icon: AppWindow },
]

const bottomNavItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
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
        <CircleHelp :size="20" />
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
        <Sun v-if="isDark" :size="20" />
        <Moon v-else :size="20" />
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
            <LogOut :size="14" />
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
