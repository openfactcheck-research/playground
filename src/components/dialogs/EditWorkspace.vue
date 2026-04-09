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
  locked: boolean
}>()

const emit = defineEmits<{
  save: [name: string, description: string, locked: boolean]
}>()

const open = defineModel<boolean>('open', { default: false })
const editName = ref('')
const editDescription = ref('')
const editLocked = ref(false)

watch(open, (val) => {
  if (val) {
    editName.value = props.name
    editDescription.value = props.description
    editLocked.value = props.locked
  }
})

function submit() {
  if (!editName.value.trim())
    return
  emit('save', editName.value.trim(), editDescription.value, editLocked.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Workspace Details</DialogTitle>
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
            rows="4"
            class="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Describe this workspace..."
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 text-sm font-medium">
              Lock Workspace
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <p class="text-xs text-muted-foreground">
              Lock your workspace to prevent edits or accidental changes.
            </p>
          </div>
          <button
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            :class="editLocked ? 'bg-primary' : 'bg-muted'"
            @click="editLocked = !editLocked"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              :class="editLocked ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
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
