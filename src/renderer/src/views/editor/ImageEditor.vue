<template>
  <div class="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
    <div class="flex items-center gap-3 border-b border-white/10 bg-slate-900 p-2">
      <div class="flex grow items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          @click="goHome">
          <i-lucide-house class="text-lg" />
        </button>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>워크스페이스</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-white">{{ currGroup?.title ?? '편집' }}</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-blue-300">편집</span>
        </div>
      </div>
    </div>

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <main class="relative min-w-0 flex flex-1 overflow-hidden bg-slate-950">
        <section class="min-w-0 flex flex-1 flex-col overflow-hidden">
          <EditorTools v-model="activeTool" v-model:color-value="activeColor" />

          <CanvasEditor
            ref="canvasEditorRef"
            :image-src="currDoc?.orgnImageSrc ?? ''"
            :annotations="canvasAnnotations"
            :active-tool="activeTool"
            :active-color="activeColor"
            @add-annotation="addAnnotation"
            @update-annotation="updateAnnotation"
            @remove-annotation="removeAnno"
            @open-context-menu="openContextMenu"
            @close-context-menu="closeContextMenu"

          />

        <div
          v-if="contextMenu?.visible"
          class="absolute z-50 min-w-40 rounded-md border border-slate-700 bg-white text-sm text-slate-800 shadow-lg"
          :style="{
            left: `${contextMenu.left}px`,
            top: `${contextMenu.top}px`
          }"
        >
          <button
            type="button"
            class="block w-full px-3 py-2 text-left hover:bg-slate-100"
            @click="handleBringToFront"
          >
            맨 앞으로 가져오기
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left hover:bg-slate-100"
            @click="handleBringForward"
          >
            앞으로 가져오기기
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left hover:bg-slate-100"
            @click="handleSendBackwards">
            뒤로 보내기
          </button>
          <button
            type="button"
            class="block w-full px-3 py-2 text-left hover:bg-slate-100"
            @click="handleSendToBack"
          >
            맨 뒤로 보내기
          </button>
        </div>

          <ZoomControls
            :zoom-pct="zoomPct"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @reset-zoom="handleResetZoom"
          />
        </section>

        <FunctionList
          :is-open="isRightOpen"
          :cards="cards"
          :drag-card-id="dragCardId"
          :over-card-id="overCardId"
          @update:is-open="isRightOpen = $event"
          @update:drag-card-id="dragCardId = $event"
          @update:over-card-id="overCardId = $event"
          @move-card="moveCard"
          @remove-anno="removeAnno"
          @set-text="setText"
          @save-data="saveData"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { imageEditorDummyDocGroups, imageEditorDummyDocs } from '@/assets/dummy/data'
import type {
  AnnotationItem,
  CanvasAnnotation,
  Card,
  ContentItem,
  EditorDoc,
  EditorDocGroup,
  ToolMode
} from '@/types'

const router = useRouter()

const parseJsonMap = <T extends object>(value: string | null | undefined): Record<string, T> => {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, T>)
      : {}
  } catch {
    return {}
  }
}

const reNum = (list: Card[]): Card[] =>
  list.map((card, index) => ({
    ...card,
    number: index + 1,
    order: index + 1
  }))

// dummy rows -> editor state
const dummyGroups: EditorDocGroup[] = imageEditorDummyDocGroups.map((group) => ({
  id: String(group.id),
  title: group.name
}))

const dummyDocs: EditorDoc[] = imageEditorDummyDocs.map((doc) => ({
  id: String(doc.id),
  groupId: String(doc.group_id),
  drawImageSrc: doc.draw_img_src,
  orgnImageSrc: doc.orgn_img_src,
  title: doc.title,
  description: doc.description ?? '',
  sortOrder: doc.sort_order,
  contentMap: parseJsonMap<ContentItem>(doc.content_json),
  annoMap: parseJsonMap<AnnotationItem>(doc.annotation_json)
}))

// doc state
const groups = ref<EditorDocGroup[]>(dummyGroups)
const docs = ref<EditorDoc[]>(dummyDocs)
const docGroupId = ref(dummyGroups[0]?.id ?? '')
const docId = ref(
  dummyDocs.find((doc) => doc.groupId === (dummyGroups[0]?.id ?? ''))?.id ?? dummyDocs[0]?.id ?? ''
)

const currGroup = computed(
  () => groups.value.find((group) => group.id === docGroupId.value) ?? groups.value[0] ?? null
)
const groupDocs = computed(() =>
  docs.value
    .filter((doc) => doc.groupId === currGroup.value?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
)
const currDoc = computed(
  () => groupDocs.value.find((doc) => doc.id === docId.value) ?? groupDocs.value[0] ?? null
)

// ui state
const isRightOpen = ref(true)
const activeTool = ref<ToolMode>('number')
const DEFAULT_TOOL_COLOR = 'red'
const activeColor = ref(DEFAULT_TOOL_COLOR)
const zoomPct = ref(100)
const dragCardId = ref<string | null>(null)
const overCardId = ref<string | null>(null)
const canvasEditorRef = ref<{
  setZoom: (pct: number) => void
  resetViewport: () => void
  bringToFront: (annotationId: string) => void
  sendToBack: (annotationId: string) => void
  bringForward: (annotationId: string) => void
  sendBackwards: (annotationId: string) => void
} | null>(null)

const contextMenu = ref<{
  annotationId: string
  left: number
  top: number
  visible: boolean
} | null>(null)

// card state
const cards = ref<Card[]>([])
const canvasAnnotations = computed<CanvasAnnotation[]>(() =>
  Object.entries(currDoc.value?.annoMap ?? {})
    .map(([id, anno]) => ({
      id,
      toolType: anno.toolType ?? 'number',
      color: anno.color ?? DEFAULT_TOOL_COLOR,
      number: anno.number,
      order: anno.order,
      zIndex: anno.zIndex,
      x: anno.x ?? 0,
      y: anno.y ?? 0,
      width: anno.width,
      height: anno.height
    }))
    .filter(
      (annotation) =>
        typeof annotation.x === 'number' &&
        typeof annotation.y === 'number' &&
        (annotation.toolType === 'number' ||
          (typeof annotation.width === 'number' && typeof annotation.height === 'number'))
    )
)
const numAnnotations = computed(() =>
  Object.entries(currDoc.value?.annoMap ?? {})
    .map(([id, anno]) => ({ ...anno, id }))
    .filter((anno) => !anno.toolType || anno.toolType === 'number')
    .sort((a, b) => (a.order ?? a.number ?? 0) - (b.order ?? b.number ?? 0))
)

const syncCards = (): void => {
  const prevText = new Map(cards.value.map((card) => [card.annotationId, card.text]))
  const savedText = new Map(
    Object.entries(currDoc.value?.contentMap ?? {}).map(([id, item]) => [id, item.text])
  )

  cards.value = numAnnotations.value.map((anno, index) => ({
    annotationId: anno.id,
    number: index + 1,
    order: anno.order ?? anno.number ?? index + 1,
    text: prevText.get(anno.id) ?? savedText.get(anno.id) ?? ''
  }))
}

const applyCards = (): void => {
  if (!currDoc.value) return

  const nextAnnoMap = { ...currDoc.value.annoMap }

  for (const card of cards.value) {
    const prev = nextAnnoMap[card.annotationId] ?? {}
    nextAnnoMap[card.annotationId] = {
      ...prev,
      toolType: prev.toolType ?? 'number',
      number: card.number,
      order: card.order
    }
  }

  currDoc.value.annoMap = nextAnnoMap
  currDoc.value.contentMap = Object.fromEntries(
    cards.value.map((card) => [
      card.annotationId,
      {
        number: card.number,
        text: card.text
      }
    ])
  )
}

const moveCard = (targetId: string): void => {
  const dragId = dragCardId.value
  if (!dragId || dragId === targetId) {
    dragCardId.value = null
    overCardId.value = null
    return
  }

  const nextCards = [...cards.value]
  const dragIndex = nextCards.findIndex((card) => card.annotationId === dragId)
  const targetIndex = nextCards.findIndex((card) => card.annotationId === targetId)

  if (dragIndex < 0 || targetIndex < 0) {
    dragCardId.value = null
    overCardId.value = null
    return
  }

  const [dragCard] = nextCards.splice(dragIndex, 1)
  nextCards.splice(targetIndex, 0, dragCard)
  cards.value = reNum(nextCards)
  applyCards()

  dragCardId.value = null
  overCardId.value = null
}

const setText = (annotationId: string, text: string): void => {
  cards.value = cards.value.map((card) =>
    card.annotationId === annotationId ? { ...card, text } : card
  )
  applyCards()
}

// common actions
const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const handleZoomIn = (): void => {
  zoomPct.value = Math.min(300, zoomPct.value + 10)
  canvasEditorRef.value?.setZoom(zoomPct.value)
}

const handleZoomOut = (): void => {
  zoomPct.value = Math.max(10, zoomPct.value - 10)
  canvasEditorRef.value?.setZoom(zoomPct.value)
}

const handleResetZoom = (): void => {
  canvasEditorRef.value?.resetViewport()
  zoomPct.value = 100
  canvasEditorRef.value?.setZoom(zoomPct.value)
}

const openContextMenu = (payload: {
  annotationId: string
  left: number
  top: number
}): void => {
  contextMenu.value = {
    annotationId: payload.annotationId,
    left: payload.left,
    top: payload.top,
    visible: true
  }
}

const closeContextMenu = (): void => {
  contextMenu.value = null
}

const handleBringToFront = (): void => {
  const annotationId = contextMenu.value?.annotationId
  if (!annotationId) return

  canvasEditorRef.value?.bringToFront(annotationId)
  reorderAnnotationZIndex(annotationId, 'front')
  closeContextMenu()
}

const handleSendToBack = (): void => {
  const annotationId = contextMenu.value?.annotationId
  if (!annotationId) return

  canvasEditorRef.value?.sendToBack(annotationId)
  reorderAnnotationZIndex(annotationId, 'back')
  closeContextMenu()
}

const handleBringForward = (): void => {
  const annotationId = contextMenu.value?.annotationId
  if (!annotationId) return

  canvasEditorRef.value?.bringForward(annotationId)
  reorderAnnotationZIndex(annotationId, 'forward')
  closeContextMenu()
}

const handleSendBackwards = (): void => {
  const annotationId = contextMenu.value?.annotationId
  if (!annotationId) return

  canvasEditorRef.value?.sendBackwards(annotationId)
  reorderAnnotationZIndex(annotationId, 'backward')
  closeContextMenu()
}


const nextNum = (): number => cards.value.length + 1

const removeAnno = (annotationId: string): void => {
  const doc = currDoc.value
  if (!doc) return

  const nextAnnoMap = { ...doc.annoMap }
  delete nextAnnoMap[annotationId]
  doc.annoMap = nextAnnoMap

  const nextContentMap = { ...doc.contentMap }
  delete nextContentMap[annotationId]
  doc.contentMap = nextContentMap

  cards.value = reNum(cards.value.filter((card) => card.annotationId !== annotationId))
  applyCards()
}

const addAnnotation = (annotation: CanvasAnnotation): void => {
  if (!currDoc.value) return

  currDoc.value.annoMap = {
    ...currDoc.value.annoMap,
    [annotation.id]: {
      ...annotation,
      zIndex: annotation.zIndex ?? Object.keys(currDoc.value.annoMap).length + 1
    }
  }

  if (annotation.toolType === 'number') {
    currDoc.value.contentMap = {
      ...currDoc.value.contentMap,
      [annotation.id]: {
        number: annotation.number ?? nextNum(),
        text: currDoc.value.contentMap[annotation.id]?.text ?? ''
      }
    }
  }
}


const updateAnnotation = (annotation: CanvasAnnotation): void => {
  if (!currDoc.value) return

  const prev = currDoc.value.annoMap[annotation.id] ?? { id: annotation.id }
  currDoc.value.annoMap = {
    ...currDoc.value.annoMap,
    [annotation.id]: {
      ...prev,
      ...annotation
    }
  }
}

const reorderAnnotationZIndex = (
  annotationId: string,
  action: 'front' | 'back' | 'forward' | 'backward'
): void => {
  if (!currDoc.value) return

  const entries = Object.entries(currDoc.value.annoMap)
    .map(([id, anno]) => ({
      id,
      ...anno
    }))
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  const currentIndex = entries.findIndex((item) => item.id === annotationId)
  if (currentIndex < 0) return

  const [target] = entries.splice(currentIndex, 1)

  if (action === 'front') {
    entries.push(target)
  } else if (action === 'back') {
    entries.unshift(target)
  } else if (action === 'forward') {
    const nextIndex = Math.min(entries.length, currentIndex + 1)
    entries.splice(nextIndex, 0, target)
  } else if (action === 'backward') {
    const nextIndex = Math.max(0, currentIndex - 1)
    entries.splice(nextIndex, 0, target)
  }

  currDoc.value.annoMap = Object.fromEntries(
    entries.map((item, index) => [
      item.id,
      {
        ...currDoc.value!.annoMap[item.id],
        zIndex: index + 1
      }
    ])
  )
}


// save
const saveData = async (): Promise<void> => {

}

watch(
  () => currDoc.value?.id,
  () => {
    syncCards()
    zoomPct.value = 100
    canvasEditorRef.value?.resetViewport()
    canvasEditorRef.value?.setZoom(zoomPct.value)
  },
  { immediate: true }
)

watch(
  numAnnotations,
  () => {
    syncCards()
  },
  { deep: true }
)
</script>
