<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  verdict: 'true' | 'false' | 'partially-true' | 'unverified'
}>()

const badgeClasses = computed(() => {
  switch (props.verdict) {
    case 'true': return 'bg-emerald-500/15 text-emerald-400'
    case 'false': return 'bg-red-500/15 text-red-400'
    case 'partially-true': return 'bg-amber-500/15 text-amber-400'
    case 'unverified': return 'bg-zinc-500/15 text-zinc-400'
    default: return ''
  }
})

const label = computed(() => {
  switch (props.verdict) {
    case 'true': return 'True'
    case 'false': return 'False'
    case 'partially-true': return 'Partially True'
    case 'unverified': return 'Unverified'
    default: return ''
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="[
      badgeClasses,
    ]"
  >
    <svg v-if="verdict === 'true'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <svg v-else-if="verdict === 'false'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
    <svg v-else-if="verdict === 'partially-true'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    {{ label }}
  </span>
</template>
