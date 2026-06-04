<template>
  <div class="flex items-center gap-3">
    <div class="dropdown dropdown-bottom dropdown-start">
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1 border-none shadow-none hover:bg-primary/10 hover:text-primary"
      >
        <i-lucide-palette class="h-4 w-4" />
        <span
          class="h-3.5 w-3.5 rounded-full border border-base-content/10"
          :style="{ backgroundColor: colorValue }"
        ></span>
      </button>
      <div
        tabindex="0"
        class="dropdown-content z-50 mt-2 flex flex-col gap-1 rounded-lg border border-base-content/10 bg-base-100 p-2 shadow-xl"
      >
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          class="h-6 w-6 rounded-full border transition-transform hover:scale-110"
          :class="
            colorValue === color
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-base-content/10'
          "
          :style="{ backgroundColor: color }"
          :aria-label="`색상 ${color}`"
          @click="selectColor(color)"
        />
      </div>
    </div>

    <div class="h-4 w-px bg-base-content/10"></div>

    <div class="flex items-center gap-1">
      <button
        v-for="tool in toolItems"
        :key="tool.value"
        type="button"
        class="tooltip tooltip-neutral tooltip-bottom btn btn-xs gap-1 border-none shadow-none"
        :class="
          modelValue === tool.value
            ? 'btn-primary text-primary-content'
            : 'btn-ghost text-base-content/60 hover:bg-primary/10 hover:text-primary'
        "
        :data-tip="tool.tip"
        :title="tool.label"
        @click="toggleTool(tool.value)"
      >
        <span class="flex h-4 w-4 items-center justify-center">
          <i-mdi-numeric-1-circle-outline v-if="tool.value === 'number'" class="h-4 w-4" />
          <i-lucide-square v-else-if="tool.value === 'strokebox'" class="h-4 w-4" />
          <span
            v-else-if="tool.value === 'filled-box'"
            class="block h-3.5 w-3.5 rounded-[2px] bg-current"
          ></span>
          <i-lucide-square-dashed v-else-if="tool.value === 'dashed-box'" class="h-4 w-4" />
          <i-lucide-square-dashed v-else class="h-4 w-4" />
        </span>
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
  // label: string
  tip: string
}> = [
  { value: 'number', tip: '번호 마커' },
  { value: 'strokebox', tip: '테두리 박스' },
  { value: 'filled-box',  tip: '색상 박스' },
  { value: 'dashed-box', tip: '점선 박스' }
  // { value: 'mosaic' }
]

const props = defineProps<{
  modelValue: ToolMode
  colorValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ToolMode]
  'update:colorValue': [value: string]
  'select-color': [value: string]
}>()

const selectColor = (color: string): void => {
  const isSameColor = props.colorValue === color

  emit('update:colorValue', color)
  if (isSameColor) {
    emit('select-color', color)
  }
}

const toggleTool = (tool: ActiveToolMode): void => {
  emit('update:modelValue', props.modelValue === tool ? null : tool)
}
</script>
