<template>
  <div class="drawer drawer-end">
    <input id="mainDrawer" v-model="openDrawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex h-screen flex-col">
      <!-- Navbar -->
      <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
        <div class="flex flex-1 items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="goToDocsIndex">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <i-lucide-pencil-ruler class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-sm font-bold leading-tight">{{ currentDocTitle || '문서 편집' }}</div>
              <div
                v-if="isSaving || showSavedStatus"
                class="flex items-center gap-1.5 text-xs text-base-content/50"
              >
                <template v-if="isSaving">
                  <i-lucide-loader-circle class="h-3 w-3 animate-spin" />
                  저장중...
                </template>
                <template v-else-if="showSavedStatus">
                  <i-lucide-check-circle class="h-3 w-3 text-success" />
                  방금전 저장됨
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="btn btn-primary btn-sm gap-1.5"
            :disabled="isSaving"
            @click="saveAnnotationDoc"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
            <i-lucide-save v-else class="h-4 w-4" />
            {{ isSaving ? '저장중' : '저장' }}
          </button>
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
            <div class="join">
              <button type="button" class="btn btn-ghost btn-xs join-item gap-1 text-base-content/45">
                <i-lucide-undo-2 class="h-3.5 w-3.5" />
                Undo
              </button>
              <button type="button" class="btn btn-ghost btn-xs join-item gap-1 text-base-content/45">
                <i-lucide-redo-2 class="h-3.5 w-3.5" />
                Redo
              </button>
            </div>
            <div class="flex items-center gap-3">
              <EditorTools v-model="activeTool" v-model:color-value="activeColor" />
              <div class="h-4 w-px bg-base-content/10"></div>
              <ZoomControls v-model:zoom-pct="zoomPct" />
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="tooltip tooltip-bottom btn btn-ghost btn-xs gap-1"
                  data-tip="왼쪽으로 90° 회전"
                  @click="onRotate"
                >
                  <i-lucide-rotate-ccw class="h-3.5 w-3.5" />
                  회전
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs gap-1 text-error"
                  @click="onResetViewport"
                >
                  <i-lucide-eraser class="h-3.5 w-3.5" />
                  초기화
                </button>
              </div>
            </div>
          </div>

          <!-- Canvas Area -->
          <div class="flex min-h-0 flex-1 overflow-hidden bg-base-200 p-4">
            <div
              v-if="isLoading"
              class="flex h-full flex-1 items-center justify-center rounded-xl border-2 border-dashed border-base-content/10 bg-base-100/50"
            >
              <div class="flex flex-col items-center gap-3 text-base-content/30">
                <i-lucide-loader-circle class="h-10 w-10 animate-spin" />
                <span class="text-sm font-medium">문서 이미지를 불러오는 중입니다</span>
              </div>
            </div>
            <CanvasEditor
              v-else-if="imageSrc"
              ref="canvasEditorRef"
              :image-src="imageSrc"
              :annotations="annotations"
              :active-tool="activeTool"
              :active-color="activeColor"
              @add-annotation="addAnnotation"
              @update-annotation="updateAnnotation"
              @remove-annotation="removeAnnotation"
              @close-context-menu="closeContextMenu"
              @zoom-wheel="onZoomWheel"
            />
            <div
              v-else
              class="flex h-full flex-1 items-center justify-center rounded-xl border-2 border-dashed border-base-content/10 bg-base-100/50"
            >
              <div class="flex flex-col items-center gap-3 text-base-content/30">
                <i-lucide-image-plus class="h-12 w-12" />
                <span class="text-sm font-medium">문서 이미지가 없습니다</span>
              </div>
            </div>
          </div>
        </section>

        <FunctionList :items="funcItems" @reorder="onReorderFunctionList" />
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
            <span class="badge badge-sm badge-ghost">{{ documentItems.length }}</span>
          </div>
        </div>

        <!-- Search -->
        <div class="px-3 py-2">
          <label class="input input-sm w-full">
            <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
            <input v-model="documentSearchKeyword" type="search" placeholder="문서 검색..." />
          </label>
        </div>

        <!-- Doc List -->
        <div v-if="filteredDocumentItems.length > 0" class="flex-1 space-y-2 overflow-y-auto p-3">
          <a
            v-for="doc in filteredDocumentItems"
            :key="doc.id"
            class="block cursor-pointer overflow-hidden rounded-lg border-2 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md"
            :class="
              curDocId === doc.id
                ? 'border-primary shadow-primary/10'
                : 'border-transparent hover:border-base-content/10'
            "
            @click="onClickDocItem(doc.id)"
          >
            <div class="relative">
              <img
                :src="doc.thumbnail"
                alt="thumbnail"
                class="h-28 w-full object-cover"
              />
              <div v-if="curDocId === doc.id" class="absolute right-2 top-2">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                >
                  <i-lucide-check class="h-3 w-3" />
                </div>
              </div>
            </div>
            <div class="p-2.5">
              <div class="text-sm font-semibold leading-tight line-clamp-1">
                {{ doc.title }}
              </div>
              <div class="mt-0.5 text-xs text-base-content/50">{{ doc.stepCount }} Steps</div>
            </div>
          </a>
        </div>
        <div v-else class="flex flex-1 items-center justify-center p-6 text-center text-sm text-base-content/40">
          {{ documentSearchKeyword ? '검색 결과가 없습니다' : '문서가 없습니다' }}
        </div>
      </div>
    </div>

    <div v-if="saveToast" class="toast toast-end toast-top z-50">
      <div
        class="alert gap-2 shadow-lg"
        :class="saveToast.type === 'success' ? 'alert-success' : 'alert-error'"
      >
        <i-lucide-check-circle v-if="saveToast.type === 'success'" class="h-4 w-4" />
        <i-lucide-circle-alert v-else class="h-4 w-4" />
        <span>{{ saveToast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDocList, updateDocAnnotation } from '@/database'
import CanvasEditor from '@/views/editor/components/CanvasEditor.vue'
import EditorTools from '@/views/editor/components/EditorTools.vue'
import FunctionList from '@/views/editor/components/FunctionList.vue'
import ZoomControls from '@/views/editor/components/ZoomControls.vue'
import type { CanvasAnnotation, ToolMode } from '@/types'
import type { Doc } from '@database/dto'

const openDrawer = ref(false)
const zoomPct = ref(100)
const isSaving = ref(false)
const saveToast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let saveToastTimeout: ReturnType<typeof setTimeout> | null = null
const route = useRoute()
const router = useRouter()
const curDocId = ref(Number(route.params.docId || 0))
const currentWorkspaceId = ref(0)
const currentDocTitle = ref('')
const isLoading = ref(false)
const imageSrc = ref('')
const annotations = ref<CanvasAnnotation[]>([])
const activeTool = ref<ToolMode>('number')
const activeColor = ref('red')
const MIN_ZOOM_PCT = 50
const MAX_ZOOM_PCT = 200
let wheelZoomPoint: { x: number; y: number } | null = null
const canvasEditorRef = ref<{
  setZoom: (pct: number) => void
  setZoomAtPoint: (pct: number, point: { x: number; y: number }) => void
  resetViewport: () => void
  rotateSelectedAnnotationCCW90: () => void
  rotateBaseImageCCW90: () => void
  exportImageDataURL: () => string | null
} | null>(null)

const funcItems = ref<FunctionalityItem[]>([])
const documentSearchKeyword = ref('')
const documentItems = ref<DocumentItem[]>([])
const showSavedStatus = ref(false)

interface FunctionalityItem {
  id: string
  orderNo: number
  content: string
}

interface DocumentItem {
  id: number
  title: string
  thumbnail: string
  stepCount: number
}

interface ContentJsonItem {
  annotationId: string
  number: number
  text: string
}

const parseContentItems = (value: string | null | undefined): ContentJsonItem[] => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        annotationId: String(item?.annotationId ?? ''),
        number: Number(item?.number ?? 0),
        text: String(item?.text ?? '')
      }))
      .filter((item) => item.annotationId)
  } catch (error) {
    console.error(error)
    return []
  }
}

const syncFunctionItemsFromAnnotations = (): void => {
  const prevContentById = new Map(funcItems.value.map((item) => [item.id, item.content]))
  const numberAnnotations = annotations.value
    .filter((item) => item.toolType === 'number')
    .sort((a, b) => {
      const aOrder = a.number ?? a.order ?? 0
      const bOrder = b.number ?? b.order ?? 0
      return aOrder - bOrder
    })

  funcItems.value = numberAnnotations.map((item, index) => ({
    id: item.id,
    orderNo: item.number ?? item.order ?? index + 1,
    content: prevContentById.get(item.id) ?? ''
  }))
}

const hydrateFunctionItems = (contentItems: ContentJsonItem[]): void => {
  const contentByAnnotationId = new Map(contentItems.map((item) => [item.annotationId, item.text]))
  const numberAnnotations = annotations.value
    .filter((item) => item.toolType === 'number')
    .sort((a, b) => {
      const aOrder = a.number ?? a.order ?? 0
      const bOrder = b.number ?? b.order ?? 0
      return aOrder - bOrder
    })

  funcItems.value = numberAnnotations.map((item, index) => ({
    id: item.id,
    orderNo: item.number ?? item.order ?? index + 1,
    content: contentByAnnotationId.get(item.id) ?? ''
  }))
}

const getAnnotationOrder = (annotation: CanvasAnnotation): number =>
  annotation.order ?? annotation.number ?? annotation.zIndex ?? 0

const onReorderFunctionList = (payload: {
  visibleIds: string[]
  fromIndex: number
  toIndex: number
}): void => {
  if (!payload.visibleIds.length) return
  if (payload.fromIndex === payload.toIndex) return

  const visibleIdSet = new Set(payload.visibleIds)

  // 현재 정렬 상태(1..N에 해당) 기준으로 전체 목록을 다시 가져옵니다.
  const sortedFull = [...funcItems.value].sort((a, b) => a.orderNo - b.orderNo)

  const visibleItems = sortedFull.filter((item) => visibleIdSet.has(item.id))
  if (!visibleItems.length) return

  const from = Math.max(0, Math.min(payload.fromIndex, visibleItems.length - 1))
  const to = Math.max(0, Math.min(payload.toIndex, visibleItems.length - 1))
  if (from === to) return

  // "move" 동작: from을 뽑아서 to 위치에 삽입
  const moved = visibleItems.splice(from, 1)[0]
  visibleItems.splice(to, 0, moved)

  // 전체 목록에서 visible 구간만 방금 재배열된 순서로 치환
  let visiblePtr = 0
  const newSortedFull = sortedFull.map((item) => {
    if (!visibleIdSet.has(item.id)) return item
    const next = visibleItems[visiblePtr++]
    return next ?? item
  })

  // 번호는 전체 기준으로 1..N 연속으로 다시 매깁니다.
  const nextOrderById = new Map<string, number>()

  newSortedFull.forEach((item, index) => {
    item.orderNo = index + 1
    nextOrderById.set(item.id, index + 1)
  })

  annotations.value = annotations.value.map((annotation) => {
    if (annotation.toolType !== 'number') return annotation

    const nextOrder = nextOrderById.get(annotation.id)
    if (!nextOrder) return annotation

    return {
      ...annotation,
      number: nextOrder,
      order: nextOrder
    }
  })

  funcItems.value = newSortedFull
}

const onClickDocItem = (id: number): void => {
  openDrawer.value = false
  if (id === curDocId.value) return

  void router.push(`/documents/${id}/annotation`)
}

const goToDocsIndex = (): void => {
  if (!currentWorkspaceId.value || !curDocId.value) {
    router.back()
    return
  }

  void router.push(`/workspace/${currentWorkspaceId.value}/documents/${curDocId.value}`)
}

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

const toDocumentItem = (doc: Doc): DocumentItem => {
  const thumbnailPath = doc.draw_img_path || doc.orgn_img_path
  const thumbnailVersion = doc.draw_img_path ? `${doc.updated_at}-${Date.now()}` : doc.updated_at

  return {
    id: doc.id,
    title: doc.title,
    thumbnail: thumbnailPath
      ? toFileSrc(thumbnailPath, thumbnailVersion)
      : 'https://placehold.co/280x160/f1f5f9/94a3b8?text=thumbnail',
    stepCount: parseContentItems(doc.content_json).length
  }
}

const filteredDocumentItems = computed(() => {
  const keyword = documentSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return documentItems.value

  return documentItems.value.filter((doc) => doc.title.toLowerCase().includes(keyword))
})

const parseAnnotations = (value: string | null | undefined): CanvasAnnotation[] => {
  try {
    const parsed = JSON.parse(value || '[]')

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is CanvasAnnotation => Boolean(item?.id && item?.toolType))
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([id, item]) => ({
        id,
        ...(item as Omit<CanvasAnnotation, 'id'>)
      }))
    }
  } catch (error) {
    console.error(error)
  }

  return []
}

const loadDocumentItems = async (workspaceId: number): Promise<void> => {
  const list = await getDocList({
    workspaceId
  })

  documentItems.value = list.map(toDocumentItem)
}

const loadDoc = async (): Promise<void> => {
  if (!curDocId.value) return

  isLoading.value = true
  showSavedStatus.value = false
  try {
    const [doc] = await getDocList({
      id: curDocId.value
    })
    currentWorkspaceId.value = doc?.workspace_id ?? 0
    currentDocTitle.value = doc?.title ?? ''
    imageSrc.value = doc?.orgn_img_path ? toFileSrc(doc.orgn_img_path) : ''
    annotations.value = parseAnnotations(doc?.annotation_json)
    hydrateFunctionItems(parseContentItems(doc?.content_json))

    if (doc?.workspace_id) {
      await loadDocumentItems(doc.workspace_id)
    }
  } finally {
    isLoading.value = false
  }
}

const addAnnotation = (annotation: CanvasAnnotation): void => {
  annotations.value = [...annotations.value, annotation]
  syncFunctionItemsFromAnnotations()
}

const updateAnnotation = (annotation: CanvasAnnotation): void => {
  annotations.value = annotations.value.map((item) => (item.id === annotation.id ? annotation : item))
  syncFunctionItemsFromAnnotations()
}

const removeAnnotation = (annotationId: string): void => {
  annotations.value = annotations.value.filter((item) => item.id !== annotationId)
  syncFunctionItemsFromAnnotations()
}

const closeContextMenu = (): void => {}

const onZoomWheel = (payload: {
  deltaPct: number
  point: {
    x: number
    y: number
  }
}): void => {
  const nextZoomPct = Math.min(
    MAX_ZOOM_PCT,
    Math.max(MIN_ZOOM_PCT, zoomPct.value + payload.deltaPct)
  )

  if (nextZoomPct === zoomPct.value) return

  wheelZoomPoint = payload.point
  zoomPct.value = nextZoomPct
}

const onResetViewport = (): void => {
  canvasEditorRef.value?.resetViewport()
}

const onRotate = (): void => {
  canvasEditorRef.value?.rotateSelectedAnnotationCCW90()
}

const toContentJson = (): ContentJsonItem[] =>
  funcItems.value
    .slice()
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((item) => ({
      annotationId: item.id,
      number: item.orderNo,
      text: item.content
    }))

const toAnnotationJson = (): CanvasAnnotation[] =>
  annotations.value
    .slice()
    .sort((left, right) => getAnnotationOrder(left) - getAnnotationOrder(right))
    .map((annotation) => ({
      id: annotation.id,
      toolType: annotation.toolType,
      color: annotation.color,
      number: annotation.number,
      order: annotation.order,
      zIndex: annotation.zIndex,
      angle: annotation.angle,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height
    }))

const showSaveToast = (type: 'success' | 'error', message: string): void => {
  if (saveToastTimeout) {
    clearTimeout(saveToastTimeout)
  }

  saveToast.value = { type, message }
  saveToastTimeout = setTimeout(() => {
    saveToast.value = null
    saveToastTimeout = null
  }, 1800)
}

const saveAnnotationDoc = async (): Promise<void> => {
  if (!curDocId.value || isSaving.value) return

  isSaving.value = true
  showSavedStatus.value = false
  try {
    const drawDataUrl = canvasEditorRef.value?.exportImageDataURL() ?? null
    const isSaved = await updateDocAnnotation({
      id: curDocId.value,
      contentJson: JSON.stringify(toContentJson()),
      annotationJson: JSON.stringify(toAnnotationJson()),
      drawDataUrl
    })

    showSaveToast(
      isSaved ? 'success' : 'error',
      isSaved ? '저장되었습니다.' : '저장에 실패했습니다.'
    )
    showSavedStatus.value = isSaved
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadDoc()
  // funcItems.value = [
  //   { id: '123123', orderNo: 1, content: '기능 1' },
  //   { id: '12313', orderNo: 2, content: '기능 2' },
  //   { id: '12314', orderNo: 3, content: '기능 3' },
  //   { id: '1', orderNo: 4, content: '기능 4' },
  //   { id: '2', orderNo: 5, content: '기능 5' },
  //   { id: '3', orderNo: 6, content: '기능 6' },
  //   { id: '4', orderNo: 7, content: '기능 7' },
  //   { id: '5', orderNo: 8, content: '기능 8' },
  //   { id: '6', orderNo: 9, content: '기능 9' },
  //   { id: '7', orderNo: 10, content: '기능 10' }
  // ]
})

watch(zoomPct, (changeZoomPct) => {
  if (wheelZoomPoint) {
    canvasEditorRef.value?.setZoomAtPoint(changeZoomPct, wheelZoomPoint)
    wheelZoomPoint = null
    return
  }

  canvasEditorRef.value?.setZoom(changeZoomPct)
})

watch(
  () => route.params.docId,
  (docId) => {
    const nextDocId = Number(docId || 0)
    if (!nextDocId || nextDocId === curDocId.value) return

    curDocId.value = nextDocId
    void loadDoc()
  }
)

watch(
  [annotations, funcItems],
  () => {
    if (isLoading.value || isSaving.value) return
    showSavedStatus.value = false
  },
  { deep: true }
)

onUnmounted(() => {
  if (saveToastTimeout) {
    clearTimeout(saveToastTimeout)
    saveToastTimeout = null
  }
})
</script>
