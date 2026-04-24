<template>
  <aside
    class="flex w-[22rem] shrink-0 flex-col border-l border-white/10 bg-slate-900 transition-all duration-200"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="border-b border-white/10 px-4 py-3">
      <div class="flex items-center gap-2 text-base font-bold text-white">
        <i-lucide-notebook-tabs class="text-sm text-blue-400" />
        기능 설명 리스트
      </div>
    </div>

    <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <div
        v-for="card in cards"
        :key="card.annotationId"
        class="rounded-xl border bg-slate-800/80 p-3 transition-colors"
        :class="[
          card.text.trim() ? 'border-white/10' : 'border-red-300/50',
          dragCardId === card.annotationId && 'cursor-grabbing opacity-40 scale-[0.98]',
          overCardId === card.annotationId && 'border-blue-400 bg-slate-700/80'
        ]"
        draggable="true"
        @dragstart="emit('update:dragCardId', card.annotationId)"
        @dragenter.prevent="emit('update:overCardId', card.annotationId)"
        @dragover.prevent
        @dragleave="emit('update:overCardId', null)"
        @drop.prevent="emit('moveCard', card.annotationId)"
        @dragend="handleDragEnd"
      >
        <div class="mb-2.5 flex items-center gap-2">
          <div
            class="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white"
          >
            {{ card.number }}
          </div>
          <div class="text-xs font-semibold text-white">STEP {{ card.number }}</div>
          <button
            type="button"
            class="btn btn-xs btn-ghost ml-auto text-rose-300 shadow-none hover:bg-transparent"
            @click="emit('removeAnno', card.annotationId)"
          >
            <i-lucide-trash-2 class="text-xs" />
          </button>
        </div>

        <input
          :value="card.text"
          type="text"
          class="input input-sm w-full border bg-slate-900/80 text-white shadow-none"
          :class="card.text.trim() ? 'border-white/10' : 'border-red-300/50'"
          placeholder="기능 설명을 입력하세요"
          @input="emit('setText', card.annotationId, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="border-t border-white/10 p-4">
      <button
        type="button"
        class="btn w-full border-0 bg-blue-900 text-white shadow-none hover:bg-blue-900"
        @click="emit('saveData')"
      >
        <i-lucide-save class="text-sm" />
        설명 저장하기
      </button>
    </div>
  </aside>

  <button
    type="button"
    class="absolute right-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
    :class="isOpen ? '-translate-x-[22rem]' : 'translate-x-0'"
    @click="emit('update:isOpen', !isOpen)"
  >
    <i-lucide-chevron-right v-if="isOpen" class="text-sm" />
    <i-lucide-chevron-left v-else class="text-sm" />
  </button>
</template>

<script setup lang="ts">
import type { Card } from '@/types'


defineProps<{
  isOpen: boolean
  cards: Card[]
  dragCardId: string | null
  overCardId: string | null
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'update:dragCardId': [value: string | null]
  'update:overCardId': [value: string | null]
  moveCard: [targetId: string]
  removeAnno: [annotationId: string]
  setText: [annotationId: string, text: string]
  saveData: []
}>()

const handleDragEnd = (): void => {
  emit('update:dragCardId', null)
  emit('update:overCardId', null)
}
</script>
