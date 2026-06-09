<template>
  <section
    class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-base-content/5 bg-base-100 xl:w-96"
  >
    <div
      class="flex min-h-[45px] items-center justify-between border-b border-base-content/5 bg-base-100 px-4 py-2"
    >
      <div class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <i-lucide-list-ordered class="h-4 w-4" />
        </div>
        <div>
          <p class="text-sm font-semibold leading-tight">기능 목록</p>
        </div>
      </div>
      <span class="badge badge-primary badge-soft badge-sm">{{ localItems.length }}개</span>
    </div>

    <div ref="funcListRef" class="flex-1 space-y-3 overflow-y-auto bg-base-200/40 p-3.5">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="group relative overflow-hidden rounded-lg border border-base-content/10 bg-base-100 p-2 shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary/35 focus-within:shadow-md focus-within:ring-3 focus-within:ring-primary/20"
      >
        <div class="mb-1.5 flex items-start justify-between gap-3">
          <div
            class="drag-handle badge badge-primary badge-soft cursor-grab gap-1 px-2 py-1.5 text-[11px] font-bold text-primary active:cursor-grabbing"
          >
            <i-lucide-hash class="h-3 w-3" />
            {{ item.orderNo }}
          </div>
        </div>

        <button
          v-if="editingItemId !== item.id"
          type="button"
          class="function-preview h-14 w-full rounded-md bg-base-200/50 px-2 py-1.5 text-left text-sm leading-5 text-base-content/80 transition-colors hover:bg-base-200/70"
          :class="!item.content ? 'text-base-content/30' : ''"
          @click="openEditor(item.id)"
        >
          {{ item.content || '기능 설명을 입력하세요' }}
        </button>
        <textarea
          v-else
          v-model="item.content"
          rows="4"
          placeholder="기능 설명을 입력하세요"
          :data-editor-id="item.id"
          class="textarea textarea-ghost h-24 min-h-0 w-full resize-none border-0 bg-base-200/50 px-2 py-1.5 text-sm leading-6 text-base-content/80 shadow-none placeholder:text-base-content/25 focus:outline-none"
          @blur="editingItemId = null"
          @focus="selectItem(item.id)"
        />
      </div>

      <div
        v-if="!localItems.length"
        class="flex min-h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-base-content/15 bg-base-100/70 p-6 text-center"
      >
        <div
          class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-base-200 text-base-content/50"
        >
          <i-lucide-list-plus class="h-5 w-5" />
        </div>
        <p class="text-sm font-semibold text-base-content/80">아직 작성된 기능이 없습니다</p>
        <p class="mt-1 text-xs text-base-content/50">
          번호 마커를 추가해 기능 설명을 정리해보세요.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface FunctionalityItem {
  id: string
  orderNo: number
  content: string
}

const props = defineProps<{
  items: FunctionalityItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  reorder: [payload: { visibleIds: string[] }]
}>()

const localItems = computed(() => props.items)
const funcListRef = ref<HTMLDivElement | null>(null)
const editingItemId = ref<string | null>(null)
let dragStartIds: string[] = []

const selectItem = (id: string): void => {
  emit('select', id)
}

const focusEditor = (id: string): void => {
  const target = funcListRef.value?.querySelector(
    `textarea[data-editor-id="${id}"]`
  ) as HTMLTextAreaElement | null
  target?.focus()
}

const openEditor = (id: string): void => {
  selectItem(id)
  editingItemId.value = id
  void nextTick(() => {
    focusEditor(id)
  })
}

useDraggable(funcListRef, localItems, {
  handle: '.drag-handle',
  animation: 150,
  onStart: () => {
    dragStartIds = localItems.value.map((item) => item.id)
  },
  customUpdate: (event) => {
    const { oldIndex, newIndex } = event
    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      oldIndex === newIndex ||
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return
    }

    const visibleIds = [...dragStartIds]
    const movedId = visibleIds.splice(oldIndex, 1)[0]
    if (!movedId) return

    visibleIds.splice(newIndex, 0, movedId)
    dragStartIds = []

    emit('reorder', { visibleIds })
  },
  onEnd: () => {
    dragStartIds = []
  }
})
</script>

<style scoped>
.function-preview {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
