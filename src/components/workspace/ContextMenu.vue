<script setup lang="ts">
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

// SVG inner content keyed by icon name
const icons: Record<string, string> = {
  'duplicate': '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  'comment': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'inline': '<path d="M21 6H3"/><path d="M15 12H3"/><path d="M17 18H3"/>',
  'collapse': '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
  'collapse-all': '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
  'expand-all': '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  'disable': '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  'delete': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'undo': '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  'redo': '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
  'cleanup': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
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
              <svg
                v-if="getIcon(item.text)"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                v-html="icons[getIcon(item.text)!]"
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
