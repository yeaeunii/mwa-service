<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-6">
    <div
      class="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 shadow-lg"
    >
      <button
        type="button"
        class="btn btn-sm h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
        @click="emit('zoomOut')"
      >
        <i-lucide-minus class="text-sm" />
      </button>
      <button
        type="button"
        class="btn btn-sm h-9 border-0 bg-slate-800 px-3 text-sm text-slate-100 shadow-none hover:bg-slate-700"
        @click="emit('resetZoom')"
      >
        {{ zoomPct }}%
      </button>
      <button
        type="button"
        class="btn btn-sm h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
        @click="emit('zoomIn')"
      >
        <i-lucide-plus class="text-sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  zoomPct: number
}>()

const emit = defineEmits<{
  zoomIn: []
  zoomOut: []
  resetZoom: []
}>()
</script>
