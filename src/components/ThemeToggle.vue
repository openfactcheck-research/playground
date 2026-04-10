<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

defineProps<{
  showLabel?: boolean
}>()

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    :aria-label="isDark ? 'Light mode' : 'Dark mode'"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" :size="16" />
    <Moon v-else :size="16" />
    <span v-if="showLabel">{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
  </button>
</template>
