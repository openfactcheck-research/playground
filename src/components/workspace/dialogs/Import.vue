<script setup lang="ts">
import type { Component } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
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
  icon: Component
}

defineProps<{
  itemName?: string
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
    icon: Plus,
  },
  {
    action: 'replace',
    label: 'Replace Current',
    description: 'Replace blocks in the current workspace',
    icon: RefreshCw,
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
          <component :is="item.icon" class="size-6 text-primary" />
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
