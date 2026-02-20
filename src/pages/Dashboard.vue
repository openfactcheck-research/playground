<script setup lang="ts">
import type { PromptExpandEvent } from '@/blockly/events'
import type { FactCheckResults } from '@/components/FactCheckOutput.vue'
import type { WorkspaceTab } from '@/components/WorkspaceTabs.vue'
import type { PipelineTemplate } from '@/data/pipelineTemplates'
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BlocklyWorkspace from '@/components/BlocklyWorkspace.vue'
import CodeOutput from '@/components/CodeOutput.vue'
import FactCheckOutput from '@/components/FactCheckOutput.vue'
import Header from '@/components/Header.vue'
import LoadActionDialog from '@/components/LoadActionDialog.vue'
import PromptTemplateEditor from '@/components/PromptTemplateEditor.vue'
import Sidebar from '@/components/Sidebar.vue'
import TemplatesDialog from '@/components/TemplatesDialog.vue'
import TextEditor from '@/components/TextEditor.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WelcomeTour from '@/components/WelcomeTour.vue'
import WorkspaceTabs from '@/components/WorkspaceTabs.vue'
import { useAuth } from '@/composables/useAuth'
import { mockFactCheckResults } from '@/data/mockFactCheck'

const router = useRouter()
const { signOut } = useAuth()

const activeView = ref('workspace')
const editorText = ref('')
const factCheckResults = ref<FactCheckResults | null>(null)
const generatedCode = ref('')
const blockCount = ref(0)
const isRunning = ref(false)
const consoleOutput = ref<string[]>([])
const blocklyRef = ref<InstanceType<typeof BlocklyWorkspace> | null>(null)
const welcomeTourRef = ref<InstanceType<typeof WelcomeTour> | null>(null)
const workspaceCollapsed = ref(false)

// Prompt template editor dialog state
const promptEditorOpen = ref(false)
const promptEditorBlockId = ref<string | null>(null)
const promptEditorContent = ref('')

// Multi-workspace tab state - persisted to localStorage
const TABS_STORAGE_KEY = 'blockly-workspace-tabs'
const ACTIVE_TAB_STORAGE_KEY = 'blockly-active-tab'

function loadTabs(): WorkspaceTab[] {
  try {
    const saved = localStorage.getItem(TABS_STORAGE_KEY)
    if (saved) {
      const tabs = JSON.parse(saved) as WorkspaceTab[]
      if (Array.isArray(tabs) && tabs.length > 0) {
        return tabs
      }
    }
  }
  catch {
    // Ignore parse errors
  }
  return [{ id: 'workspace-1', name: 'Workspace 1' }]
}

function loadActiveTabId(tabs: WorkspaceTab[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
    if (saved && tabs.some(t => t.id === saved)) {
      return saved
    }
  }
  catch {
    // Ignore errors
  }
  return tabs[0]!.id
}

const workspaceTabs = ref<WorkspaceTab[]>(loadTabs())
const activeTabId = ref(loadActiveTabId(workspaceTabs.value))

// Persist tabs to localStorage whenever they change
watch(workspaceTabs, (tabs) => {
  localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs))
}, { deep: true })

// Persist active tab ID
watch(activeTabId, (tabId) => {
  localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabId)
})

function handleTabSelect(tabId: string) {
  if (tabId === activeTabId.value)
    return
  // Just update the active tab - BlocklyWorkspace will handle save/load via watch
  activeTabId.value = tabId
}

function handleTabAdd() {
  if (workspaceTabs.value.length >= 5)
    return
  // Use timestamp to avoid colliding with old localStorage data
  const newTab: WorkspaceTab = {
    id: `workspace-${Date.now()}`,
    name: `Workspace ${workspaceTabs.value.length + 1}`,
  }
  // Clear any existing localStorage for this ID (shouldn't exist, but be safe)
  localStorage.removeItem(`blockly-workspace-state-${newTab.id}`)

  workspaceTabs.value.push(newTab)
  // The watch in BlocklyWorkspace will handle saving current state and loading new (empty) workspace
  activeTabId.value = newTab.id
}

function handleTabClose(tabId: string) {
  const idx = workspaceTabs.value.findIndex(t => t.id === tabId)
  if (idx === -1 || workspaceTabs.value.length <= 1)
    return

  // Remove workspace state from localStorage
  localStorage.removeItem(`blockly-workspace-state-${tabId}`)

  workspaceTabs.value.splice(idx, 1)

  // If closing active tab, switch to an adjacent tab
  if (activeTabId.value === tabId) {
    const newIdx = Math.min(idx, workspaceTabs.value.length - 1)
    // The watch in BlocklyWorkspace will handle save/load
    activeTabId.value = workspaceTabs.value[newIdx]!.id
  }
}

function handleTabRename(tabId: string, newName: string) {
  const tab = workspaceTabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.name = newName
  }
}

function onCodeChange(code: string) {
  generatedCode.value = code
}

function onBlockCountChange(count: number) {
  blockCount.value = count
}

function handleRun() {
  isRunning.value = true
  consoleOutput.value = []

  // Run generated Blockly code
  try {
    // eslint-disable-next-line no-console -- capturing console output from user code
    const originalLog = console.log
    const logs: string[] = []
    // eslint-disable-next-line no-console -- redirecting console for user code execution
    console.log = (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
      originalLog(...args)
    }
    // eslint-disable-next-line no-new-func -- required to execute user-generated Blockly code
    const fn = new Function(generatedCode.value)
    fn()
    // eslint-disable-next-line no-console -- restoring console after user code execution
    console.log = originalLog
    consoleOutput.value = logs.length ? logs : ['Program executed successfully.']
  }
  catch (e: unknown) {
    const error = e as Error
    consoleOutput.value = [`Error: ${error.message}`]
  }

  // Simulate fact-check pipeline with mock data
  // (will be replaced with real API calls later)
  setTimeout(() => {
    factCheckResults.value = mockFactCheckResults
    workspaceCollapsed.value = true
    isRunning.value = false
  }, 600)
}

async function toggleWorkspace() {
  workspaceCollapsed.value = !workspaceCollapsed.value
  if (!workspaceCollapsed.value) {
    await nextTick()
    blocklyRef.value?.resize()
  }
}

async function handleLogout() {
  await signOut()
  router.push('/login')
}

async function handleClear() {
  factCheckResults.value = null
  consoleOutput.value = []
  workspaceCollapsed.value = false
  await nextTick()
  blocklyRef.value?.resize()
}

function handleUndo() {
  if (blocklyRef.value) {
    blocklyRef.value.undo()
  }
}

function handleRedo() {
  if (blocklyRef.value) {
    blocklyRef.value.redo()
  }
}

function handleClearWorkspace() {
  if (blocklyRef.value) {
    blocklyRef.value.clearWorkspace()
  }
}

function handlePromptExpand(data: PromptExpandEvent) {
  promptEditorBlockId.value = data.blockId
  promptEditorContent.value = data.templateContent
  promptEditorOpen.value = true
}

function handlePromptEditorSave() {
  if (blocklyRef.value && promptEditorBlockId.value) {
    blocklyRef.value.updatePromptTemplate(promptEditorBlockId.value, promptEditorContent.value)
  }
  promptEditorOpen.value = false
  promptEditorBlockId.value = null
}

function handleCopy() {
  if (blocklyRef.value) {
    blocklyRef.value.copySelectedBlocks()
  }
}

function handlePaste() {
  if (blocklyRef.value) {
    blocklyRef.value.pasteBlocks()
  }
}

// Export/Import functionality
const fileInputRef = ref<HTMLInputElement | null>(null)
const exportDialogOpen = ref(false)
const exportFilename = ref('')
let pendingExportData: object | null = null

// Templates dialog
const templatesDialogOpen = ref(false)

// Import dialog state
const importDialogOpen = ref(false)
const importFileName = ref('')
let pendingImportData: { workspace: object, name?: string } | null = null

function handleTemplateSelect(template: PipelineTemplate, action: 'new-tab' | 'replace') {
  if (action === 'new-tab') {
    // Create new tab with template
    if (workspaceTabs.value.length >= 5) {
      return
    }
    const newTab: WorkspaceTab = {
      id: `workspace-${Date.now()}`,
      name: template.name,
    }
    workspaceTabs.value.push(newTab)
    // Set the template state for the new workspace (watcher persists tabs automatically)
    localStorage.setItem(`blockly-workspace-state-${newTab.id}`, JSON.stringify(template.state))
    activeTabId.value = newTab.id
  }
  else {
    // Replace current workspace
    blocklyRef.value?.setState(template.state as any)
  }
}

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

  // Pre-fill filename with tab name
  exportFilename.value = (activeTab?.name || 'pipeline').replace(/\s+/g, '-').toLowerCase()
  exportDialogOpen.value = true
}

function confirmExport() {
  if (!pendingExportData || !exportFilename.value.trim())
    return

  const json = JSON.stringify(pendingExportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const filename = `${exportFilename.value.trim().replace(/\.json$/i, '')}.json`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  exportDialogOpen.value = false
  pendingExportData = null
}

function handleImportClick() {
  fileInputRef.value?.click()
}

function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)

      if (!data.workspace) {
        // eslint-disable-next-line no-alert
        alert('Invalid pipeline file: missing workspace data')
        return
      }

      // Store the parsed data and show action dialog
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

  // Reset input so same file can be imported again
  input.value = ''
}

function handleImportAction(action: 'new-tab' | 'replace') {
  if (!pendingImportData)
    return

  if (action === 'new-tab') {
    // Create new tab with imported pipeline
    if (workspaceTabs.value.length >= 5) {
      pendingImportData = null
      return
    }
    const newTab: WorkspaceTab = {
      id: `workspace-${Date.now()}`,
      name: importFileName.value || 'Imported Pipeline',
    }
    workspaceTabs.value.push(newTab)
    localStorage.setItem(`blockly-workspace-state-${newTab.id}`, JSON.stringify(pendingImportData.workspace))
    activeTabId.value = newTab.id
  }
  else {
    // Replace current workspace
    blocklyRef.value?.setState(pendingImportData.workspace as any)
  }

  pendingImportData = null
}
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
    <!-- Hidden file input for import -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleImportFile"
    >

    <!-- Export dialog -->
    <Dialog v-model:open="exportDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Pipeline</DialogTitle>
          <DialogDescription>
            Enter a filename for your pipeline export.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="export-filename">Filename</Label>
            <div class="flex items-center gap-2">
              <Input
                id="export-filename"
                v-model="exportFilename"
                placeholder="my-pipeline"
                class="flex-1"
                @keydown.enter="confirmExport"
              />
              <span class="text-sm text-muted-foreground">.json</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="exportDialogOpen = false">
            Cancel
          </Button>
          <Button @click="confirmExport">
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Templates dialog -->
    <TemplatesDialog
      v-model:open="templatesDialogOpen"
      @select="handleTemplateSelect"
    />

    <!-- Import action dialog -->
    <LoadActionDialog
      v-model:open="importDialogOpen"
      title="Import Pipeline"
      :item-name="importFileName"
      @select="handleImportAction"
    />

    <!-- Prompt template editor dialog -->
    <Dialog v-model:open="promptEditorOpen">
      <DialogContent class="flex h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Edit Prompt Template</DialogTitle>
          <DialogDescription>
            Edit your prompt template. Use &#123;&#123;variable&#125;&#125; syntax for placeholders.
          </DialogDescription>
        </DialogHeader>
        <div class="flex min-h-0 flex-1 py-4">
          <PromptTemplateEditor v-model="promptEditorContent" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="promptEditorOpen = false">
            Cancel
          </Button>
          <Button @click="handlePromptEditorSave">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <WelcomeTour ref="welcomeTourRef" />
    <Header
      :active-view="activeView"
      @run="handleRun"
      @clear="handleClear"
      @logout="handleLogout"
      @help="welcomeTourRef?.show()"
    />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        :active-view="activeView"
        @change-view="activeView = $event"
      />
      <main class="flex flex-1 flex-col overflow-hidden">
        <div data-tour="statement">
          <TextEditor v-model="editorText" />
        </div>
        <!-- Blockly section -->
        <div data-tour="workspace" class="flex flex-col overflow-hidden" :class="workspaceCollapsed ? '' : 'flex-1'">
          <!-- Blockly section header (always visible) -->
          <div class="flex shrink-0 items-center border-y border-border bg-card">
            <button
              class="group flex flex-1 items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30"
              @click="toggleWorkspace"
            >
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="shrink-0 text-primary"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
              <span class="text-sm font-semibold text-foreground">Blockly Workspace</span>
              <span class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">{{ blockCount }} blocks</span>
            </button>
            <!-- Add workspace button -->
            <button
              v-if="workspaceTabs.length < 5"
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Add workspace (max 5)"
              @click.stop="handleTabAdd"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <!-- Undo button -->
            <button
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Undo"
              aria-label="Undo"
              @click.stop="handleUndo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <!-- Redo button -->
            <button
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Redo"
              aria-label="Redo"
              @click.stop="handleRedo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
            <!-- Copy button -->
            <button
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Copy selected block (works across tabs)"
              aria-label="Copy"
              @click.stop="handleCopy"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <!-- Paste button -->
            <button
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Paste blocks from clipboard"
              aria-label="Paste"
              @click.stop="handlePaste"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </button>
            <!-- Clear workspace button -->
            <button
              class="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Clear all blocks"
              aria-label="Clear workspace"
              @click.stop="handleClearWorkspace"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <!-- Separator -->
            <div class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <!-- Export button -->
            <button
              class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Export pipeline as JSON"
              aria-label="Export pipeline"
              @click.stop="handleExport"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Export</span>
            </button>
            <!-- Import button -->
            <button
              class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Import pipeline from JSON"
              aria-label="Import pipeline"
              @click.stop="handleImportClick"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Import</span>
            </button>
            <!-- Templates button -->
            <button
              class="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Browse pipeline templates"
              aria-label="Pipeline templates"
              @click.stop="templatesDialogOpen = true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Templates</span>
            </button>
            <!-- Collapse/expand button -->
            <button
              class="flex shrink-0 items-center justify-center px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/30"
              @click="toggleWorkspace"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="transition-transform duration-200"
                :class="workspaceCollapsed ? '' : 'rotate-180'"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <!-- Workspace tabs -->
          <WorkspaceTabs
            v-if="!workspaceCollapsed"
            :tabs="workspaceTabs"
            :active-tab-id="activeTabId"
            @select="handleTabSelect"
            @close="handleTabClose"
            @rename="handleTabRename"
          />

          <!-- Blockly workspace + code panel -->
          <div v-if="!workspaceCollapsed" class="flex flex-1 overflow-hidden">
            <div class="relative flex-1 overflow-hidden">
              <BlocklyWorkspace
                ref="blocklyRef"
                :workspace-id="activeTabId"
                :input-text="editorText"
                @code-change="onCodeChange"
                @block-count-change="onBlockCountChange"
                @prompt-expand="handlePromptExpand"
              />
            </div>
            <CodeOutput
              :code="generatedCode"
              :is-running="isRunning"
              :console-output="consoleOutput"
            />
          </div>
        </div>
        <FactCheckOutput :results="factCheckResults" data-tour="results" />
      </main>
    </div>
  </div>
</template>
