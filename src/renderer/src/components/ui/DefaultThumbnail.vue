<template>
  <div class="flex items-center justify-center px-5" :style="thumbnailStyle">
    <div class="max-w-[86%] text-center">
      <div
        class="break-words font-black"
        :class="label ? 'text-xl leading-tight' : 'text-sm uppercase tracking-[0.18em]'"
      >
        {{ label || 'thumbnail' }}
      </div>
      <p
        v-if="description"
        class="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed opacity-75"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: number
  label?: string
  description?: string
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
