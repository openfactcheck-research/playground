<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  name: string
  description: string
}>()

const emit = defineEmits<{
  save: [name: string, description: string]
}>()

const open = defineModel<boolean>('open', { default: false })
const editName = ref('')
const editDescription = ref('')

watch(open, (val) => {
  if (val) {
    editName.value = props.name
    editDescription.value = props.description
  }
})

function submit() {
  if (!editName.value.trim())
    return
  emit('save', editName.value.trim(), editDescription.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label>Name</Label>
          <Input v-model="editName" @keydown.enter="submit" />
        </div>
        <div class="grid gap-2">
          <Label>Description</Label>
          <textarea
            v-model="editDescription"
            rows="3"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Optional description..."
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="!editName.trim()" @click="submit">
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
