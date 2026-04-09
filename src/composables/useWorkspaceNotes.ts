import type { StickyNote } from '@/types/projects'
import { nanoid } from 'nanoid'
import { ref } from 'vue'

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

export type StickyNoteData = StickyNote & { color: NoteColor }

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useWorkspaceNotes(onSave: () => void) {
  const notes = ref<StickyNoteData[]>([])

  function loadNotes(data?: StickyNote[]): void {
    notes.value = (data ?? []).map(n => ({
      ...n,
      color: (n.color in NOTE_COLORS ? n.color : 'yellow') as NoteColor,
    }))
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
    onSave()
    return id
  }

  function deleteNote(id: string): void {
    notes.value = notes.value.filter(n => n.id !== id)
    onSave()
  }

  function updateNote(id: string, changes: Partial<StickyNoteData>): void {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      Object.assign(note, changes)
      onSave()
    }
  }

  return { notes, loadNotes, addNote, deleteNote, updateNote }
}
