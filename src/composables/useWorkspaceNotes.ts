import { nanoid } from 'nanoid'
import { ref, watch } from 'vue'

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

// Light mode: TW[color][100] fills, TW[color][600] borders, TW[color][900] text
// — mirrors the light block palette (PALETTE_LIGHT = TW[c][200]).
// Dark mode colors are handled via CSS custom properties in StickyNote.vue.
export const NOTE_COLORS = {
  yellow: { fill: '#fde68a', border: '#fde68a' },
  gray: { fill: '#e4e4e7', border: '#e4e4e7' },
  pink: { fill: '#fecdd3', border: '#fecdd3' },
  blue: { fill: '#bfdbfe', border: '#bfdbfe' },
  green: { fill: '#d9f99d', border: '#d9f99d' },
  transparent: { fill: 'transparent', border: 'transparent' },
} as const

export type NoteColor = keyof typeof NOTE_COLORS

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

export type StickyNoteData = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: NoteColor
  text: string
}

const STORAGE_PREFIX = 'workspace-notes'

function storageKey(tabId: string): string {
  return `${STORAGE_PREFIX}-${tabId}`
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useWorkspaceNotes(workspaceId: () => string) {
  const notes = ref<StickyNoteData[]>([])

  function save(id?: string): void {
    const key = storageKey(id ?? workspaceId())
    localStorage.setItem(key, JSON.stringify(notes.value))
  }

  function load(id?: string): void {
    const key = storageKey(id ?? workspaceId())
    try {
      const raw = localStorage.getItem(key)
      notes.value = raw ? JSON.parse(raw) : []
    }
    catch {
      notes.value = []
    }
  }

  function addNote(wsX: number, wsY: number): string {
    const id = nanoid()
    notes.value.push({
      id,
      x: wsX,
      y: wsY,
      width: 250,
      height: 200,
      color: 'yellow',
      text: '',
    })
    save()
    return id
  }

  function deleteNote(id: string): void {
    notes.value = notes.value.filter(n => n.id !== id)
    save()
  }

  function updateNote(id: string, changes: Partial<StickyNoteData>): void {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      Object.assign(note, changes)
      save()
    }
  }

  // Tab switch: save old, load new
  watch(workspaceId, (newId, oldId) => {
    if (oldId) {
      save(oldId)
    }
    load(newId)
  })

  return { notes, addNote, deleteNote, updateNote, save, load }
}
