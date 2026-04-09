<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DialogNamePrompt from '@/components/DialogNamePrompt.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/composables/useAuth'
import { useProjects } from '@/composables/useProjects'

const now = ref(Date.now())
let tickInterval: ReturnType<typeof setInterval> | null = null

const router = useRouter()
const { user, signOut } = useAuth()
const { projects, projectsLoading, getProject, createProject, renameProject, deleteProject, getWorkspaces, createWorkspace, updateWorkspace, duplicateWorkspace, deleteWorkspace, loadProjects, loadWorkspaces, clearCache } = useProjects(
  () => user.value?.userId ?? 'anonymous',
)

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))
let themeObserver: MutationObserver | null = null

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}

onMounted(() => {
  themeObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  themeObserver?.disconnect()
})

const selectedProjectId = ref(projects.value[0]?.id ?? '')
const searchQuery = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

// Project inline rename
const projRenameId = ref<string | null>(null)
const projRenameName = ref('')
const projRenameInputRef = ref<HTMLInputElement | null>(null)

function startProjRename(projId: string, currentName: string) {
  projRenameId.value = projId
  projRenameName.value = currentName
  setTimeout(() => projRenameInputRef.value?.focus(), 0)
}

async function finishProjRename() {
  if (projRenameId.value && projRenameName.value.trim()) {
    await renameProject(projRenameId.value, projRenameName.value.trim())
  }
  projRenameId.value = null
  projRenameName.value = ''
}

async function handleDeleteProject(projId: string) {
  const wasSelected = selectedProjectId.value === projId
  await deleteProject(projId)
  if (wasSelected) {
    selectedProjectId.value = projects.value[0]?.id ?? ''
  }
}

function handleExportProject(projId: string) {
  const project = getProject(projId)
  if (!project)
    return
  const workspaces = getWorkspaces(projId).map((ws) => {
    const blocklyState = localStorage.getItem(`blockly-workspace-state-${ws.id}`)
    return { ...ws, blocklyState: blocklyState ? JSON.parse(blocklyState) : null }
  })
  const data = { version: 1, project, workspaces, exportedAt: new Date().toISOString() }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Edit details dialog
const editDialogOpen = ref(false)
const editWsId = ref('')
const editName = ref('')
const editDescription = ref('')
const editLocked = ref(false)

function openEditDialog(wsId: string) {
  const ws = getWorkspaces(selectedProjectId.value).find(w => w.id === wsId)
  if (!ws)
    return
  editWsId.value = wsId
  editName.value = ws.name
  editDescription.value = ws.description ?? ''
  editLocked.value = ws.locked ?? false
  editDialogOpen.value = true
}

async function saveEditDialog() {
  if (!editWsId.value || !editName.value.trim())
    return
  await updateWorkspace(selectedProjectId.value, editWsId.value, {
    name: editName.value.trim(),
    description: editDescription.value,
    locked: editLocked.value,
  })
  editDialogOpen.value = false
}

async function handleDuplicate(wsId: string) {
  await duplicateWorkspace(selectedProjectId.value, wsId)
}

async function handleDelete(wsId: string) {
  await deleteWorkspace(selectedProjectId.value, wsId)
}

const selectedProject = computed(() => getProject(selectedProjectId.value))

const filteredWorkspaces = computed(() => {
  if (!selectedProjectId.value)
    return []
  const workspaces = getWorkspaces(selectedProjectId.value)
  if (!searchQuery.value.trim())
    return workspaces
  const q = searchQuery.value.toLowerCase()
  return workspaces.filter(w => w.name.toLowerCase().includes(q))
})

function formatTimeAgo(dateStr: string): string {
  const _tick = now.value
  const diff = _tick - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)
    return 'Edited just now'
  if (minutes < 60)
    return `Edited ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)
    return `Edited ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30)
    return `Edited ${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12)
    return `Edited ${months}mo ago`
  return `Edited ${Math.floor(months / 12)}y ago`
}

// Create dialogs
const newProjectOpen = ref(false)
const newWorkspaceOpen = ref(false)

async function handleCreateProject(name: string) {
  const project = await createProject(name)
  selectedProjectId.value = project.id
}

async function handleCreateWorkspace(name: string) {
  if (!selectedProjectId.value)
    return
  await createWorkspace(selectedProjectId.value, name)
}

function openWorkspace(workspaceId: string) {
  router.push({ name: 'dashboard', params: { projectId: selectedProjectId.value }, query: { ws: workspaceId } })
}

async function handleLogout() {
  await signOut()
  clearCache()
  router.push('/login')
}

function handleOutsideClick(event: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

// Redirect to welcome page when no projects exist (wait for load to finish)
watch([() => projects.value.length, projectsLoading], ([len, loading]) => {
  if (len === 0 && !loading)
    router.replace({ name: 'welcome' })
})

// Load workspaces when selected project changes (immediate covers initial load)
watch(selectedProjectId, (pid) => {
  if (pid)
    loadWorkspaces(pid)
}, { immediate: true })

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick)
  tickInterval = setInterval(() => {
    now.value = Date.now()
  }, 30000)
  await loadProjects()
  // After projects load, select first if none selected
  if (!selectedProjectId.value && projects.value.length > 0)
    selectedProjectId.value = projects.value[0]!.id
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  if (tickInterval)
    clearInterval(tickInterval)
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-background text-foreground">
    <!-- Left sidebar: Projects -->
    <aside class="flex w-56 flex-col border-r border-border bg-card">
      <!-- Logo -->
      <div class="flex h-14 items-center border-b border-border px-4">
        <img v-if="!isDark" src="/logo_dark.svg" alt="OpenFactCheck" class="h-8">
        <img v-else src="/logo_light.svg" alt="OpenFactCheck" class="h-8">
      </div>

      <!-- Projects header -->
      <div class="flex items-center justify-between px-4 pt-3 pb-1">
        <span class="text-sm font-semibold">Projects</span>
        <div class="flex items-center gap-1">
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Import project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="New project"
            @click="newProjectOpen = true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Project list -->
      <nav class="flex-1 overflow-y-auto p-2">
        <div
          v-for="project in projects"
          :key="project.id"
          class="group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer"
          :class="selectedProjectId === project.id
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
          @click="selectedProjectId = project.id"
        >
          <!-- Inline rename or project name -->
          <input
            v-if="projRenameId === project.id"
            ref="projRenameInputRef"
            v-model="projRenameName"
            class="w-full truncate rounded border border-border bg-background px-1 py-0.5 text-sm outline-none focus:border-primary"
            @blur="finishProjRename"
            @keydown.enter="finishProjRename"
            @keydown.escape="projRenameId = null"
            @click.stop
          >
          <span v-else class="truncate">{{ project.name }}</span>

          <div class="relative">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground"
                  :class="selectedProjectId === project.id ? 'opacity-100' : 'group-hover:opacity-100'"
                  @click.stop
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" class="min-w-40">
                <DropdownMenuItem @click="startProjRename(project.id, project.name)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleExportProject(project.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @click="handleDeleteProject(project.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-border p-2">
        <!-- Theme toggle -->
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          @click="toggleTheme"
        >
          <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" /><path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" /><path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <span>{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
        </button>

        <!-- User -->
        <div ref="userMenuRef" class="relative">
          <button
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            @click.stop="showUserMenu = !showUserMenu"
          >
            <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {{ user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?' }}
            </div>
            <span class="truncate">{{ user?.name || user?.email || 'User' }}</span>
          </button>
          <div
            v-if="showUserMenu"
            class="absolute bottom-full left-0 z-50 mb-1 min-w-48 rounded-md border border-border bg-card py-1 shadow-lg"
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
              @click="showUserMenu = false; handleLogout()"
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

    <!-- Main content -->
    <main class="flex flex-1 flex-col overflow-hidden">
      <!-- Project header -->
      <header class="flex h-14 items-center border-b border-border px-6">
        <h1 class="text-lg font-semibold">
          {{ selectedProject?.name }}
        </h1>
      </header>

      <!-- Tabs -->
      <div class="border-b border-border px-6">
        <div class="flex gap-4">
          <button class="border-b-2 border-foreground px-1 py-3 text-sm font-medium text-foreground">
            Workspaces
          </button>
        </div>
      </div>

      <!-- Toolbar: search + view toggle + new flow -->
      <div class="flex items-center gap-3 px-6 py-4">
        <div class="relative max-w-sm flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search workspaces..."
            class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
        </div>

        <div class="flex rounded-md border border-border">
          <button
            class="flex h-8 w-8 items-center justify-center transition-colors"
            :class="viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="viewMode = 'list'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            class="flex h-8 w-8 items-center justify-center border-l border-border transition-colors"
            :class="viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="viewMode = 'grid'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        <div class="flex-1" />

        <button
          class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          @click="newWorkspaceOpen = true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Workspace
        </button>
      </div>

      <!-- Flow list -->
      <div class="flex-1 overflow-y-auto px-6">
        <!-- List view -->
        <div v-if="viewMode === 'list'" class="flex flex-col">
          <div
            v-for="ws in filteredWorkspaces"
            :key="ws.id"
            class="group flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary/50 cursor-pointer"
            @click="openWorkspace(ws.id)"
          >
            <!-- Workspace icon -->
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-orange-400/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-fuchsia-400">
                <path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.364-6.364-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0-2.828-2.828M9.464 9.464 6.636 6.636" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-foreground">{{ ws.name }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTimeAgo(ws.updatedAt) }}</span>
              </div>
              <p v-if="ws.description" class="truncate text-xs text-muted-foreground/70">
                {{ ws.description }}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary hover:text-foreground"
                  @click.stop
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="min-w-44">
                <DropdownMenuItem @click="openEditDialog(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem @click="openWorkspace(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleDuplicate(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @click="handleDelete(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Grid view -->
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div
            v-for="ws in filteredWorkspaces"
            :key="ws.id"
            class="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/30 cursor-pointer"
            @click="openWorkspace(ws.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-orange-400/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-fuchsia-400">
                  <path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.364-6.364-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0-2.828-2.828M9.464 9.464 6.636 6.636" />
                </svg>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary hover:text-foreground"
                    @click.stop
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="min-w-44">
                  <DropdownMenuItem @click="openEditDialog(ws.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openWorkspace(ws.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleDuplicate(ws.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" @click="handleDelete(ws.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">
                {{ ws.name }}
              </p>
              <p v-if="ws.description" class="mt-0.5 truncate text-xs text-muted-foreground/70">
                {{ ws.description }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ formatTimeAgo(ws.updatedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredWorkspaces.length === 0" class="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-4 text-muted-foreground/40">
            <path d="M12 3v4m0 14v-4m9-5h-4M7 12H3m15.364-6.364-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0-2.828-2.828M9.464 9.464 6.636 6.636" />
          </svg>
          <p class="text-sm text-muted-foreground">
            No workspaces yet
          </p>
          <button
            class="mt-3 text-sm font-medium text-primary hover:underline"
            @click="newWorkspaceOpen = true"
          >
            Create your first workspace
          </button>
        </div>
      </div>
    </main>

    <!-- Edit details dialog -->
    <Teleport to="body">
      <div
        v-if="editDialogOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
        @click.self="editDialogOpen = false"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" @click.stop>
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">
              Workspace Details
            </h2>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              @click="editDialogOpen = false"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Name -->
          <div class="mt-5">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Name</label>
            <input
              v-model="editName"
              type="text"
              class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
          </div>

          <!-- Description -->
          <div class="mt-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              v-model="editDescription"
              rows="4"
              class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Describe this workspace..."
            />
          </div>

          <!-- Lock toggle -->
          <div class="mt-4 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                Lock Workspace
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <p class="text-xs text-muted-foreground">
                Lock your workspace to prevent edits or accidental changes.
              </p>
            </div>
            <button
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              :class="editLocked ? 'bg-primary' : 'bg-muted'"
              @click="editLocked = !editLocked"
            >
              <span
                class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                :class="editLocked ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end gap-2">
            <button
              class="h-9 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              @click="editDialogOpen = false"
            >
              Cancel
            </button>
            <button
              class="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              @click="saveEditDialog"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <DialogNamePrompt
      v-model:open="newProjectOpen"
      title="New Project"
      description="Give your project a name."
      placeholder="My Project"
      @confirm="handleCreateProject"
    />
    <DialogNamePrompt
      v-model:open="newWorkspaceOpen"
      title="New Workspace"
      description="Give your workspace a name."
      placeholder="My Workspace"
      @confirm="handleCreateWorkspace"
    />
  </div>
</template>
