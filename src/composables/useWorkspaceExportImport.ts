import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { downloadJSON } from '@/lib/utils'

export function useWorkspaceExportImport(
  getState: () => object | null,
  setState: (state: object) => void,
  getWorkspaceName: () => string,
  onNewTab?: (workspace: object, name: string) => Promise<void>,
) {
  // Export
  const exportDialogOpen = ref(false)
  const exportFilename = ref('')
  let pendingExportData: object | null = null

  function handleExport(): void {
    const state = getState()
    if (!state)
      return
    const name = getWorkspaceName()
    pendingExportData = {
      version: 1,
      name,
      exportedAt: new Date().toISOString(),
      workspace: state,
    }
    exportFilename.value = name.replace(/\s+/g, '-').toLowerCase()
    exportDialogOpen.value = true
  }

  function confirmExport(): void {
    if (!pendingExportData || !exportFilename.value.trim())
      return
    downloadJSON(exportFilename.value.trim().replace(/\.json$/i, ''), pendingExportData)
    exportDialogOpen.value = false
    pendingExportData = null
  }

  // Import
  const importDialogOpen = ref(false)
  const importFileName = ref('')
  let pendingImportData: { workspace: object, name?: string } | null = null

  function handleImportFile(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file)
      return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.workspace) {
          toast.error('Invalid pipeline file: missing workspace data')
          return
        }
        pendingImportData = data
        importFileName.value = data.name || file.name.replace(/\.json$/i, '')
        importDialogOpen.value = true
      }
      catch {
        toast.error('Failed to import pipeline: invalid JSON')
      }
    }
    reader.readAsText(file)
    input.value = ''
  }

  async function handleImportAction(action: 'new-tab' | 'replace'): Promise<void> {
    if (!pendingImportData)
      return
    if (action === 'new-tab' && onNewTab) {
      await onNewTab(pendingImportData.workspace, pendingImportData.name || 'Imported Pipeline')
    }
    else {
      setState(pendingImportData.workspace)
    }
    pendingImportData = null
  }

  return {
    exportDialogOpen,
    exportFilename,
    handleExport,
    confirmExport,
    importDialogOpen,
    importFileName,
    handleImportFile,
    handleImportAction,
  }
}
