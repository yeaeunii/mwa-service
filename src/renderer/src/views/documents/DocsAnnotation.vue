<template>
  <div class="drawer drawer-end">
    <input id="mainDrawer" v-model="openDrawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex h-screen flex-col">
      <!-- Navbar -->
      <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
        <div class="flex flex-1 items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="$router.back()">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <i-lucide-pencil-ruler class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-sm font-bold leading-tight">AI 마켓 솔루션 구매</div>
              <div class="flex items-center gap-1.5 text-xs text-base-content/50">
                <template v-if="isSaving">
                  <i-lucide-loader-circle class="h-3 w-3 animate-spin" />
                  저장중...
                </template>
                <template v-else>
                  <i-lucide-check-circle class="h-3 w-3 text-success" />
                  방금전 저장됨
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <label for="mainDrawer" class="btn btn-ghost btn-sm gap-1.5">
            문서목록
            <i-lucide-panel-right-open class="h-4 w-4" />
          </label>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left: Image Editor -->
        <section class="flex flex-1 flex-col overflow-hidden border-r border-base-content/5">
          <!-- Toolbar -->
          <div
            class="flex items-center justify-between border-b border-base-content/5 bg-base-100 px-4 py-2"
          >
            <div class="flex items-center gap-2">
              <i-lucide-image class="h-4 w-4 text-primary" />
              <span class="text-sm font-semibold">캡쳐 화면</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs text-base-content/40">확대</span>
                <input
                  v-model.number="zoom"
                  class="range range-xs range-primary w-32"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                />
                <span class="w-10 text-right text-xs tabular-nums text-base-content/60">
                  {{ zoom.toFixed(2) }}x
                </span>
              </div>
              <div class="h-4 w-px bg-base-content/10"></div>
              <div class="flex items-center gap-1">
                <button type="button" class="btn btn-ghost btn-xs gap-1">
                  <i-lucide-rotate-ccw class="h-3.5 w-3.5" />
                  회전
                </button>
                <button type="button" class="btn btn-ghost btn-xs gap-1 text-error">
                  <i-lucide-eraser class="h-3.5 w-3.5" />
                  초기화
                </button>
              </div>
            </div>
          </div>

          <!-- Canvas Area -->
          <div class="flex-1 overflow-auto bg-base-200 p-4">
            <div
              class="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-base-content/10 bg-base-100/50 transition-colors hover:border-primary/30"
            >
              <div class="flex flex-col items-center gap-3 text-base-content/30">
                <i-lucide-image-plus class="h-12 w-12" />
                <span class="text-sm font-medium">이미지를 선택해 주세요</span>
                <button class="btn btn-primary btn-sm btn-outline gap-1.5">
                  <i-lucide-upload class="h-3.5 w-3.5" />
                  파일 선택
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Right: Step List -->
        <section class="flex w-80 shrink-0 flex-col overflow-hidden bg-base-100 xl:w-96">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-base-content/5 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <i-lucide-list-ordered class="h-4 w-4 text-primary" />
              <span class="text-sm font-semibold">기능 목록</span>
              <span class="badge badge-sm badge-ghost">{{ funcItems.length }}</span>
            </div>
          </div>

          <!-- Step Items -->
          <div ref="funcListRef" class="flex-1 space-y-2 overflow-y-auto p-3">
            <div
              v-for="item in funcItems"
              :key="item.id"
              class="group relative rounded-lg border-2 border-base-content/10 bg-base-100 transition-all has-[:focus]:border-primary has-[:focus]:ring-2 has-[:focus]:ring-primary/15 has-[:focus]:shadow-sm"
            >
              <!-- Number Badge + Drag Handle -->
              <div
                class="drag-handle absolute left-0 top-0 z-10 flex cursor-grab items-center gap-0.5 rounded-br-lg rounded-tl-md bg-base-200 px-1 py-0.5 transition-colors group-has-[:focus]:bg-primary group-has-[:focus]:text-white active:cursor-grabbing"
              >
                <i-lucide-grip-vertical class="h-3 w-3 opacity-40 group-has-[:focus]:opacity-70" />
                <span class="text-xs font-bold leading-none">{{ item.orderNo }}</span>
              </div>

              <!-- Textarea -->
              <div class="px-3 pb-3 pt-7">
                <textarea
                  v-model="item.content"
                  rows="3"
                  placeholder="기능 설명을 입력하세요"
                  class="textarea textarea-ghost w-full resize-none text-sm leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Drawer Sidebar -->
    <div class="drawer-side z-30">
      <label
        for="mainDrawer"
        aria-label="close sidebar"
        class="drawer-overlay backdrop-blur-[2px]"
      ></label>
      <div class="flex h-full w-72 flex-col bg-base-100 border-l border-base-content/10">
        <!-- Sidebar Header -->
        <div class="flex items-center justify-between border-b border-base-content/5 px-4 py-3">
          <div class="flex items-center gap-2">
            <i-lucide-layers class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">문서 목록</span>
            <span class="badge badge-sm badge-ghost">10</span>
          </div>
        </div>

        <!-- Search -->
        <div class="px-3 py-2">
          <label class="input input-sm w-full">
            <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
            <input type="search" placeholder="문서 검색..." />
          </label>
        </div>

        <!-- Doc List -->
        <div class="flex-1 space-y-2 overflow-y-auto p-3">
          <a
            v-for="i of 10"
            :key="i"
            class="block cursor-pointer overflow-hidden rounded-lg border-2 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md"
            :class="
              curDocId === i
                ? 'border-primary shadow-primary/10'
                : 'border-transparent hover:border-base-content/10'
            "
            @click="onClickDocItem(i)"
          >
            <div class="relative">
              <img
                src="https://placehold.co/280x160/f1f5f9/94a3b8?text=thumbnail"
                alt="thumbnail"
                class="h-28 w-full object-cover"
              />
              <div v-if="curDocId === i" class="absolute right-2 top-2">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                >
                  <i-lucide-check class="h-3 w-3" />
                </div>
              </div>
            </div>
            <div class="p-2.5">
              <div class="text-sm font-semibold leading-tight line-clamp-1">
                AI 마켓 솔루션 구매
              </div>
              <div class="mt-0.5 text-xs text-base-content/50">5 Steps</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const openDrawer = ref(false)
const zoom = ref(1)
const isSaving = ref(true)
const curDocId = ref(3)

const funcItems = ref<FunctionalityItem[]>([])
interface FunctionalityItem {
  id: string
  orderNo: number
  content: string
}

const funcListRef = ref<HTMLDivElement | null>(null)

useDraggable(funcListRef, funcItems, {
  handle: '.drag-handle',
  animation: 150,
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex === newIndex) return

    const movedItem = funcItems.value[newIndex!]
    const pushedItem = funcItems.value[oldIndex!]

    const movedItemOrderNo = movedItem.orderNo
    movedItem.orderNo = pushedItem.orderNo
    pushedItem.orderNo = movedItemOrderNo
  }
})

const onClickDocItem = (id: number): void => {
  curDocId.value = id
  openDrawer.value = false
}

onMounted(() => {
  funcItems.value = [
    { id: '123123', orderNo: 1, content: '기능 1' },
    { id: '12313', orderNo: 2, content: '기능 2' },
    { id: '12314', orderNo: 3, content: '기능 3' }
  ]
})
</script>
