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

const emit = defineEmits<{
  confirm: []
}>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Clear Workspace</DialogTitle>
        <DialogDescription>
          This will remove all blocks and notes from the current workspace. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button variant="destructive" class="hover:bg-destructive/70 dark:hover:bg-destructive/80" @click="emit('confirm')">
          Clear All
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
