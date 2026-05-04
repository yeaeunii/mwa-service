<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-1.5">
      <button
        v-for="color in palette"
        :key="color"
        type="button"
        class="h-5 w-5 rounded-full border transition-transform hover:scale-110"
        :class="
          colorValue === color ? 'border-primary ring-2 ring-primary/20' : 'border-base-content/10'
        "
        :style="{ backgroundColor: color }"
        :aria-label="`색상 ${color}`"
        @click="emit('update:colorValue', color)"
      />
    </div>

    <div class="h-4 w-px bg-base-content/10"></div>

    <div class="flex items-center gap-1">
      <button
        v-for="tool in toolItems"
        :key="tool.value"
        type="button"
        class="btn btn-xs gap-1 border-none shadow-none"
        :class="
          modelValue === tool.value
            ? 'btn-primary text-primary-content'
            : 'btn-ghost text-base-content/60 hover:bg-primary/10 hover:text-primary'
        "
        :title="tool.label"
        @click="toggleTool(tool.value)"
      >
        <i-lucide-circle-plus v-if="tool.value === 'number'" class="h-3.5 w-3.5" />
        <i-lucide-square v-else-if="tool.value === 'strokebox'" class="h-3.5 w-3.5" />
        <span v-else-if="tool.value === 'filled-box'" class="h-3.5 w-3.5 rounded-[2px] bg-current"></span>
        <i-lucide-square-dashed v-else class="h-3.5 w-3.5" />
        <span>{{ tool.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolMode } from '@/types'

type ActiveToolMode = Exclude<ToolMode, null>

const palette = [
  '#fc5c65',
  '#fd9644',
  '#fed330',
  '#26de81',
  '#2bcbba',
  '#45aaf2',
  '#4b7bec',
  '#a55eea',
  '#d1d8e0',
  '#4b6584'
] as const

const toolItems: Array<{
  value: ActiveToolMode
  label: string
}> = [
  { value: 'number', label: '번호' },
  { value: 'strokebox', label: '테두리 박스' },
  { value: 'filled-box', label: '박스' },
  // { value: 'mosaic', label: '모자이크' }
]

const props = defineProps<{
  modelValue: ToolMode
  colorValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ToolMode]
  'update:colorValue': [value: string]
}>()

const toggleTool = (tool: ActiveToolMode): void => {
  emit('update:modelValue', props.modelValue === tool ? null : tool)
}
</script>
