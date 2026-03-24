<script setup lang="ts">
import type { SelectedBlockInfo } from '@/components/workspace/BlocklyWorkspace.vue'
import type { InspectorPanel } from '@/components/workspace/Inspector.vue'
import type { WorkspaceTab } from '@/components/workspace/Tabs.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DialogUrlPrompt from '@/blockly/dialogs/URLPrompt.vue'
import { promptOpen } from '@/blockly/dialogs/urlPromptBridge'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import WelcomeTour from '@/components/WelcomeTour.vue'
import BlocklyWorkspace from '@/components/workspace/BlocklyWorkspace.vue'
import WorkspaceBottomControls from '@/components/workspace/BottomControls.vue'
import DialogExport from '@/components/workspace/DialogExport.vue'
import DialogImport from '@/components/workspace/DialogImport.vue'
import WorkspaceInspector from '@/components/workspace/Inspector.vue'
import WorkspaceTabs from '@/components/workspace/Tabs.vue'
import WorkspaceTopControls from '@/components/workspace/TopControls.vue'
import { useAuth } from '@/composables/useAuth'
import { useProjects } from '@/composables/useProjects'

const route = useRoute()
const router = useRouter()
const { user, signOut } = useAuth()
const { getProject, getWorkspaces, getWorkspace, createWorkspace, renameProject, renameWorkspace, deleteWorkspace, canAddWorkspace, touchWorkspace, reorderWorkspaces } = useProjects(
  () => user.value?.userId ?? 'anonymous',
)

const projectId = computed(() => route.params.projectId as string)
const initialWs = route.query.ws as string | undefined

// -- Tabs backed by composable workspaces --
const workspaces = computed(() => getWorkspaces(projectId.value))

const tabs = computed<WorkspaceTab[]>(() =>
  workspaces.value.map(ws => ({ id: ws.id, name: ws.name })),
)

const activeTabId = ref(
  (initialWs && workspaces.value.find(w => w.id === initialWs) ? initialWs : workspaces.value[0]?.id) ?? '',
)

// Keep activeTabId in sync if workspaces change (e.g. deletion)
watch(workspaces, (ws) => {
  if (ws.length && !ws.find(w => w.id === activeTabId.value)) {
    activeTabId.value = ws[0]!.id
  }
}, { flush: 'post' })

const project = computed(() => getProject(projectId.value))
const activeWorkspace = computed(() => getWorkspace(projectId.value, activeTabId.value))

function handleAddTab() {
  const ws = createWorkspace(projectId.value, 'Untitled Workspace')
  if (ws)
    activeTabId.value = ws.id
}

function handleCloseTab(id: string) {
  if (workspaces.value.length <= 1)
    return // don't close last tab
  const idx = workspaces.value.findIndex(w => w.id === id)
  if (activeTabId.value === id) {
    const next = workspaces.value[idx === 0 ? 1 : idx - 1]!
    activeTabId.value = next.id
  }
  deleteWorkspace(projectId.value, id)
}

function handleRenameTab(id: string, name: string) {
  renameWorkspace(projectId.value, id, name)
}

function handleReorderTabs(orderedIds: string[]) {
  reorderWorkspaces(projectId.value, orderedIds)
}

const blocklyRef = ref<InstanceType<typeof BlocklyWorkspace> | null>(null)
const welcomeTourRef = ref<InstanceType<typeof WelcomeTour> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const activeView = ref('workspace')
const generatedCode = ref('')
const selectedBlockInfo = ref<SelectedBlockInfo | null>(null)
const inspectorPanel = ref<InspectorPanel | null>(null)
const blockCodeHighlight = ref<string | null>(null)

watch(selectedBlockInfo, () => {
  blockCodeHighlight.value = null
})

const zoomPercent = ref(1.0)
const workspaceLocked = ref(false)
const trashHasContents = ref(false)

// Export
const exportDialogOpen = ref(false)
const exportFilename = ref('')
let pendingExportData: object | null = null

function handleExport() {
  const state = blocklyRef.value?.getState()
  if (!state)
    return
  const name = activeWorkspace.value?.name || 'Pipeline'
  pendingExportData = {
    version: 1,
    name,
    exportedAt: new Date().toISOString(),
    workspace: state,
  }
  exportFilename.value = name.replace(/\s+/g, '-').toLowerCase()
  exportDialogOpen.value = true
}

function confirmExport() {
  if (!pendingExportData || !exportFilename.value.trim())
    return
  const json = JSON.stringify(pendingExportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportFilename.value.trim().replace(/\.json$/i, '')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  exportDialogOpen.value = false
  pendingExportData = null
}

// Import
const importDialogOpen = ref(false)
const importFileName = ref('')
let pendingImportData: { workspace: object, name?: string } | null = null

function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (!data.workspace) {
        // eslint-disable-next-line no-alert
        alert('Invalid pipeline file: missing workspace data')
        return
      }
      pendingImportData = data
      importFileName.value = data.name || file.name.replace(/\.json$/i, '')
      importDialogOpen.value = true
    }
    catch {
      // eslint-disable-next-line no-alert
      alert('Failed to import pipeline: invalid JSON')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function handleImportAction(_action: 'new-tab' | 'replace') {
  if (!pendingImportData)
    return
  blocklyRef.value?.setState(pendingImportData.workspace as any)
  pendingImportData = null
}

function handleToggleLock() {
  blocklyRef.value?.toggleLock()
  workspaceLocked.value = !workspaceLocked.value
}

async function handleLogout() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleImportFile">

    <DialogExport v-model:open="exportDialogOpen" v-model:filename="exportFilename" @confirm="confirmExport" />
    <DialogImport v-model:open="importDialogOpen" title="Import Pipeline" :item-name="importFileName" @select="handleImportAction" />
    <DialogUrlPrompt v-model:open="promptOpen" />

    <WelcomeTour ref="welcomeTourRef" />
    <Header :active-view="activeView" :can-add="canAddWorkspace(projectId)" :project-name="project?.name" @add-tab="handleAddTab" @rename-project="renameProject(projectId, $event)" />
    <WorkspaceTabs
      v-if="tabs.length > 1"
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @select="activeTabId = $event"
      @close="handleCloseTab"
      @rename="handleRenameTab"
      @reorder="handleReorderTabs"
    />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        :active-view="activeView"
        @change-view="activeView = $event"
        @logout="handleLogout"
        @help="welcomeTourRef?.show()"
      />
      <main class="flex flex-1 flex-col overflow-hidden">
        <div class="relative flex-1 overflow-hidden" style="background-color: light-dark(#fafafa, #171717); background-image: radial-gradient(circle, light-dark(#d4d4d4, #404040) 1px, transparent 1px); background-size: 20px 20px;">
          <BlocklyWorkspace
            ref="blocklyRef"
            :project-id="projectId"
            :workspace-id="activeTabId"
            @code-change="generatedCode = $event; touchWorkspace(projectId, activeTabId)"
            @viewport-change="zoomPercent = $event"
            @trash-change="trashHasContents = $event"
            @block-select="selectedBlockInfo = $event"
            @open-controls="inspectorPanel = 'controls'"
            @open-code="inspectorPanel = 'code'; blockCodeHighlight = $event"
          />
          <WorkspaceInspector
            v-model:active-panel="inspectorPanel"
            :code="generatedCode"
            :selected-block="selectedBlockInfo"
            :highlight-code="blockCodeHighlight ?? undefined"
            :blockly-ref="blocklyRef"
            @freeze="blocklyRef?.freezeSelectedBlock()"
          />
          <WorkspaceTopControls
            :project-id="projectId"
            :workspace-id="activeTabId"
            @undo="blocklyRef?.undo()"
            @redo="blocklyRef?.redo()"
            @copy="blocklyRef?.copySelectedBlocks()"
            @paste="blocklyRef?.pasteBlocks()"
            @clear-workspace="blocklyRef?.clearWorkspace()"
            @export="handleExport"
            @import="fileInputRef?.click()"
            @templates="() => {}"
            @add-note="blocklyRef?.addNote()"
          />
          <WorkspaceBottomControls
            :zoom-percent="zoomPercent"
            :locked="workspaceLocked"
            :trash-has-contents="trashHasContents"
            @toggle-lock="handleToggleLock"
            @zoom-in="blocklyRef?.zoomIn()"
            @zoom-out="blocklyRef?.zoomOut()"
            @zoom-reset="blocklyRef?.zoomReset()"
            @zoom-to-fit="blocklyRef?.zoomToFit()"
            @open-trash="blocklyRef?.openTrash()"
          />
        </div>
      </main>
    </div>
  </div>
</template>
