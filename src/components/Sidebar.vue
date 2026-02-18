<script setup lang="ts">
import { h } from 'vue'

defineProps<{
  activeView: string
}>()

defineEmits<{
  changeView: [view: string]
}>()

const WorkspaceIcon = {
  render() {
    return h('svg', { 'width': 20, 'height': 20, 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
      h('path', { d: 'M3 9h18' }),
      h('path', { d: 'M9 21V9' }),
    ])
  },
}

const SettingsIcon = {
  render() {
    return h('svg', { 'width': 20, 'height': 20, 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
      h('circle', { cx: 12, cy: 12, r: 3 }),
    ])
  },
}

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: WorkspaceIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]
</script>

<template>
  <aside class="flex w-16 flex-col items-center border-r border-border bg-card py-4 gap-2">
    <button
      v-for="item in navItems"
      :key="item.id"
      class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors" :class="[
        activeView === item.id
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
      ]"
      :title="item.label"
      :aria-label="item.label"
      @click="$emit('changeView', item.id)"
    >
      <component :is="item.icon" />
    </button>
  </aside>
</template>
