<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
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

const props = defineProps<{
  title: string
  description?: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  confirm: [name: string]
}>()

const open = defineModel<boolean>('open', { default: false })
const name = ref('')
const inputRef = ref<InstanceType<typeof Input> | null>(null)

watch(open, (val) => {
  if (val) {
    name.value = ''
    nextTick(() => {
      (inputRef.value?.$el as HTMLInputElement)?.focus()
    })
  }
})

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed)
    return
  emit('confirm', trimmed)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription v-if="props.description">
          {{ props.description }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label>{{ props.label || 'Name' }}</Label>
          <Input
            ref="inputRef"
            v-model="name"
            :placeholder="props.placeholder || 'Enter a name...'"
            @keydown.enter="submit"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="!name.trim()" @click="submit">
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
