<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

defineProps<{
  variant?: 'full' | 'square'
}>()

const { isDark } = useTheme()
</script>

<template>
  <img
    v-if="variant === 'square'"
    :src="isDark ? '/logo_sq_light.svg' : '/logo_sq_dark.svg'"
    alt="OpenFactCheck"
  >
  <img
    v-else
    :src="isDark ? '/logo_light.svg' : '/logo_dark.svg'"
    alt="OpenFactCheck"
  >
</template>
