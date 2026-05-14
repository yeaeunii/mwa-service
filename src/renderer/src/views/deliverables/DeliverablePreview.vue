<template>
  <div class="flex h-screen flex-col overflow-hidden bg-base-200 text-base-content">
    <div class="flex h-16 shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-6">
      <button type="button" class="btn btn-ghost btn-sm btn-square" @click="goProject">
        <i-lucide-arrow-left class="h-4 w-4" />
      </button>
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <i-lucide-file-text class="h-4 w-4" />
      </div>
      <div class="min-w-0">
        <div class="truncate text-sm font-bold">산출물 미리보기</div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="relative flex shrink-0 flex-col border-r border-base-300 bg-base-100"
        :style="{ width: `${sidebarWidth}px` }"
      >
        <div class="border-b border-base-300 px-5 py-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <i-lucide-folder-kanban class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-sm font-bold">{{ projectTitle }}</div>
            </div>
          </div>
        </div>

        <div class="border-b border-base-300 p-4">
          <button type="button" class="btn btn-primary btn-sm w-full gap-1.5" @click="goStructure">
            <i-lucide-settings class="h-4 w-4" />
            산출물 구조 편집
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div class="space-y-3">
            <div v-for="category in categories" :key="category.id">
              <button
                type="button"
                class="flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-sm font-bold hover:bg-base-200"
                @click="toggleCategory(category.id)"
              >
                <i-lucide-chevron-down
                  v-if="isCategoryOpen(category.id)"
                  class="h-3.5 w-3.5 text-base-content/40"
                />
                <i-lucide-chevron-right v-else class="h-3.5 w-3.5 text-base-content/40" />
                <i-lucide-folder class="h-3.5 w-3.5 text-primary" />
                <span class="min-w-0 flex-1 truncate">{{ category.title }}</span>
              </button>

              <div v-if="isCategoryOpen(category.id)" class="ml-5 mt-1 space-y-1">
                <button
                  v-for="item in category.items"
                  :key="item.id"
                  type="button"
                  class="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs"
                  :class="
                    selectedItemId === item.id
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-base-content/70 hover:bg-base-200'
                  "
                  @click="selectItem(item)"
                >
                  <i-lucide-file-text class="h-3.5 w-3.5 shrink-0" />
                  <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
                </button>

                <div v-for="child in category.children" :key="child.id">
                  <button
                    type="button"
                    class="flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-xs font-semibold hover:bg-base-200"
                    @click="toggleCategory(child.id)"
                  >
                    <i-lucide-chevron-down
                      v-if="isCategoryOpen(child.id)"
                      class="h-3.5 w-3.5 text-base-content/40"
                    />
                    <i-lucide-chevron-right v-else class="h-3.5 w-3.5 text-base-content/40" />
                    <i-lucide-folder class="h-3.5 w-3.5 text-primary" />
                    <span class="min-w-0 flex-1 truncate">{{ child.title }}</span>
                  </button>

                  <div v-if="isCategoryOpen(child.id)" class="ml-5 mt-1 space-y-1">
                    <button
                      v-for="item in child.items"
                      :key="item.id"
                      type="button"
                      class="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs"
                      :class="
                        selectedItemId === item.id
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-base-content/70 hover:bg-base-200'
                      "
                      @click="selectItem(item)"
                    >
                      <i-lucide-file-text class="h-3.5 w-3.5 shrink-0" />
                      <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="absolute -right-1 top-0 h-full w-2 cursor-col-resize transition-colors hover:bg-primary/20"
          role="separator"
          aria-orientation="vertical"
          aria-label="미리보기 목차 영역 크기 조절"
          @pointerdown.prevent="startSidebarResize"
        ></div>
      </aside>

      <main class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex h-14 shrink-0 items-center justify-between border-b border-base-300 bg-base-100 px-6"
        >
          <div class="flex min-w-0 items-center gap-2 text-sm">
            <span class="truncate text-base-content/55">{{ currentPhase }}</span>
            <i-lucide-chevron-right class="h-4 w-4 text-base-content/35" />
            <span class="truncate font-bold">{{ selectedTitle }}</span>
            <span class="badge badge-success badge-soft badge-sm">미리보기</span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-outline btn-sm gap-1.5">
              <i-lucide-download class="h-4 w-4" />
              다운로드
            </button>
            <button type="button" class="btn btn-neutral btn-sm gap-1.5">
              <i-lucide-expand class="h-4 w-4" />
              전체화면
            </button>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto bg-base-200 p-8">
          <article
            class="mx-auto min-h-[1123px] w-[794px] rounded-lg border border-base-300 bg-white shadow-sm"
          >
            <section class="px-16 pb-8 pt-14">
              <div class="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                User Manual
              </div>
              <h1 class="mt-3 text-3xl font-black leading-tight text-slate-950">
                {{ selectedTitle }}
              </h1>
              <p class="mt-4 text-sm leading-7 text-slate-600">화면을 설명합니다.</p>

              <div class="mt-8 grid grid-cols-[120px_1fr] border-y border-slate-300 text-sm">
                <div
                  class="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-600"
                >
                  문서 구분
                </div>
                <div class="border-b border-slate-200 px-4 py-3">산출물 미리보기 매뉴얼</div>
                <div
                  class="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-600"
                >
                  진입 경로
                </div>
                <div class="border-b border-slate-200 px-4 py-3">메인 &gt; 로그인화면</div>
                <div class="bg-slate-50 px-4 py-3 font-bold text-slate-600">작성 날짜</div>
                <div class="px-4 py-3">2026. 05. 14</div>
              </div>
            </section>

            <section class="px-16 py-8">
              <h2 class="border-l-4 border-primary pl-4 text-xl font-black text-slate-950">
                1. 화면 구성
              </h2>
              <p class="mt-4 text-sm leading-7 text-slate-600">
                프로젝트의 화면 구성 상태와 기능을 표시합니다. 번호가 표시된 영역은 하단의 기능
                설명과 연결됩니다.
              </p>

              <div class="relative mx-auto h-[420px] w-[520px] bg-white shadow-sm">
                <div class="grid grid-cols-3 gap-3 p-5">
                  <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div class="text-xs font-semibold text-primary">전체 문서</div>
                    <div class="mt-2 text-2xl font-bold">24</div>
                  </div>
                  <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div class="text-xs font-semibold text-emerald-700">완료</div>
                    <div class="mt-2 text-2xl font-bold">18</div>
                  </div>
                  <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div class="text-xs font-semibold text-amber-700">검토 필요</div>
                    <div class="mt-2 text-2xl font-bold">6</div>
                  </div>
                </div>

                <div class="mx-5 rounded-lg border border-slate-200">
                  <div
                    class="grid grid-cols-[1fr_90px_90px] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    <span>문서명</span>
                    <span>상태</span>
                    <span>수정일</span>
                  </div>
                  <div class="grid grid-cols-[1fr_90px_90px] items-center px-4 py-3 text-xs">
                    <span class="font-semibold">사용자 매뉴얼 초안</span>
                    <span class="badge badge-success badge-xs">완료</span>
                    <span class="text-slate-500">05.14</span>
                  </div>
                  <div
                    class="grid grid-cols-[1fr_90px_90px] items-center border-t border-slate-100 px-4 py-3 text-xs"
                  >
                    <span class="font-semibold">화면 캡처 정리본</span>
                    <span class="badge badge-warning badge-xs">검토</span>
                    <span class="text-slate-500">05.13</span>
                  </div>
                  <div
                    class="grid grid-cols-[1fr_90px_90px] items-center border-t border-slate-100 px-4 py-3 text-xs"
                  >
                    <span class="font-semibold">문서 품질 검수표</span>
                    <span class="badge badge-ghost badge-xs">작성중</span>
                    <span class="text-slate-500">05.12</span>
                  </div>
                </div>

                <div class="absolute bottom-6 left-5 right-5 h-20 rounded-lg bg-slate-100 p-4">
                  <div class="h-3 w-1/2 rounded bg-slate-300"></div>
                  <div class="mt-3 h-3 w-3/4 rounded bg-slate-200"></div>
                  <div class="mt-2 h-3 w-2/3 rounded bg-slate-200"></div>
                </div>

                <div
                  v-for="marker in annotationMarkers"
                  :key="marker.number"
                  class="absolute flex h-6 w-6 items-center justify-center rounded-full bg-error text-[11px] font-bold text-white shadow-lg ring-2 ring-white"
                  :style="{ left: marker.left, top: marker.top }"
                >
                  {{ marker.number }}
                </div>
              </div>
            </section>

            <section class="px-16 py-8">
              <div class="mb-4 flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 class="text-xl font-black text-slate-950">2. 기능 설명</h2>
              </div>

              <ol class="space-y-3">
                <li
                  v-for="item in functionItems"
                  :key="item.number"
                  class="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                  >
                    {{ item.number }}
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900">{{ item.title }}</div>
                    <p class="mt-1 text-sm leading-6 text-slate-500">{{ item.description }}</p>
                  </div>
                </li>
              </ol>
            </section>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  deliverableItems,
  deliverablePreviewCategories,
  type StructureCategory,
  type StructureItem
} from '@/assets/dummy/data'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sidebarWidth = ref(288)
const sidebarResizeMinWidth = 240
const sidebarResizeMaxWidth = 520
let sidebarResizeStartX = 0
let sidebarResizeStartWidth = 0

const clampSidebarWidth = (width: number): number =>
  Math.min(Math.max(width, sidebarResizeMinWidth), sidebarResizeMaxWidth)

const resizeSidebar = (event: PointerEvent): void => {
  sidebarWidth.value = clampSidebarWidth(
    sidebarResizeStartWidth + event.clientX - sidebarResizeStartX
  )
}

const stopSidebarResize = (): void => {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', resizeSidebar)
  window.removeEventListener('pointerup', stopSidebarResize)
}

const startSidebarResize = (event: PointerEvent): void => {
  sidebarResizeStartX = event.clientX
  sidebarResizeStartWidth = sidebarWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', resizeSidebar)
  window.addEventListener('pointerup', stopSidebarResize)
}

onBeforeUnmount(() => {
  stopSidebarResize()
})

const cloneCategories = (): StructureCategory[] => deliverablePreviewCategories.map(cloneCategory)

const cloneCategory = (category: StructureCategory): StructureCategory => ({
  ...category,
  items: category.items.map((item) => ({ ...item })),
  children: category.children.map(cloneCategory)
})

const categories = ref<StructureCategory[]>(cloneCategories())
const openedCategoryIds = ref(
  new Set(
    categories.value.flatMap((category) => [
      category.id,
      ...category.children.map((child) => child.id)
    ])
  )
)
const flatItems = computed(() =>
  categories.value.flatMap((category) => [
    ...category.items.map((item) => ({ item, phase: category.title })),
    ...category.children.flatMap((child) =>
      child.items.map((item) => ({ item, phase: `${category.title} / ${child.title}` }))
    )
  ])
)
const selectedItemId = ref(flatItems.value[0]?.item.id ?? '')
const selectedEntry = computed(
  () =>
    flatItems.value.find((entry) => entry.item.id === selectedItemId.value) ?? flatItems.value[0]
)
const deliverableTitle = computed(
  () =>
    deliverableItems.find((item) => item.id === String(route.params.deliverableId))?.title ??
    '산출물 미리보기'
)
const selectedTitle = computed(() => selectedEntry.value?.item.title ?? deliverableTitle.value)
const currentPhase = computed(() => selectedEntry.value?.phase ?? '산출물')
const projectTitle = computed(() => `프로젝트명 ${route.params.id}`)
const annotationMarkers = [
  { number: 1, left: '24px', top: '18px' },
  { number: 2, left: '65px', top: '100px' },
  { number: 3, left: '232px', top: '100px' },
  { number: 4, left: '400px', top: '100px' },
  { number: 5, left: '24px', top: '178px' },
  { number: 6, left: '330px', top: '178px' },
  { number: 7, left: '24px', top: '342px' }
]
const functionItems = [
  {
    number: 1,
    title: '미리보기 제목 확인',
    description: '화면 상단에서 현재 산출물 미리보기 문서에 진입했는지 확인합니다.'
  },
  {
    number: 2,
    title: '전체 문서 수 확인',
    description: '프로젝트에 등록된 전체 산출물 문서 개수를 확인합니다.'
  },
  {
    number: 3,
    title: '완료 문서 수 확인',
    description: '작업 완료 상태인 문서 수를 확인해 진행률을 판단합니다.'
  },
  {
    number: 4,
    title: '검토 필요 문서 확인',
    description: '검토가 필요한 문서 수를 확인하고 후속 작업 대상을 파악합니다.'
  },
  {
    number: 5,
    title: '문서 목록 확인',
    description: '문서명, 상태, 수정일을 기준으로 최근 작업 문서를 확인합니다.'
  },
  {
    number: 6,
    title: '문서 상태 확인',
    description: '완료, 검토, 작성중 상태를 구분해 문서별 진행 상황을 확인합니다.'
  },
  {
    number: 7,
    title: '요약 영역 확인',
    description: '하단 요약 영역에서 프로젝트 산출물의 주요 안내 내용을 확인합니다.'
  }
]

const isCategoryOpen = (id: string): boolean => openedCategoryIds.value.has(id)

const toggleCategory = (id: string): void => {
  const nextIds = new Set(openedCategoryIds.value)
  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }
  openedCategoryIds.value = nextIds
}

const selectItem = (item: StructureItem): void => {
  selectedItemId.value = item.id
}

const goProject = (): void => {
  if (route.query.from === 'deliverable-structure') {
    void router.push({
      name: 'deliverable-structure',
      params: {
        id: String(route.params.id),
        deliverableId: String(route.params.deliverableId)
      }
    })
    return
  }

  void router.push({
    name: 'projects-index',
    params: { id: String(route.params.id) },
    query: { tab: 'deliverables' }
  })
}

const goStructure = (): void => {
  void router.push({
    name: 'deliverable-structure',
    params: {
      id: String(route.params.id),
      deliverableId: String(route.params.deliverableId)
    }
  })
}
</script>
