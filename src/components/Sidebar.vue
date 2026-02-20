<script setup lang="ts">
import { h, ref } from 'vue'

defineProps<{
  activeView: string
}>()

defineEmits<{
  changeView: [view: string]
}>()

const isExpanded = ref(false)

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

const ChevronIcon = {
  props: ['expanded'],
  render(this: { expanded: boolean }) {
    return h('svg', {
      'width': 16,
      'height': 16,
      'viewBox': '0 0 24 24',
      'fill': 'none',
      'stroke': 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'class': 'transition-transform duration-200',
      'style': this.expanded ? 'transform: rotate(180deg)' : '',
    }, [
      h('path', { d: 'M9 18l6-6-6-6' }),
    ])
  },
}

const topNavItems = [
  { id: 'workspace', label: 'Workspace', icon: WorkspaceIcon },
]

const bottomNavItems = [
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]
</script>

<template>
  <aside
    class="flex flex-col border-r border-border bg-card py-4 transition-all duration-200"
    :class="isExpanded ? 'w-48' : 'w-16'"
  >
    <!-- Top nav items -->
    <div class="flex flex-col gap-2 px-3">
      <button
        v-for="item in topNavItems"
        :key="item.id"
        class="flex h-10 items-center gap-3 rounded-lg px-2 transition-colors"
        :class="[
          activeView === item.id
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
          isExpanded ? 'justify-start' : 'justify-center',
        ]"
        :title="isExpanded ? undefined : item.label"
        :aria-label="item.label"
        @click="$emit('changeView', item.id)"
      >
        <component :is="item.icon" class="shrink-0" />
        <span v-if="isExpanded" class="text-sm font-medium truncate">{{ item.label }}</span>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Bottom nav items -->
    <div class="flex flex-col gap-2 px-3">
      <button
        v-for="item in bottomNavItems"
        :key="item.id"
        class="flex h-10 items-center gap-3 rounded-lg px-2 transition-colors"
        :class="[
          activeView === item.id
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
          isExpanded ? 'justify-start' : 'justify-center',
        ]"
        :title="isExpanded ? undefined : item.label"
        :aria-label="item.label"
        @click="$emit('changeView', item.id)"
      >
        <component :is="item.icon" class="shrink-0" />
        <span v-if="isExpanded" class="text-sm font-medium truncate">{{ item.label }}</span>
      </button>

      <!-- Toggle button -->
      <button
        class="flex h-10 items-center gap-3 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        :class="isExpanded ? 'justify-start' : 'justify-center'"
        :title="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
        aria-label="Toggle sidebar"
        @click="isExpanded = !isExpanded"
      >
        <ChevronIcon :expanded="isExpanded" class="shrink-0" />
        <span v-if="isExpanded" class="text-sm font-medium">Collapse</span>
      </button>
    </div>
  </aside>
</template>
