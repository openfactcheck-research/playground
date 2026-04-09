import { ref } from 'vue'

export function useWorkspaceExportImport(
  getState: () => object | null,
  setState: (state: object) => void,
  getWorkspaceName: () => string,
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

  function handleImportAction(_action: 'new-tab' | 'replace'): void {
    if (!pendingImportData)
      return
    setState(pendingImportData.workspace)
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
