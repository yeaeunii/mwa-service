<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="text-xs text-base-content/40">확대</span>
      <input
        :value="zoomPct"
        class="range range-xs range-primary w-32"
        type="range"
        :min="minPct"
        :max="maxPct"
        :step="stepPct"
        aria-label="확대"
        @input="onInput"
      />
      <span class="w-10 text-right text-xs tabular-nums text-base-content/60">
        {{ zoomLabel }}
      </span>
    </div>
    <div class="h-4 w-px bg-base-content/10"></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    zoomPct: number
    minPct?: number
    maxPct?: number
    stepPct?: number
  }>(),
  {
    minPct: 50,
    maxPct: 200,
    stepPct: 5
  }
)

const emit = defineEmits<{
  'update:zoomPct': [value: number]
  zoomChange: [value: number]
  zoomIn: []
  zoomOut: []
  resetZoom: []
}>()

const zoomLabel = computed(() => `${(props.zoomPct / 100).toFixed(2)}x`)

const onInput = (event: Event): void => {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:zoomPct', value)
  emit('zoomChange', value)
}
</script>
