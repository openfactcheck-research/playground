<script setup lang="ts">
import type { PipelineTemplate } from '@/data/pipelineTemplates'
import { computed, ref } from 'vue'
import LoadActionDialog from '@/components/LoadActionDialog.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PIPELINE_TEMPLATES } from '@/data/pipelineTemplates'

const emit = defineEmits<{
  select: [template: PipelineTemplate, action: 'new-tab' | 'replace']
}>()

const open = defineModel<boolean>('open', { default: false })

const selectedTemplate = ref<PipelineTemplate | null>(null)
const showActionDialog = ref(false)

const categories = computed(() => {
  const cats = new Map<string, PipelineTemplate[]>()
  for (const template of PIPELINE_TEMPLATES) {
    const list = cats.get(template.category) || []
    list.push(template)
    cats.set(template.category, list)
  }
  return cats
})

const categoryLabels: Record<string, string> = {
  basic: 'Basic Workflows',
  research: 'Research Templates',
}

// Icon paths for template icons
const iconPaths: Record<string, string> = {
  check: 'M20 6L9 17l-5-5',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
}

function handleTemplateClick(template: PipelineTemplate) {
  selectedTemplate.value = template
  showActionDialog.value = true
}

function handleActionSelect(action: 'new-tab' | 'replace') {
  if (selectedTemplate.value) {
    emit('select', selectedTemplate.value, action)
    selectedTemplate.value = null
    open.value = false
  }
}
</script>

<template>
  <!-- Main templates dialog -->
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Pipeline Templates</DialogTitle>
        <DialogDescription>
          Choose a pre-built pipeline to get started quickly
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto py-4">
        <div
          v-for="[category, templates] of categories"
          :key="category"
          class="mb-6 last:mb-0"
        >
          <h3 class="text-sm font-medium text-muted-foreground mb-3">
            {{ categoryLabels[category] || category }}
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="template of templates"
              :key="template.id"
              type="button"
              class="group relative flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              @click="handleTemplateClick(template)"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="size-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path :d="iconPaths[template.icon] || iconPaths.check" />
                </svg>
                <span class="font-medium">{{ template.name }}</span>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ template.description }}
              </p>
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Action selection dialog -->
  <LoadActionDialog
    v-model:open="showActionDialog"
    title="Load Template"
    :item-name="selectedTemplate?.name"
    @select="handleActionSelect"
  />
</template>
