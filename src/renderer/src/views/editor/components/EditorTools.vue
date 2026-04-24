<template>
  <div class="pointer-events-auto absolute inset-x-0 top-4 z-10 flex justify-center px-6">
    <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral/95 px-3 py-2 text-neutral-content/70 shadow-lg">
      <div class="flex items-center gap-1.5 rounded-xl bg-black/20 px-2 py-1">
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
          :class="
            colorValue === color
              ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.2)]'
              : 'border-transparent'
          "
          :style="{ backgroundColor: color }"
          @click="emit('update:colorValue', color)"
        />
      </div>

      <div class="tabs tabs-box bg-transparent p-0">
      <button
        type="button"
        class="tab [--tab-bg:green]"
        :class="{ 'tab-active': modelValue === 'number' }"
        @click="emit('update:modelValue', modelValue === 'number' ? null : 'number')">
        NUMBER
      </button>
      <button
        type="button"
        class="tab [--tab-bg:green]"
        :class="{ 'tab-active': modelValue === 'strokebox' }"
        @click="emit('update:modelValue', modelValue === 'strokebox' ? null : 'strokebox')">
        STROKEBOX
      </button>

      <button
        type="button"
        class="tab [--tab-bg:green]"
        :class="{ 'tab-active': modelValue === 'filled-box' }"
        @click="emit('update:modelValue', modelValue === 'filled-box' ? null : 'filled-box')">
        FILLED BOX
      </button>

      <button
        type="button"
        class="tab [--tab-bg:green]"
        :class="{ 'tab-active': modelValue === 'mosaic' }"
        @click="emit('update:modelValue', modelValue === 'mosaic' ? null : 'mosaic')">
        MOSAIC
      </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolMode } from '@/types'

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

defineProps<{
  modelValue: ToolMode
  colorValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ToolMode]
  'update:colorValue': [value: string]
}>()


</script>
