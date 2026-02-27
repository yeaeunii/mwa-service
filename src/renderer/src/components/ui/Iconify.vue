<template>
  <span class="inline-block">
    <Icon :icon="`${iconType}:${name}`" :style="{ fontSize: iconSize, color: color }" />
  </span>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: 'inherit'
  },
  type: {
    type: String,
    default: 'ic'
  },
  name: {
    type: String,
    default: 'sharp-home'
  },
  size: {
    type: String,
    default: 'md'
  }
})

const IconTypes: Record<string, string> = {
  ic: 'ic',
  msl: 'material-symbols-light',
  lmd: 'line-md',
  mdi: 'mdi',
  lc: 'lucide'
}

const IconSizes: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem'
}

const iconType = computed(() => {
  return IconTypes[props.type] || 'ic'
})

const iconSize = computed(() => {
  if (!props.size) {
    return props.size
  }

  return IconSizes[props.size as keyof typeof IconSizes] || props.size
})
</script>
