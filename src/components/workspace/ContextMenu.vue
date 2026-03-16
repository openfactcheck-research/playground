<script setup lang="ts">
import type { Component } from 'vue'
import { AlignLeft, Ban, ChevronsDownUp, ChevronsUpDown, CircleHelp, Copy, LayoutGrid, MessageCircle, Redo2, Trash2, Undo2 } from 'lucide-vue-next'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type ContextMenuItem = {
  text: string
  enabled: boolean
  separator?: boolean
  callback: (e: Event) => void
}

const { items, x, y, visible } = defineProps<{
  items: ContextMenuItem[]
  x: number
  y: number
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(x)
const adjustedY = ref(y)

// Lucide icon components keyed by icon name
const icons: Record<string, Component> = {
  'duplicate': Copy,
  'comment': MessageCircle,
  'inline': AlignLeft,
  'collapse': ChevronsUpDown,
  'collapse-all': ChevronsUpDown,
  'expand-all': ChevronsDownUp,
  'disable': Ban,
  'delete': Trash2,
  'help': CircleHelp,
  'undo': Undo2,
  'redo': Redo2,
  'cleanup': LayoutGrid,
}

function getIcon(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes('duplicate'))
    return 'duplicate'
  if (lower.includes('comment'))
    return 'comment'
  if (lower.includes('inline'))
    return 'inline'
  if (lower.includes('collapse block') || lower.includes('expand block'))
    return 'collapse'
  if (lower.includes('collapse') && !lower.includes('block'))
    return 'collapse-all'
  if (lower.includes('expand') && !lower.includes('block'))
    return 'expand-all'
  if (lower.includes('disable') || lower.includes('enable'))
    return 'disable'
  if (lower.includes('delete'))
    return 'delete'
  if (lower === 'help')
    return 'help'
  if (lower.includes('undo'))
    return 'undo'
  if (lower.includes('redo'))
    return 'redo'
  if (lower.includes('clean up'))
    return 'cleanup'
  return null
}

function handleItemClick(item: ContextMenuItem, event: MouseEvent) {
  if (!item.enabled)
    return
  item.callback(event)
  emit('close')
}

function handleClickOutside(event: Event) {
  if (!visible)
    return
  if (menuRef.value && !menuRef.value.contains(event.target as Node))
    emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    emit('close')
}

watch(() => [visible, x, y], async () => {
  if (!visible)
    return
  adjustedX.value = x
  adjustedY.value = y
  await nextTick()
  if (!menuRef.value)
    return
  const rect = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (rect.right > vw)
    adjustedX.value = Math.max(4, vw - rect.width - 4)
  if (rect.bottom > vh)
    adjustedY.value = Math.max(4, vh - rect.height - 4)
}, { immediate: true })

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside, true)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside, true)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible && items.length > 0"
        ref="menuRef"
        class="context-menu"
        role="menu"
        :style="{ left: `${adjustedX}px`, top: `${adjustedY}px` }"
      >
        <template v-for="(item, index) in items" :key="index">
          <div v-if="item.separator" class="context-menu-separator" role="separator" />
          <button
            v-else
            role="menuitem"
            class="context-menu-item"
            :class="{
              'context-menu-item--disabled': !item.enabled,
              'context-menu-item--destructive': item.text.toLowerCase().includes('delete'),
            }"
            :disabled="!item.enabled"
            @click="handleItemClick(item, $event)"
          >
            <span class="context-menu-icon">
              <component
                :is="icons[getIcon(item.text)!]"
                v-if="getIcon(item.text)"
                :size="16"
              />
              <span v-else class="context-menu-icon-spacer" />
            </span>
            <span class="context-menu-label">{{ item.text }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 180px;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--popover);
  color: var(--popover-foreground);
  box-shadow:
    0 10px 38px -10px rgba(0, 0, 0, 0.35),
    0 10px 20px -15px rgba(0, 0, 0, 0.2);
}

.context-menu-separator {
  height: 1px;
  margin: 4px -4px;
  background: var(--border);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 5px;
  border: none;
  background: none;
  color: var(--popover-foreground);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.1s;
  text-align: left;
}

.context-menu-item:hover:not(:disabled) {
  background: var(--accent);
  color: var(--accent-foreground);
}

.context-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item--destructive {
  color: var(--destructive);
}

.context-menu-item--destructive:hover:not(:disabled) {
  background: color-mix(in oklch, var(--destructive) 12%, transparent);
  color: var(--destructive);
}

.context-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.context-menu-icon-spacer {
  width: 16px;
  height: 16px;
}

.context-menu-label {
  flex: 1;
}

.context-menu-enter-active {
  transition:
    opacity 0.12s ease-out,
    transform 0.12s ease-out;
}
.context-menu-leave-active {
  transition:
    opacity 0.08s ease-in,
    transform 0.08s ease-in;
}
.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
