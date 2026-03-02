<script setup lang="ts">
import type { SelectedBlockInfo } from '@/components/workspace/BlocklyWorkspace.vue'
import type { InspectorPanel } from '@/components/workspace/Inspector.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { useWorkspaceTabs } from '@/composables/useWorkspaceTabs'

const router = useRouter()
const { signOut } = useAuth()
const { tabs: workspaceTabs, activeTabId, canAddTab, selectTab, addTab, closeTab, renameTab } = useWorkspaceTabs()

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
  const activeTab = workspaceTabs.value.find(t => t.id === activeTabId.value)
  pendingExportData = {
    version: 1,
    name: activeTab?.name || 'Pipeline',
    exportedAt: new Date().toISOString(),
    workspace: state,
  }
  exportFilename.value = (activeTab?.name || 'pipeline').replace(/\s+/g, '-').toLowerCase()
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

function handleImportAction(action: 'new-tab' | 'replace') {
  if (!pendingImportData)
    return
  if (action === 'new-tab') {
    if (!canAddTab()) {
      pendingImportData = null
      return
    }
    const newTab = { id: `workspace-${Date.now()}`, name: importFileName.value || 'Imported Pipeline' }
    workspaceTabs.value.push(newTab)
    localStorage.setItem(`blockly-workspace-state-${newTab.id}`, JSON.stringify(pendingImportData.workspace))
    activeTabId.value = newTab.id
  }
  else {
    blocklyRef.value?.setState(pendingImportData.workspace as any)
  }
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

    <WelcomeTour ref="welcomeTourRef" />
    <Header :active-view="activeView" :can-add="canAddTab()" @add-tab="addTab" />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        :active-view="activeView"
        @change-view="activeView = $event"
        @logout="handleLogout"
        @help="welcomeTourRef?.show()"
      />
      <main class="flex flex-1 flex-col overflow-hidden">
        <WorkspaceTabs
          v-if="workspaceTabs.length > 1"
          :tabs="workspaceTabs"
          :active-tab-id="activeTabId"
          @select="selectTab"
          @close="closeTab"
          @rename="renameTab"
        />

        <div v-if="workspaceTabs.length === 0" class="flex flex-1 items-center justify-center">
          <button
            class="flex items-center gap-2 rounded-lg border border-dashed border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            @click="addTab"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New workspace
          </button>
        </div>

        <div v-else class="relative flex-1 overflow-hidden">
          <BlocklyWorkspace
            ref="blocklyRef"
            :workspace-id="activeTabId"
            @code-change="generatedCode = $event"
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
            @freeze="blocklyRef?.freezeSelectedBlock()"
          />
          <WorkspaceTopControls
            @undo="blocklyRef?.undo()"
            @redo="blocklyRef?.redo()"
            @copy="blocklyRef?.copySelectedBlocks()"
            @paste="blocklyRef?.pasteBlocks()"
            @clear-workspace="blocklyRef?.clearWorkspace()"
            @export="handleExport"
            @import="fileInputRef?.click()"
            @templates="() => {}"
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
