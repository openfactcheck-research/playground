<script setup lang="ts">
import type * as Blockly from 'blockly/core'
import { Copy, Info, Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { SCHEMA_FIELD } from '@/blockly/blocks/structuredOutput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type SchemaField = {
  id: string
  name: string
  description: string
  type: string
  asList: boolean
  children?: SchemaField[]
}

type EditingCell = { rowId: string, parentId?: string, col: 'name' } | null
type ExpandedDescKey = { rowId: string, parentId?: string } | null
type ExpandedPos = { top: number, left: number, width: number }

const props = defineProps<{ block: Blockly.Block }>()

// Auto-focus directive — focuses the element on mount
const vFocus = {
  mounted(el: HTMLElement) { el.focus() },
}

const TYPE_OPTIONS = ['str', 'int', 'float', 'bool', 'dict', 'list']
const CHILD_TYPE_OPTIONS = ['str', 'int', 'float', 'bool', 'list']

function makeRow(): SchemaField {
  return { id: crypto.randomUUID(), name: 'field', description: '', type: 'str', asList: false }
}

const rows = ref<SchemaField[]>([])
const selectedIds = reactive(new Set<string>())
const editingCell = ref<EditingCell>(null)
const expandedDescKey = ref<ExpandedDescKey>(null)
const expandedDescPos = ref<ExpandedPos | null>(null)

onMounted(() => {
  try {
    const json = props.block.getFieldValue(SCHEMA_FIELD)
    const saved = json ? JSON.parse(json) as SchemaField[] : null
    rows.value = saved && saved.length > 0 ? structuredClone(saved) : [makeRow()]
  }
  catch {
    rows.value = [makeRow()]
  }
})

onUnmounted(() => {
  expandedDescKey.value = null
})

function persist() {
  props.block.setFieldValue(JSON.stringify(rows.value), SCHEMA_FIELD)
}

// ---------------------------------------------------------------------------
// Row lookup helper
// ---------------------------------------------------------------------------

function getRow(id: string, parentId?: string): SchemaField | undefined {
  if (parentId) {
    return rows.value.find(r => r.id === parentId)?.children?.find(c => c.id === id)
  }
  return rows.value.find(r => r.id === id)
}

// ---------------------------------------------------------------------------
// Inline editing (name only)
// ---------------------------------------------------------------------------

function startEdit(rowId: string, parentId?: string) {
  editingCell.value = { rowId, parentId, col: 'name' }
}

function stopEdit() {
  editingCell.value = null
}

function isEditing(rowId: string, parentId?: string) {
  return editingCell.value?.rowId === rowId && editingCell.value?.parentId === parentId
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Escape')
    stopEdit()
}

// ---------------------------------------------------------------------------
// Expanded description editor
// ---------------------------------------------------------------------------

function openDescExpanded(rowId: string, e: MouseEvent, parentId?: string) {
  const cell = e.currentTarget as HTMLElement
  const rect = cell.getBoundingClientRect()
  const boxW = Math.max(rect.width, 240)
  const spaceBelow = window.innerHeight - rect.bottom
  const boxH = 120
  const top = spaceBelow > boxH + 12 ? rect.bottom + 4 : rect.top - boxH - 4
  expandedDescPos.value = { top, left: rect.left, width: boxW }
  expandedDescKey.value = { rowId, parentId }
}

function closeDescExpanded() {
  expandedDescKey.value = null
  expandedDescPos.value = null
}

const expandedDescStyle = computed(() =>
  expandedDescPos.value
    ? { top: `${expandedDescPos.value.top}px`, left: `${expandedDescPos.value.left}px`, width: `${expandedDescPos.value.width}px` }
    : {},
)

function expandedDescValue() {
  if (!expandedDescKey.value)
    return ''
  return getRow(expandedDescKey.value.rowId, expandedDescKey.value.parentId)?.description ?? ''
}

// ---------------------------------------------------------------------------
// Row selection
// ---------------------------------------------------------------------------

const allSelected = computed(() =>
  rows.value.length > 0 && rows.value.every(r =>
    selectedIds.has(r.id) && (r.children ?? []).every(c => selectedIds.has(c.id)),
  ),
)
const someSelected = computed(() => selectedIds.size > 0)

function rowChecked(row: SchemaField): boolean {
  if (!selectedIds.has(row.id))
    return false
  return (row.children ?? []).every(c => selectedIds.has(c.id))
}

function rowIndeterminate(row: SchemaField): boolean {
  if (!row.children?.length)
    return false
  const some = row.children.some(c => selectedIds.has(c.id))
  const all = row.children.every(c => selectedIds.has(c.id))
  return some && !all
}

function toggleAll(checked: boolean) {
  if (checked) {
    rows.value.forEach((r) => {
      selectedIds.add(r.id)
      r.children?.forEach(c => selectedIds.add(c.id))
    })
  }
  else {
    selectedIds.clear()
  }
}

function toggleRow(id: string, checked: boolean) {
  const row = rows.value.find(r => r.id === id)
  if (checked) {
    selectedIds.add(id)
    row?.children?.forEach(c => selectedIds.add(c.id))
  }
  else {
    selectedIds.delete(id)
    row?.children?.forEach(c => selectedIds.delete(c.id))
  }
}

function toggleChild(id: string, checked: boolean) {
  if (checked)
    selectedIds.add(id)
  else
    selectedIds.delete(id)
}

// ---------------------------------------------------------------------------
// Toolbar actions
// ---------------------------------------------------------------------------

function addRow() {
  rows.value.push(makeRow())
  persist()
}

function copySelected() {
  const copies = rows.value
    .filter(r => selectedIds.has(r.id))
    .map(r => ({ ...r, id: crypto.randomUUID(), children: r.children ? structuredClone(r.children).map(c => ({ ...c, id: crypto.randomUUID() })) : undefined }))
  rows.value.push(...copies)
  persist()
}

function deleteSelected() {
  rows.value.forEach((r) => {
    if (r.children) {
      r.children = r.children.filter(c => !selectedIds.has(c.id))
      if (r.children.length === 0)
        r.children.push(makeRow())
    }
  })
  rows.value = rows.value.filter(r => !selectedIds.has(r.id))
  selectedIds.clear()
  if (rows.value.length === 0)
    rows.value.push(makeRow())
  persist()
}

function resetRows() {
  rows.value = [makeRow()]
  selectedIds.clear()
  persist()
}

// ---------------------------------------------------------------------------
// Cell editing
// ---------------------------------------------------------------------------

function updateName(id: string, v: string, parentId?: string) {
  const row = getRow(id, parentId)
  if (row) {
    row.name = v
    persist()
  }
}

function updateDescription(id: string, v: string, parentId?: string) {
  const row = getRow(id, parentId)
  if (row) {
    row.description = v
    persist()
  }
}

function updateType(id: string, v: string, parentId?: string) {
  const row = getRow(id, parentId)
  if (!row)
    return
  const prev = row.type
  row.type = v
  if (v === 'dict' && prev !== 'dict') {
    row.children = [makeRow()]
  }
  else if (v !== 'dict' && prev === 'dict') {
    delete row.children
  }
  persist()
}

function updateAsList(id: string, v: boolean | 'indeterminate', parentId?: string) {
  const row = getRow(id, parentId)
  if (row) {
    row.asList = v === true
    persist()
  }
}

// ---------------------------------------------------------------------------
// Child row operations
// ---------------------------------------------------------------------------

function addChild(parentId: string) {
  const parent = rows.value.find(r => r.id === parentId)
  if (parent) {
    parent.children = parent.children ?? []
    parent.children.push(makeRow())
    persist()
  }
}
</script>

<template>
  <TooltipProvider>
    <div class="flex flex-1 flex-col min-h-0">
      <!-- Header -->
      <div class="mb-3">
        <p class="text-xs font-medium text-foreground">
          Output Schema
        </p>
        <p class="mt-0.5 text-[10px] text-muted-foreground/70">
          Define the structure and types for the model's output. Double-click a cell to edit.
        </p>
      </div>

      <!-- Table — scrollable -->
      <div class="mb-3 flex-1 overflow-auto min-h-0">
        <div class="overflow-hidden rounded-md border border-border">
          <Table class="table-fixed text-xs">
            <TableHeader>
              <TableRow class="bg-muted/40 hover:bg-muted/40">
                <TableHead class="w-8 px-2">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    class="size-3.5 cursor-pointer accent-primary"
                    @change="toggleAll(($event.target as HTMLInputElement).checked)"
                  >
                </TableHead>
                <TableHead class="w-[88px] px-1.5 py-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">Name</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Info :size="10" class="shrink-0 cursor-help text-muted-foreground/40" />
                      </TooltipTrigger>
                      <TooltipContent>Python identifier for the field</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead class="px-1.5 py-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">Description</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Info :size="10" class="shrink-0 cursor-help text-muted-foreground/40" />
                      </TooltipTrigger>
                      <TooltipContent>Human-readable description of the field</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead class="w-[72px] px-1.5 py-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">Type</span>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Info :size="10" class="shrink-0 cursor-help text-muted-foreground/40" />
                      </TooltipTrigger>
                      <TooltipContent>Python data type</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead class="w-[52px] px-1.5 py-2 text-center">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <div class="flex cursor-help items-center justify-center gap-1">
                        <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">List</span>
                        <Info :size="10" class="shrink-0 text-muted-foreground/40" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Wrap type in list[...]</TooltipContent>
                  </Tooltip>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <template v-for="row in rows" :key="row.id">
                <!-- Top-level row -->
                <TableRow :class="selectedIds.has(row.id) ? 'bg-primary/5' : ''">
                  <TableCell class="w-8 px-2">
                    <input
                      type="checkbox"
                      :checked="rowChecked(row)"
                      :indeterminate="rowIndeterminate(row)"
                      class="size-3.5 cursor-pointer accent-primary"
                      @change="toggleRow(row.id, ($event.target as HTMLInputElement).checked)"
                    >
                  </TableCell>

                  <TableCell
                    :class="isEditing(row.id) ? 'p-0' : 'px-2 py-1'"
                    @dblclick="startEdit(row.id)"
                  >
                    <Input
                      v-if="isEditing(row.id)"
                      v-focus
                      :model-value="row.name"
                      class="h-full w-full rounded-none border-0 bg-primary/10 px-2 font-mono text-[11px] shadow-none focus-visible:ring-0"
                      placeholder="name"
                      @update:model-value="updateName(row.id, String($event))"
                      @blur="stopEdit"
                      @keydown="handleKeydown"
                    />
                    <span v-else class="block cursor-text truncate font-mono text-[11px]">
                      {{ row.name || '—' }}
                    </span>
                  </TableCell>

                  <TableCell
                    class="cursor-text px-2 py-1"
                    @dblclick="openDescExpanded(row.id, $event)"
                  >
                    <span class="block truncate text-[11px] text-muted-foreground">
                      {{ row.description || '—' }}
                    </span>
                  </TableCell>

                  <TableCell class="p-0">
                    <select
                      :value="row.type"
                      class="h-full w-full appearance-none bg-transparent px-2 font-mono text-[11px] outline-none"
                      @change="updateType(row.id, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">
                        {{ t }}
                      </option>
                    </select>
                  </TableCell>

                  <TableCell class="px-1 py-1 text-center">
                    <Checkbox
                      :checked="row.asList"
                      @update:checked="(v: boolean | 'indeterminate') => updateAsList(row.id, v)"
                    />
                  </TableCell>
                </TableRow>

                <!-- Child rows when type is dict -->
                <template v-if="row.type === 'dict'">
                  <TableRow
                    v-for="child in (row.children ?? [])"
                    :key="child.id"
                    :class="selectedIds.has(child.id) ? 'bg-primary/5' : ''"
                  >
                    <TableCell class="w-8 px-2 pl-4">
                      <input
                        type="checkbox"
                        :checked="selectedIds.has(child.id)"
                        class="size-3.5 cursor-pointer accent-primary"
                        @change="toggleChild(child.id, ($event.target as HTMLInputElement).checked)"
                      >
                    </TableCell>

                    <TableCell
                      :class="isEditing(child.id, row.id) ? 'p-0' : 'px-2 py-1'"
                      @dblclick="startEdit(child.id, row.id)"
                    >
                      <Input
                        v-if="isEditing(child.id, row.id)"
                        v-focus
                        :model-value="child.name"
                        class="h-full w-full rounded-none border-0 bg-primary/10 px-2 font-mono text-[11px] shadow-none focus-visible:ring-0"
                        placeholder="name"
                        @update:model-value="updateName(child.id, String($event), row.id)"
                        @blur="stopEdit"
                        @keydown="handleKeydown"
                      />
                      <span v-else class="block cursor-text truncate font-mono text-[11px] text-muted-foreground">
                        {{ child.name || '—' }}
                      </span>
                    </TableCell>

                    <TableCell
                      class="cursor-text px-2 py-1"
                      @dblclick="openDescExpanded(child.id, $event, row.id)"
                    >
                      <span class="block truncate text-[11px] text-muted-foreground/70">
                        {{ child.description || '—' }}
                      </span>
                    </TableCell>

                    <TableCell class="p-0">
                      <select
                        :value="child.type"
                        class="h-full w-full appearance-none bg-transparent px-2 font-mono text-[11px] outline-none"
                        @change="updateType(child.id, ($event.target as HTMLSelectElement).value, row.id)"
                      >
                        <option v-for="t in CHILD_TYPE_OPTIONS" :key="t" :value="t">
                          {{ t }}
                        </option>
                      </select>
                    </TableCell>

                    <TableCell class="px-1 py-1 text-center">
                      <Checkbox
                        :checked="child.asList"
                        @update:checked="(v: boolean | 'indeterminate') => updateAsList(child.id, v, row.id)"
                      />
                    </TableCell>
                  </TableRow>

                  <!-- Add property row -->
                  <TableRow class="hover:bg-transparent">
                    <TableCell colspan="5" class="py-1 pl-7 pr-2">
                      <button
                        class="flex items-center gap-1 text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                        @click="addChild(row.id)"
                      >
                        <Plus :size="9" />
                        add property
                      </button>
                    </TableCell>
                  </TableRow>
                </template>
              </template>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon-sm" class="h-7 w-7" @click="addRow">
              <Plus :size="13" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add row</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon-sm"
              class="h-7 w-7"
              :disabled="!someSelected"
              @click="copySelected"
            >
              <Copy :size="13" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy selected</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="icon-sm"
              class="h-7 w-7 text-destructive hover:text-destructive"
              :disabled="!someSelected"
              @click="deleteSelected"
            >
              <Trash2 :size="13" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete selected</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon-sm" class="h-7 w-7" @click="resetRows">
              <RotateCcw :size="13" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset to default</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </TooltipProvider>

  <!-- Expanded description editor — teleported outside overflow container -->
  <Teleport to="body">
    <div
      v-if="expandedDescKey !== null"
      data-no-deselect
      class="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-ring bg-card shadow-xl"
      :style="expandedDescStyle"
    >
      <div class="flex items-center justify-between border-b border-border px-2 py-1">
        <span class="text-[10px] font-medium text-muted-foreground">Description</span>
        <span class="text-[10px] text-muted-foreground/50">Esc to close</span>
      </div>
      <textarea
        v-focus
        :value="expandedDescValue()"
        rows="5"
        class="w-full resize-none bg-transparent p-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50"
        placeholder="Describe this field…"
        @input="updateDescription(expandedDescKey!.rowId, ($event.target as HTMLTextAreaElement).value, expandedDescKey!.parentId)"
        @keydown.escape="closeDescExpanded"
        @blur="closeDescExpanded"
      />
    </div>
  </Teleport>
</template>
