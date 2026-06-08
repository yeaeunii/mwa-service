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

const getThumbnailColorById = (id: number): { background: string; content: string } => {
  const seed = Math.abs(id)
  const hue = Math.round((seed * 137.508) % 360)
  const saturation = 58 + (seed % 4) * 7
  const lightness = 42 + (seed % 5) * 6

  return {
    background: `hsl(${hue} ${saturation}% ${lightness}%)`,
    content: lightness > 58 ? 'black' : 'white'
  }
}

const thumbnailStyle = computed(() => {
  const color = getThumbnailColorById(props.id)

  return {
    backgroundColor: color.background,
    color: color.content
  }
})
</script>
