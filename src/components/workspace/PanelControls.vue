<script setup lang="ts">
import type BlocklyWorkspace from './BlocklyWorkspace.vue'
import type { SelectedBlockInfo } from './BlocklyWorkspace.vue'
import { Lock, Puzzle, Snowflake } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LanguageModelControls from './controls/LanguageModelControls.vue'
import PromptTemplateControls from './controls/PromptTemplateControls.vue'
import StructuredOutputControls from './controls/StructuredOutputControls.vue'
import TextInputControls from './controls/TextInputControls.vue'

const props = defineProps<{
  selectedBlock: SelectedBlockInfo | null
  blocklyRef?: InstanceType<typeof BlocklyWorkspace> | null
}>()

const emit = defineEmits<{
  freeze: []
}>()

const resolvedBlock = computed(() => {
  if (!props.selectedBlock || !props.blocklyRef)
    return null
  return props.blocklyRef.getBlockById(props.selectedBlock.id)
})

function formatBlockType(type: string): string {
  return type
    .replace(/_block$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const panelEl = ref<HTMLElement>()

// Prevent Blockly's ShortcutRegistry from processing keyboard events
// (e.g. Delete/Backspace) while focus is inside this panel.
function stopKeyEvents(e: Event) {
  if (panelEl.value?.contains(e.target as Node))
    e.stopImmediatePropagation()
}

onMounted(() => {
  document.addEventListener('keydown', stopKeyEvents, true)
  document.addEventListener('keyup', stopKeyEvents, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', stopKeyEvents, true)
  document.removeEventListener('keyup', stopKeyEvents, true)
})
</script>

<template>
  <div
    ref="panelEl"
    data-no-deselect
    class="pointer-events-auto w-[33vw] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    @pointerdown.stop
  >
    <!-- Header -->
    <div class="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
      <Puzzle :size="14" class="shrink-0 text-muted-foreground" />
      <span class="text-xs font-medium text-muted-foreground">Block Controls</span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
      <div v-if="selectedBlock" class="flex flex-1 flex-col min-h-0">
        <p class="mb-0.5 text-[11px] text-muted-foreground/70">
          Block Type
        </p>
        <p class="mb-4 text-sm font-medium text-foreground">
          {{ formatBlockType(selectedBlock.blockType) }}
        </p>

        <!-- Block-specific controls -->
        <TextInputControls
          v-if="selectedBlock.blockType === 'text_input' && resolvedBlock"
          :block="resolvedBlock"
        />
        <LanguageModelControls
          v-else-if="selectedBlock.blockType === 'language_model' && resolvedBlock"
          :block="resolvedBlock"
        />
        <PromptTemplateControls
          v-else-if="selectedBlock.blockType === 'prompt_template' && resolvedBlock"
          :block="resolvedBlock"
        />
        <StructuredOutputControls
          v-else-if="selectedBlock.blockType === 'structured_output' && resolvedBlock"
          :block="resolvedBlock"
        />
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
        <Puzzle :size="40" :stroke-width="1.5" class="mb-3 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">
          Select a block to see controls
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="selectedBlock" class="shrink-0 border-t border-border px-3 py-2">
      <button
        class="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-secondary text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        :class="selectedBlock.frozen ? 'text-primary' : ''"
        @click="emit('freeze')"
      >
        <!-- Snowflake icon when frozen -->
        <template v-if="selectedBlock.frozen">
          <Snowflake :size="13" />
          Unfreeze Block
        </template>
        <!-- Lock icon when active -->
        <template v-else>
          <Lock :size="13" />
          Freeze Block
        </template>
      </button>
    </div>
  </div>
</template>
