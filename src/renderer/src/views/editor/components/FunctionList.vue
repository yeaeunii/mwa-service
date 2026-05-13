<template>
  <section
    class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-base-content/5 bg-base-100 xl:w-96"
  >
    <div
      class="flex items-center justify-between border-b border-base-content/5 bg-base-100 px-4 py-3"
    >
      <div class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <i-lucide-list-ordered class="h-4 w-4" />
        </div>
        <div>
          <p class="text-sm font-semibold leading-tight">기능 목록</p>
          <p class="text-xs text-base-content/50">문서 기능 설명을 정리하세요</p>
        </div>
      </div>
      <span class="badge badge-primary badge-soft badge-sm">{{ filteredItems.length }}개</span>
    </div>

    <div class="border-b border-base-content/5 bg-base-100 px-3 py-2.5">
      <div class="flex items-center gap-2">
        <label class="input input-sm flex-1">
          <i-lucide-search class="h-3.5 w-3.5 opacity-45" />
          <input v-model="searchQuery" type="search" placeholder="기능 설명 검색..." />
        </label>
      </div>
    </div>

    <div ref="funcListRef" class="flex-1 space-y-3 overflow-y-auto bg-base-200/40 p-3.5">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="group relative overflow-hidden rounded-xl border border-base-content/10 bg-base-100 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-within:border-primary/35 focus-within:shadow-md focus-within:ring-3 focus-within:ring-primary/20"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div
            class="badge badge-primary badge-soft gap-1 px-2.5 py-2 text-[11px] font-bold text-primary"
          >
            <i-lucide-hash class="h-3 w-3" />
            {{ item.orderNo }}
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square text-base-content/45 hover:bg-base-200 hover:text-base-content/75"
              @click="toggleExpanded(item.id)"
            >
              <i-lucide-chevron-down v-if="!isExpanded(item.id)" class="h-4 w-4" />
              <i-lucide-chevron-up v-else class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="drag-handle btn btn-ghost btn-xs btn-square cursor-grab text-base-content/35 transition-colors hover:bg-base-200 hover:text-base-content/70 active:cursor-grabbing active:bg-base-300"
            >
              <i-lucide-grip-vertical class="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          v-if="compactMode && !isExpanded(item.id)"
          type="button"
          class="line-clamp-2 min-h-10 w-full rounded-lg border border-base-content/8 bg-base-200/40 px-2.5 py-2 text-left text-xs leading-relaxed text-base-content/65 transition-colors hover:border-primary/20 hover:bg-base-200/60"
          @click="openItemEditor(item.id)"
        >
          {{ item.content || '아직 입력된 설명이 없습니다.' }}
        </button>
        <div v-else>
          <textarea
            v-model="item.content"
            rows="4"
            placeholder="기능 설명을 입력하세요"
            :data-editor-id="item.id"
            class="textarea textarea-sm min-h-24 w-full resize-none border-base-content/10 bg-base-100 text-sm leading-relaxed text-base-content/80 placeholder:text-base-content/35 focus:border-primary/30 focus:outline-none"
            @focus="selectItem(item.id)"
          />
        </div>
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
        <p class="text-sm font-semibold text-base-content/80">아직 등록된 기능이 없습니다</p>
        <p class="mt-1 text-xs text-base-content/50">
          기능 설명을 추가해 문서 단계를 정리해보세요.
        </p>
      </div>
      <div
        v-else-if="!filteredItems.length"
        class="flex min-h-44 flex-col items-center justify-center rounded-xl border border-base-content/10 bg-base-100/80 p-5 text-center"
      >
        <div
          class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-base-200 text-base-content/40"
        >
          <i-lucide-search-x class="h-4 w-4" />
        </div>
        <p class="text-sm font-medium text-base-content/70">검색 결과가 없습니다</p>
        <p class="mt-1 text-xs text-base-content/50">다른 키워드로 검색해보세요.</p>
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
const searchQuery = ref('')
const compactMode = ref(true)
const expandedItemIds = ref<string[]>([])
const funcListRef = ref<HTMLDivElement | null>(null)
let dragStartIds: string[] = []

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return localItems.value

  return localItems.value.filter((item) => item.content.toLowerCase().includes(query))
})

const isExpanded = (id: string): boolean => expandedItemIds.value.includes(id)

const selectItem = (id: string): void => {
  emit('select', id)
}

const toggleExpanded = (id: string): void => {
  selectItem(id)

  if (isExpanded(id)) {
    expandedItemIds.value = expandedItemIds.value.filter((itemId) => itemId !== id)
    return
  }

  expandedItemIds.value = [...expandedItemIds.value, id]
}

const focusEditor = (id: string): void => {
  const target = funcListRef.value?.querySelector(
    `textarea[data-editor-id="${id}"]`
  ) as HTMLTextAreaElement | null
  target?.focus()
}

const openItemEditor = (id: string): void => {
  selectItem(id)

  if (!isExpanded(id)) {
    expandedItemIds.value = [...expandedItemIds.value, id]
    void nextTick(() => {
      focusEditor(id)
    })
    return
  }

  focusEditor(id)
}

useDraggable(funcListRef, localItems, {
  handle: '.drag-handle',
  animation: 150,
  onStart: () => {
    dragStartIds = filteredItems.value.map((item) => item.id)
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
