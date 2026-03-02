import type { WorkspaceTab } from '@/components/workspace/Tabs.vue'
import { ref, watch } from 'vue'

const TABS_STORAGE_KEY = 'blockly-workspace-tabs'
const ACTIVE_TAB_STORAGE_KEY = 'blockly-active-tab'
const MAX_TABS = 5

function loadTabs(): WorkspaceTab[] {
  try {
    const saved = localStorage.getItem(TABS_STORAGE_KEY)
    if (saved) {
      const tabs = JSON.parse(saved) as WorkspaceTab[]
      if (Array.isArray(tabs) && tabs.length > 0)
        return tabs
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
    if (saved && tabs.some(t => t.id === saved))
      return saved
  }
  catch {
    // Ignore errors
  }
  return tabs[0]!.id
}

export function useWorkspaceTabs() {
  const tabs = ref<WorkspaceTab[]>(loadTabs())
  const activeTabId = ref(loadActiveTabId(tabs.value))

  watch(tabs, val => localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(val)), { deep: true })
  watch(activeTabId, val => localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, val))

  function selectTab(tabId: string) {
    if (tabId !== activeTabId.value)
      activeTabId.value = tabId
  }

  function addTab() {
    if (tabs.value.length >= MAX_TABS)
      return
    const newTab: WorkspaceTab = {
      id: `workspace-${Date.now()}`,
      name: `Workspace ${tabs.value.length + 1}`,
    }
    localStorage.removeItem(`blockly-workspace-state-${newTab.id}`)
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
  }

  function closeTab(tabId: string) {
    const idx = tabs.value.findIndex(t => t.id === tabId)
    if (idx === -1)
      return
    localStorage.removeItem(`blockly-workspace-state-${tabId}`)
    tabs.value.splice(idx, 1)
    if (tabs.value.length === 0) {
      activeTabId.value = ''
      return
    }
    if (activeTabId.value === tabId)
      activeTabId.value = tabs.value[Math.min(idx, tabs.value.length - 1)]!.id
  }

  function renameTab(tabId: string, newName: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab)
      tab.name = newName
  }

  return {
    tabs,
    activeTabId,
    canAddTab: () => tabs.value.length < MAX_TABS,
    selectTab,
    addTab,
    closeTab,
    renameTab,
  }
}
