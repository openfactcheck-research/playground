<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDelete from '@/components/dialogs/ConfirmDelete.vue'
import DialogCreate from '@/components/dialogs/Create.vue'
import EditProject from '@/components/dialogs/EditProject.vue'
import EditWorkspace from '@/components/dialogs/EditWorkspace.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/composables/useAuth'
import { useClickOutside } from '@/composables/useClickOutside'
import { useProjects } from '@/composables/useProjects'
import { useTheme } from '@/composables/useTheme'

const now = ref(Date.now())
let tickInterval: ReturnType<typeof setInterval> | null = null

const router = useRouter()
const { user, signOut } = useAuth()
const { projects, projectsLoading, workspacesLoading, getProject, createProject, updateProject, deleteProject, getWorkspaces, createWorkspace, updateWorkspace, duplicateWorkspace, deleteWorkspace, loadProjects, loadWorkspaces, clearCache } = useProjects(
  () => user.value?.userId ?? 'anonymous',
)

const { isDark, toggleTheme } = useTheme()

const selectedProjectId = ref(projects.value[0]?.id ?? '')
const searchQuery = ref('')
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
useClickOutside(userMenuRef, () => {
  showUserMenu.value = false
})

// Delete confirmation
const deleteDialogOpen = ref(false)
const deleteDialogTitle = ref('')
const deleteDialogDescription = ref('')
let pendingDeleteAction: (() => Promise<void>) | null = null

function confirmDeleteProject(projId: string) {
  const project = getProject(projId)
  deleteDialogTitle.value = 'Delete Project'
  deleteDialogDescription.value = `Delete "${project?.name ?? 'this project'}" and all its workspaces? This cannot be undone.`
  pendingDeleteAction = async () => {
    const wasSelected = selectedProjectId.value === projId
    await deleteProject(projId)
    if (wasSelected)
      selectedProjectId.value = projects.value[0]?.id ?? ''
  }
  deleteDialogOpen.value = true
}

function handleExportProject(projId: string) {
  const project = getProject(projId)
  if (!project)
    return
  const workspaces = getWorkspaces(projId).map(ws => ({
    ...ws,
    blocklyState: ws.content?.blockly ?? null,
  }))
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
// Workspace edit dialog
const editWsDialogOpen = ref(false)
const editWsId = ref('')
const editWsData = ref({ name: '', description: '', locked: false })

function openEditDialog(wsId: string) {
  const ws = getWorkspaces(selectedProjectId.value).find(w => w.id === wsId)
  if (!ws)
    return
  editWsId.value = wsId
  editWsData.value = { name: ws.name, description: ws.description ?? '', locked: ws.locked ?? false }
  editWsDialogOpen.value = true
}

async function saveEditDialog(name: string, description: string, locked: boolean) {
  await updateWorkspace(selectedProjectId.value, editWsId.value, { name, description, locked })
}

// Project edit dialog
const projEditOpen = ref(false)
const projEditId = ref('')
const projEditData = ref({ name: '', description: '' })

function openProjEditDialog(projId: string) {
  const proj = getProject(projId)
  if (!proj)
    return
  projEditId.value = projId
  projEditData.value = { name: proj.name, description: proj.description ?? '' }
  projEditOpen.value = true
}

async function saveProjEditDialog(name: string, description: string) {
  await updateProject(projEditId.value, { name, description })
}

async function handleDuplicate(wsId: string) {
  await duplicateWorkspace(selectedProjectId.value, wsId)
}

function confirmDeleteWorkspace(wsId: string) {
  deleteDialogTitle.value = 'Delete Workspace'
  deleteDialogDescription.value = 'Delete this workspace? This cannot be undone.'
  pendingDeleteAction = async () => {
    await deleteWorkspace(selectedProjectId.value, wsId)
  }
  deleteDialogOpen.value = true
}

async function executeDelete() {
  if (pendingDeleteAction) {
    await pendingDeleteAction()
    pendingDeleteAction = null
  }
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

async function handleCreateProject(name: string, description: string) {
  const project = await createProject(name, description)
  selectedProjectId.value = project.id
}

async function handleCreateWorkspace(name: string, description: string) {
  if (!selectedProjectId.value)
    return
  await createWorkspace(selectedProjectId.value, name, description)
}

function openWorkspace(workspaceId: string) {
  router.push({ name: 'dashboard', params: { projectId: selectedProjectId.value }, query: { ws: workspaceId } })
}

async function handleLogout() {
  await signOut()
  clearCache()
  router.push('/login')
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
  tickInterval = setInterval(() => {
    now.value = Date.now()
  }, 30000)
  await loadProjects()
  // After projects load, select first if none selected
  if (!selectedProjectId.value && projects.value.length > 0)
    selectedProjectId.value = projects.value[0]!.id
})

onUnmounted(() => {
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
        <!-- Skeleton loading -->
        <template v-if="projectsLoading && projects.length === 0">
          <div v-for="i in 3" :key="i" class="flex items-center rounded-lg px-3 py-2">
            <div class="h-4 w-32 animate-pulse rounded bg-secondary" />
          </div>
        </template>

        <div
          v-for="project in projects"
          :key="project.id"
          class="group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer"
          :class="selectedProjectId === project.id
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
          @click="selectedProjectId = project.id"
        >
          <span class="truncate">{{ project.name }}</span>

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
                <DropdownMenuItem @click="openProjEditDialog(project.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleExportProject(project.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @click="confirmDeleteProject(project.id)">
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
        <div>
          <h1 class="text-lg font-semibold">
            {{ selectedProject?.name }}
          </h1>
          <p v-if="selectedProject?.description" class="text-xs text-muted-foreground">
            {{ selectedProject.description }}
          </p>
        </div>
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
        <!-- Skeleton loading -->
        <div v-if="workspacesLoading && filteredWorkspaces.length === 0" class="flex flex-col">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-3 py-3">
            <div class="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-secondary" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-40 animate-pulse rounded bg-secondary" />
              <div class="h-3 w-24 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        </div>

        <!-- List view -->
        <div class="flex flex-col">
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
                <DropdownMenuItem @click="handleDuplicate(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @click="confirmDeleteWorkspace(ws.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!workspacesLoading && filteredWorkspaces.length === 0" class="flex flex-1 flex-col items-center justify-center py-24 text-center">
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
    <EditWorkspace
      v-model:open="editWsDialogOpen"
      :name="editWsData.name"
      :description="editWsData.description"
      :locked="editWsData.locked"
      @save="saveEditDialog"
    />
    <EditProject
      v-model:open="projEditOpen"
      :name="projEditData.name"
      :description="projEditData.description"
      @save="saveProjEditDialog"
    />

    <DialogCreate
      v-model:open="newProjectOpen"
      title="New Project"
      description="Give your project a name and an optional description."
      placeholder="My Project"
      show-description
      @confirm="handleCreateProject"
    />
    <DialogCreate
      v-model:open="newWorkspaceOpen"
      title="New Workspace"
      description="Give your workspace a name and an optional description."
      placeholder="My Workspace"
      show-description
      @confirm="handleCreateWorkspace"
    />
    <ConfirmDelete
      v-model:open="deleteDialogOpen"
      :title="deleteDialogTitle"
      :description="deleteDialogDescription"
      @confirm="executeDelete"
    />
  </div>
</template>
