<template>
  <div class="flex h-screen flex-col overflow-hidden bg-base-200 text-base-content">
    <div
      v-if="!isFullscreenPreview"
      class="flex h-16 shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-6"
    >
      <button type="button" class="btn btn-ghost btn-sm btn-square" @click="goProject">
        <i-lucide-x class="h-4 w-4" />
      </button>
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <i-lucide-folder-kanban class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-bold text-base-content/80">{{ deliverableTitle }}</div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <div class="dropdown dropdown-end">
          <button
            type="button"
            tabindex="0"
            class="tooltip tooltip-left btn btn-ghost btn-sm btn-square text-primary hover:bg-primary/10"
            data-tip="내보내기"
          >
            <i-lucide-download class="h-4 w-4" />
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu z-[9999] w-44 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-xl"
          >
            <li>
              <button
                type="button"
                class="rounded-lg text-sm"
                @click="downloadSelectedFormat('html')"
              >
                <i-lucide-file-archive class="h-4 w-4 opacity-60" />
                HTML 내보내기
              </button>
            </li>
            <li>
              <button
                type="button"
                class="rounded-lg text-sm"
                @click="downloadSelectedFormat('pdf')"
              >
                <i-lucide-file-down class="h-4 w-4 opacity-60" />
                PDF 내보내기
              </button>
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="tooltip tooltip-left btn btn-ghost btn-sm btn-square"
          data-tip="전체화면"
          @click="toggleFullscreenPreview"
        >
          <i-lucide-expand class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="relative flex shrink-0 flex-col border-r border-base-300 bg-base-100"
        :style="{ width: `${sidebarWidth}px` }"
      >
        <div v-if="isFullscreenPreview" class="border-b border-base-300 px-5 py-4">
          <div class="flex items-center gap-2">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <i-lucide-folder-kanban class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-sm font-bold">{{ deliverableTitle }}</div>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div class="space-y-1">
            <template v-for="row in previewOutlineRows" :key="row.id">
              <button
                v-if="row.kind === 'category'"
                type="button"
                class="flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-left hover:bg-base-200"
                :class="row.depth === 0 ? 'text-sm font-bold' : 'text-xs font-semibold'"
                :style="{ paddingLeft: `${row.depth * 16 + 6}px` }"
                @click="toggleCategory(row.category.id)"
              >
                <i-lucide-chevron-down
                  v-if="isCategoryOpen(row.category.id)"
                  class="h-3.5 w-3.5 text-base-content/40"
                />
                <i-lucide-chevron-right v-else class="h-3.5 w-3.5 text-base-content/40" />
                <i-lucide-folder class="h-3.5 w-3.5 text-primary" />
                <span class="min-w-0 flex-1 truncate">{{ row.category.name }}</span>
              </button>

              <button
                v-else
                type="button"
                class="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs"
                :style="{ paddingLeft: `${row.depth * 16 + 22}px` }"
                :class="
                  selectedItemId === row.entry.item.placement_id
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-base-content/70 hover:bg-base-200'
                "
                @click="scrollToPage(row.entry.item.placement_id)"
              >
                <i-lucide-file-text class="h-3.5 w-3.5 shrink-0" />
                <span class="min-w-0 flex-1 truncate">{{ row.entry.item.doc_title }}</span>
              </button>
            </template>
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
        <div
          ref="previewScrollerRef"
          class="min-h-0 flex-1 overflow-y-auto bg-base-200 p-8"
          :class="{ 'p-6': isFullscreenPreview }"
          @scroll="syncSelectedPage"
        >
          <article
            v-for="(entry, pageIndex) in flatItems"
            :id="getPageElementId(entry.item.placement_id)"
            :key="entry.item.placement_id"
            class="mx-auto flex min-h-[1123px] w-[794px] flex-col bg-white px-7 py-6 text-[#1f3554] shadow-sm"
            :class="{ 'mb-8': pageIndex < flatItems.length - 1 }"
          >
            <header class="border-b border-slate-200 pb-4">
              <div class="flex items-end justify-between">
                <div class="min-w-0">
                  <div class="flex min-w-0 items-center gap-1.5 text-xs">
                    <span class="truncate text-base-content/55">{{ currentPhase }}</span>
                    <span class="text-base-content/45 select-none">/</span>
                    <span class="truncate font-bold text-[#315b96]">{{ selectedTitle }}</span>
                  </div>
                </div>
                <div class="text-[11px] font-semibold text-slate-600">
                  작성일: {{ getDocDate(entry.item) }}
                </div>
              </div>
            </header>

            <section class="pt-7">
              <div class="flex items-center">
                <h1 class="shrink-0 text-2xl font-black tracking-tight text-slate-950">
                  {{ entry.item.doc_title }}
                </h1>
              </div>

              <div class="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <i-lucide-folder-open class="h-3.5 w-3.5" />
                <span
                  >경로: {{ getDocEntryPath(entry.item) || '입력된 화면 경로가 없습니다' }}</span
                >
              </div>

              <div class="mt-5 rounded-md border border-[#cfd9e8] bg-[#eef4ff] p-4">
                <div class="mb-2 flex items-center gap-2">
                  <span class="text-sm font-black text-[#315b96]">화면 개요</span>
                </div>
                <p class="text-xs leading-6 text-[#243b5a]">
                  {{ entry.item.description || '화면 설명이 없습니다.' }}
                </p>
              </div>
            </section>

            <section class="mt-6">
              <div class="mb-2 flex items-center gap-2">
                <i-lucide-square-check class="h-3.5 w-3.5 text-slate-500" />
                <h2 class="text-sm font-black text-[#1f3554]">화면구성</h2>
              </div>

              <div class="border border-slate-300 bg-white p-1">
                <div
                  v-if="getDocImageSrc(entry.item)"
                  class="flex min-h-[250px] items-center justify-center"
                >
                  <img
                    :src="getDocImageSrc(entry.item)"
                    :alt="entry.item.doc_title"
                    class="max-h-[390px] w-full object-contain"
                  />
                </div>
                <div
                  v-else
                  class="flex min-h-[250px] flex-col items-center justify-center bg-slate-50 text-slate-400"
                >
                  <i-lucide-image-off class="h-10 w-10" />
                  <p class="mt-3 text-sm">저장된 화면 이미지가 없습니다</p>
                </div>
              </div>
            </section>

            <section class="mt-6">
              <div class="mb-2 flex items-center gap-2 border-b border-slate-200 pb-2">
                <i-lucide-square-check class="h-3.5 w-3.5 text-slate-500" />
                <h2 class="text-sm font-black text-[#1f3554]">주요 기능 명세</h2>
              </div>

              <table class="w-full border border-slate-300 text-xs">
                <thead class="bg-[#eef2f7] text-[#1f3554]">
                  <tr>
                    <th class="w-16 border border-slate-300 px-3 py-2 text-center">번호</th>
                    <th class="border border-slate-300 px-3 py-2 text-center">상세 설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in getDocFunctionItems(entry.item)" :key="item.number">
                    <td class="border border-slate-300 px-3 py-3 text-center align-top">
                      <span
                        class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        :style="{ backgroundColor: getDocNumberColor(entry.item) }"
                      >
                        {{ item.number }}
                      </span>
                    </td>
                    <td class="break-all border border-slate-300 px-3 py-3 text-center align-top">
                      <p class="whitespace-normal break-all leading-5 text-slate-600">
                        {{ item.description }}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <footer
              class="mt-auto flex items-end justify-between border-t border-slate-200 pt-7 text-[11px] text-[#1f3554]"
            >
              <div>
                <div>{{ projectTitle }} - {{ deliverableTitle }}</div>
              </div>
              <div>Page {{ pageIndex + 1 }} of {{ flatItems.length }}</div>
            </footer>
          </article>
        </div>
      </main>
    </div>

    <ModalBase ref="downloadCompleteModalRef" width="w-80">
      <div class="py-3 text-center text-sm font-semibold">{{ downloadCompleteMessage }}</div>
      <template #footer="{ close }">
        <button class="btn btn-smgap-1.5" @click="openSavedDownloadFolder">
          <i-lucide-folder-open class="h-4 w-4" />
          폴더 열기
        </button>
        <button class="btn btn-sm" @click="close">
          <i-lucide-check class="h-4 w-4" />
          확인
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup lang="ts">
import {
  getDeliverableDetail,
  getDeliverableStructure,
  getProjects,
  type Deliverable,
  type DeliverableSection,
  type DeliverableSectionDoc
} from '@/database'
import type { Project } from '@database/dto'
import type { ExportResult } from '@/types'
import type { SectionDocInput, SectionTreeInput } from '@database/dto'
import { buildManualExport } from './templates/manualExport'
import { renderManualInline, renderManual } from './templates/manualTemplate'
import { useRoute, useRouter } from 'vue-router'

interface FunctionDescription {
  number: number
  description: string
}

interface PreviewDoc extends SectionDocInput {
  placement_id: string
  description: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  orgn_img_path: string
  draw_img_path: string
  updated_at: string
}

interface PreviewSection extends Omit<SectionTreeInput, 'docs' | 'children'> {
  docs: PreviewDoc[]
  children: PreviewSection[]
}

type DownloadFormat = 'html' | 'pdf'

interface PreviewEntry {
  item: PreviewDoc
  phase: string
  depth: number
}

type PreviewOutlineRow =
  | {
      id: string
      kind: 'category'
      category: PreviewSection
      depth: number
    }
  | {
      id: string
      kind: 'item'
      entry: PreviewEntry
      depth: number
    }

const route = useRoute()
const router = useRouter()
const previewScrollerRef = ref<HTMLElement | null>(null)
const downloadCompleteModalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const deliverable = ref<Deliverable | null>(null)
const project = ref<Project | null>(null)
const categories = ref<PreviewSection[]>([])
const selectedItemId = ref('')
const openedCategoryIds = ref(new Set<string>())
const isFullscreenPreview = ref(false)
const downloadCompleteMessage = ref('')
const savedDownloadPath = ref('')

const sidebarWidth = ref(288)
const sidebarResizeMinWidth = 240
const sidebarResizeMaxWidth = 520
let sidebarResizeStartX = 0
let sidebarResizeStartWidth = 0

// 날짜 표시
const formatDate = (value: string): string => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 파일 경로 변환
const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

// JSON 객체 파싱
const parseJsonObject = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

// 기능 설명 파싱
const parseContentItems = (value: string): FunctionDescription[] => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        number: Number(item?.number ?? 0),
        description: String(item?.text ?? '')
      }))
      .filter((item) => item.number > 0)
      .sort((left, right) => left.number - right.number)
  } catch {
    return []
  }
}

// 번호 어노테이션 색상 조회
const getNumberColor = (value: string): string => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return '#f87171'

    const colorCounts = new Map<string, number>()
    parsed.forEach((item) => {
      if (item?.toolType !== 'number' || typeof item?.color !== 'string') return

      colorCounts.set(item.color, (colorCounts.get(item.color) ?? 0) + 1)
    })

    return [...colorCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '#f87171'
  } catch {
    return '#f87171'
  }
}

// 문서 메타 구성
const mapSectionDoc = (doc: DeliverableSectionDoc): PreviewDoc => ({
  placement_id: String(doc.id),
  doc_id: String(doc.doc_id),
  kind: 'document',
  doc_title: doc.title,
  meta: `수정일: ${formatDate(doc.updated_at)}`,
  status: doc.status ?? '',
  description: doc.description ?? '',
  doc_meta_json: doc.doc_meta_json ?? '{}',
  content_json: doc.content_json ?? '[]',
  annotation_json: doc.annotation_json ?? '[]',
  orgn_img_path: doc.orgn_img_path ?? '',
  draw_img_path: doc.draw_img_path ?? '',
  updated_at: doc.updated_at ?? ''
})

// 카테고리 트리 구성
const buildCategoriesFromStructure = (
  sections: DeliverableSection[],
  sectionDocs: DeliverableSectionDoc[]
): PreviewSection[] => {
  const categoriesById = new Map<number, PreviewSection>()
  const childrenByParentId = new Map<number | null, DeliverableSection[]>()
  const docsBySectionId = new Map<number, DeliverableSectionDoc[]>()

  sections.forEach((section) => {
    const parentId = section.parent_id ?? null
    childrenByParentId.set(parentId, [...(childrenByParentId.get(parentId) ?? []), section])
    categoriesById.set(section.id, {
      id: String(section.id),
      name: section.name,
      docs: [],
      children: []
    })
  })

  sectionDocs.forEach((doc) => {
    docsBySectionId.set(doc.section_id, [...(docsBySectionId.get(doc.section_id) ?? []), doc])
  })

  const attach = (parentId: number | null): PreviewSection[] =>
    (childrenByParentId.get(parentId) ?? []).map((section) => {
      const category = categoriesById.get(section.id)!
      category.docs = (docsBySectionId.get(section.id) ?? []).map(mapSectionDoc)
      category.children = attach(section.id)
      return category
    })

  return attach(null)
}

// 카테고리 ID 수집
const collectCategoryIds = (categoryList: PreviewSection[]): string[] =>
  categoryList.flatMap((category) => [category.id, ...collectCategoryIds(category.children)])

// 미리보기 페이지 목록 구성
const collectPreviewEntries = (
  category: PreviewSection,
  parentTitles: string[] = [],
  depth = 0
): PreviewEntry[] => {
  const phaseTitles = [...parentTitles, category.name]
  const phase = phaseTitles.join(' / ')

  return [
    ...category.docs.map((item) => ({ item, phase, depth })),
    ...category.children.flatMap((child) => collectPreviewEntries(child, phaseTitles, depth + 1))
  ]
}

const flatItems = computed(() =>
  categories.value.flatMap((category) => collectPreviewEntries(category))
)

// 목차 행 구성
const collectPreviewOutlineRows = (
  category: PreviewSection,
  parentTitles: string[] = [],
  depth = 0
): PreviewOutlineRow[] => {
  const phaseTitles = [...parentTitles, category.name]
  const categoryRow: PreviewOutlineRow = {
    id: `category-${category.id}`,
    kind: 'category',
    category,
    depth
  }

  if (!isCategoryOpen(category.id)) return [categoryRow]

  return [
    categoryRow,
    ...category.docs.map<PreviewOutlineRow>((item) => ({
      id: `item-${item.doc_id}-${item.placement_id}`,
      kind: 'item',
      entry: {
        item,
        phase: phaseTitles.join(' / '),
        depth
      },
      depth
    })),
    ...category.children.flatMap((child) =>
      collectPreviewOutlineRows(child, phaseTitles, depth + 1)
    )
  ]
}
const previewOutlineRows = computed(() =>
  categories.value.flatMap((category) => collectPreviewOutlineRows(category))
)

// 선택 문서 계산
const selectedEntry = computed(
  () =>
    flatItems.value.find((entry) => entry.item.placement_id === selectedItemId.value) ??
    flatItems.value[0]
)
const deliverableTitle = computed(() => deliverable.value?.title ?? '산출물 제목')
const selectedTitle = computed(() => selectedEntry.value?.item.doc_title ?? deliverableTitle.value)
const currentPhase = computed(() => selectedEntry.value?.phase ?? '카테고리')
const projectTitle = computed(() => project.value?.name ?? '프로젝트명')

// 문서 이미지 조회
const getDocImageSrc = (item: PreviewDoc): string => {
  const imagePath = item.draw_img_path || item.orgn_img_path
  return imagePath ? toFileSrc(imagePath, item.updated_at) : ''
}

// 문서 기능 설명 조회
const getDocFunctionItems = (item: PreviewDoc): FunctionDescription[] =>
  parseContentItems(item.content_json)

const getDocNumberColor = (item: PreviewDoc): string => getNumberColor(item.annotation_json)

// 문서 화면 경로 조회
const getDocEntryPath = (item: PreviewDoc): string => {
  const docMeta = parseJsonObject(item.doc_meta_json)
  return String(docMeta.entry_path ?? '')
}

// 문서 작성일 조회
const getDocDate = (item: PreviewDoc): string => formatDate(item.updated_at)

// 카테고리 접힘 상태
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

// 페이지 DOM ID 생성
const getPageElementId = (placementId: string): string => `manual-page-${placementId}`

// 문서 페이지 이동
const scrollToPage = (placementId: string): void => {
  selectedItemId.value = placementId
  document.getElementById(getPageElementId(placementId))?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

// 스크롤 위치 기준 선택 문서 동기화
const syncSelectedPage = (): void => {
  const scroller = previewScrollerRef.value
  if (!scroller) return

  const scrollerTop = scroller.getBoundingClientRect().top
  const closestEntry = flatItems.value
    .map((entry) => {
      const element = document.getElementById(getPageElementId(entry.item.placement_id))
      return {
        entry,
        distance: element ? Math.abs(element.getBoundingClientRect().top - scrollerTop) : Infinity
      }
    })
    .sort((first, second) => first.distance - second.distance)[0]?.entry

  if (closestEntry) selectedItemId.value = closestEntry.item.placement_id
}

// 목차 영역 너비 제한
const clampSidebarWidth = (width: number): number =>
  Math.min(Math.max(width, sidebarResizeMinWidth), sidebarResizeMaxWidth)

// 목차 영역 리사이즈
const resizeSidebar = (event: PointerEvent): void => {
  sidebarWidth.value = clampSidebarWidth(
    sidebarResizeStartWidth + event.clientX - sidebarResizeStartX
  )
}

// 목차 영역 리사이즈 종료
const stopSidebarResize = (): void => {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', resizeSidebar)
  window.removeEventListener('pointerup', stopSidebarResize)
}

// 목차 영역 리사이즈 시작
const startSidebarResize = (event: PointerEvent): void => {
  sidebarResizeStartX = event.clientX
  sidebarResizeStartWidth = sidebarWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', resizeSidebar)
  window.addEventListener('pointerup', stopSidebarResize)
}

// 전체화면 전환
const toggleFullscreenPreview = (): void => {
  isFullscreenPreview.value = !isFullscreenPreview.value
}

const downloadSelectedFormat = (format: DownloadFormat): void => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  if (format === 'html') {
    void downloadHtmlZip()
    return
  }

  void downloadPdf()
}

const showDownloadComplete = (message: string, filePath: string): void => {
  downloadCompleteMessage.value = message
  savedDownloadPath.value = filePath
  downloadCompleteModalRef.value?.onOpen()
}

const openSavedDownloadFolder = (): void => {
  if (!savedDownloadPath.value) return

  void window.api.invoke('shell:showItemInFolder', savedDownloadPath.value)
  downloadCompleteModalRef.value?.onClose()
}

// HTML ZIP 내보내기
const downloadHtmlZip = async (): Promise<void> => {
  const data = await buildManualExport(Number(route.params.deliverableId), { includeImages: true })
  if (!data) return

  const bundle = renderManual(data.model)
  const files = [
    { path: 'index.html', content: bundle.html },
    { path: 'assets/manual.css', content: bundle.css },
    { path: 'assets/manual.js', content: bundle.js },
    ...data.images.map((file) => ({
      path: file.path,
      content: file.content,
      encoding: file.encoding
    }))
  ]

  const result = (await window.api.invoke('export:manualHtmlZip', {
    defaultFileName: data.fileName,
    files
  })) as ExportResult

  if (!result.canceled && result.filePath) {
    showDownloadComplete('산출물 내보내기가 완료되었습니다.', result.filePath)
  }
}

// PDF 내보내기
const downloadPdf = async (): Promise<void> => {
  const data = await buildManualExport(Number(route.params.deliverableId))
  if (!data) return

  const html = renderManualInline(data.model)
  const result = (await window.api.invoke('export:manualPdf', {
    defaultFileName: data.fileName,
    html
  })) as ExportResult

  if (!result.canceled && result.filePath) {
    showDownloadComplete('산출물 내보내기가 완료되었습니다.', result.filePath)
  }
}

// 이전 화면 이동
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

// ESC로 전체화면 종료
const onPreviewKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') isFullscreenPreview.value = false
}

// 미리보기 데이터 조회
const loadPreview = async (): Promise<void> => {
  const deliverableId = Number(route.params.deliverableId)
  if (!deliverableId) return

  const [detail, structure] = await Promise.all([
    getDeliverableDetail(deliverableId),
    getDeliverableStructure(deliverableId)
  ])

  deliverable.value = detail
  if (detail?.project_id) {
    const projects = await getProjects({
      id: detail.project_id,
      limit: 1,
      offset: 0
    })
    project.value = projects[0] ?? null
  }
  categories.value = buildCategoriesFromStructure(structure.sections, structure.sectionDocs)
  openedCategoryIds.value = new Set(collectCategoryIds(categories.value))
  selectedItemId.value = flatItems.value[0]?.item.placement_id ?? ''
}

onMounted(() => {
  void loadPreview()
  window.addEventListener('keydown', onPreviewKeydown)
})

onBeforeUnmount(() => {
  stopSidebarResize()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onPreviewKeydown)
})
</script>
