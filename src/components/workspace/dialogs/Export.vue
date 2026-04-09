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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emit = defineEmits<{
  confirm: []
}>()
const open = defineModel<boolean>('open', { default: false })
const filename = defineModel<string>('filename', { default: '' })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Export Pipeline</DialogTitle>
        <DialogDescription>
          Enter a filename for your pipeline export.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="export-filename">Filename</Label>
          <div class="flex items-center gap-2">
            <Input
              id="export-filename"
              v-model="filename"
              placeholder="my-pipeline"
              class="flex-1"
              @keydown.enter="emit('confirm')"
            />
            <span class="text-sm text-muted-foreground">.json</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button @click="emit('confirm')">
          Export
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
