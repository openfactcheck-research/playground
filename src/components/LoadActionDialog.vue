<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = defineProps<{
  /** Name of the item being loaded (e.g., template name or filename) */
  itemName?: string
  /** Optional title override */
  title?: string
}>()

const emit = defineEmits<{
  select: [action: 'new-tab' | 'replace']
}>()

const open = defineModel<boolean>('open', { default: false })

function handleAction(action: 'new-tab' | 'replace') {
  emit('select', action)
  open.value = false
}

function handleCancel() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ props.title || 'Load Pipeline' }}</DialogTitle>
        <DialogDescription>
          <template v-if="props.itemName">
            How would you like to load "{{ props.itemName }}"?
          </template>
          <template v-else>
            How would you like to load this pipeline?
          </template>
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3 py-4">
        <button
          type="button"
          class="flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="handleAction('new-tab')"
        >
          <svg class="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <div>
            <div class="font-medium">
              Create New Tab
            </div>
            <div class="text-sm text-muted-foreground">
              Open in a new workspace tab
            </div>
          </div>
        </button>

        <button
          type="button"
          class="flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="handleAction('replace')"
        >
          <svg class="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <div>
            <div class="font-medium">
              Replace Current
            </div>
            <div class="text-sm text-muted-foreground">
              Replace blocks in the current workspace
            </div>
          </div>
        </button>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
