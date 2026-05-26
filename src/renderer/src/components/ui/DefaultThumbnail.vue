<template>
  <div class="flex items-center justify-center" :style="thumbnailStyle">
    <span class="text-sm font-black uppercase tracking-[0.18em]"> thumbnail </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number
}>()

const getHexColorById = (id: number): string => {
  const color = Math.floor(Math.abs(Math.sin(id) * 16777215))
    .toString(16)
    .padStart(6, '0')

  return `#${color}`
}

const getReadableTextColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '')
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness > 150 ? '#1f2937' : '#ffffff'
}

const thumbnailStyle = computed(() => {
  const backgroundColor = getHexColorById(props.id)

  return {
    backgroundColor,
    color: getReadableTextColor(backgroundColor)
  }
})
</script>
