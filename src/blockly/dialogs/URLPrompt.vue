<script setup lang="ts">
import { ref, watch } from 'vue'
import { resolvePrompt } from '@/blockly/dialogs/urlPromptBridge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fetchTextFromUrl } from '@/services/jina.service'

const open = defineModel<boolean>('open', { default: false })
const url = ref('')
const isFetching = ref(false)
const error = ref('')

watch(open, (val) => {
  if (val) {
    url.value = ''
    error.value = ''
  }
})

async function confirm() {
  const trimmed = url.value.trim()
  if (!trimmed)
    return

  isFetching.value = true
  error.value = ''

  try {
    const text = await fetchTextFromUrl(trimmed)
    resolvePrompt(text || null)
  }
  catch {
    error.value = 'Failed to fetch content from this URL.'
  }
  finally {
    isFetching.value = false
  }
}

function cancel() {
  resolvePrompt(null)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Fetch Text from URL</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col gap-2 py-4">
        <Input
          v-model="url"
          placeholder="https://example.com/article"
          :disabled="isFetching"
          @keydown.enter="confirm"
        />
        <p v-if="error" class="text-xs text-destructive">
          {{ error }}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" :disabled="isFetching" @click="cancel">
          Cancel
        </Button>
        <Button :disabled="!url.trim() || isFetching" @click="confirm">
          {{ isFetching ? 'Fetching…' : 'Fetch' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
