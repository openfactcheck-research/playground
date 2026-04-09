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

type LoadAction = {
  action: 'new-tab' | 'replace'
  label: string
  description: string
  icon: string
}

const { itemName, title } = defineProps<{
  /** Name of the item being loaded (e.g., template name or filename) */
  itemName?: string
  /** Optional title override */
  title?: string
}>()

const emit = defineEmits<{
  select: [action: 'new-tab' | 'replace']
}>()

const open = defineModel<boolean>('open', { default: false })

const actions: LoadAction[] = [
  {
    action: 'new-tab',
    label: 'Create New Tab',
    description: 'Open in a new workspace tab',
    icon: '<path d="M12 5v14M5 12h14"/>',
  },
  {
    action: 'replace',
    label: 'Replace Current',
    description: 'Replace blocks in the current workspace',
    icon: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>',
  },
]

function handleAction(action: 'new-tab' | 'replace') {
  emit('select', action)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title || 'Load Pipeline' }}</DialogTitle>
        <DialogDescription>
          {{ itemName ? `How would you like to load "${itemName}"?` : 'How would you like to load this pipeline?' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3 py-4">
        <button
          v-for="item in actions"
          :key="item.action"
          type="button"
          class="flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="handleAction(item.action)"
        >
          <svg class="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon" />
          <div>
            <div class="font-medium">
              {{ item.label }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ item.description }}
            </div>
          </div>
        </button>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
