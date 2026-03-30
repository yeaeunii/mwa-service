<template>
  <div class="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
    <div class="flex items-center gap-3 border-b border-white/10 bg-slate-900 p-2">
      <div class="flex grow items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          @click="goHome"
        >
          <i-lucide-house class="text-lg" />
        </button>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>워크스페이스</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-white">{{ currentFolder.title }}</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-blue-300">편집</span>
        </div>
      </div>

      <button
        type="button"
        class="btn border-0 bg-slate-700 text-white shadow-none hover:bg-slate-600"
        @click="goEditorOverview"
      >
        <i-lucide-layout-grid class="text-sm" />
        화면 목록
      </button>
    </div>

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 text-lg font-bold text-white">문서 폴더 목록</div>
        <div class="flex-1 space-y-2 overflow-y-auto">
          <div
            v-for="folder in selectedFolders"
            :key="folder.id"
            class="overflow-hidden rounded-xl border transition-colors"
            :class="
              folder.id === selectedFolderId
                ? 'border-blue-400/60 bg-slate-800'
                : 'border-white/10 bg-slate-900'
            "
          >
            <div class="flex items-center gap-2 px-3 py-2">
              <button type="button" class="min-w-0 flex-1 text-left" @click="selectFolder(folder.id)">
                <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
                <div class="text-xs text-slate-400">{{ folder.screenshots.length }}개 선택됨</div>
              </button>
              <div class="badge border-0 bg-rose-500 text-white">{{ folder.screenshots.length }}</div>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700"
                @click.stop="toggleFolderExpanded(folder.id)"
              >
                <i-lucide-chevron-up v-if="isFolderExpanded(folder.id)" class="text-sm" />
                <i-lucide-chevron-down v-else class="text-sm" />
              </button>
            </div>

            <div
              v-if="isFolderExpanded(folder.id)"
              class="border-t border-white/10 bg-slate-950/40 px-2 py-2"
            >
              <div class="space-y-2">
                <button
                  v-for="(screenshot, index) in folder.screenshots"
                  :key="screenshot.id"
                  type="button"
                  class="flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors"
                  :class="
                    screenshot.id === selectedScreenshotId
                      ? 'border-blue-400/60 bg-slate-800'
                      : 'border-white/10 bg-slate-900 hover:border-white/20'
                  "
                  @click="selectScreenshot(screenshot.id)"
                >
                  <div
                    class="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-800"
                  >
                    <img :src="screenshot.image" alt="" class="h-full w-full object-cover" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-xs font-semibold text-white">
                      {{ screenshot.pageNo ?? index + 1 }}. {{ screenshot.pageTitle || folder.title }}
                    </div>
                    <div class="truncate text-[11px] text-slate-400">
                      {{ screenshot.menuPath || '메뉴 경로 없음' }}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-auto space-y-2 border-t border-white/10 pt-4">
          <button
            type="button"
            class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
            @click="goWorkspace"
          >
            <i-lucide-layout-grid class="text-sm" />
            목록으로
          </button>
        </div>
      </aside>

      <button
        type="button"
        class="absolute left-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
        :class="isLeftSidebarOpen ? 'translate-x-72' : 'translate-x-0'"
        @click="isLeftSidebarOpen = !isLeftSidebarOpen"
      >
        <i-lucide-chevron-left v-if="isLeftSidebarOpen" class="text-sm" />
        <i-lucide-chevron-right v-else class="text-sm" />
      </button>

      <main class="relative min-w-0 flex flex-1 overflow-hidden bg-slate-950">
        <section class="min-w-0 flex flex-1 flex-col overflow-hidden">

          <div class="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
            <!-- 중앙 툴바-->

            <div class="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-6">
              <div class="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2">
                <button
                  type="button"
                  class="btn btn-sm border-0 shadow-none"
                  :class="activeTool === 'number' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'"
                  @click="setActiveTool('number')"
                >
                  Number
                </button>
                <button
                  type="button"
                  class="btn btn-sm border-0 shadow-none"
                  :class="activeTool === 'box' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'"
                  @click="setActiveTool('box')"
                >
                  Box
                </button>
              </div>
            </div>

            <div
              ref="canvasHostRef"
              class="absolute inset-0 overflow-hidden bg-slate-950"
              @wheel.prevent="handleCanvasWheel"
              @contextmenu.prevent
            >
              <!-- Fabric canvas  -->
              <canvas ref="fabricCanvasRef" class="absolute inset-0 h-full w-full"></canvas>
            </div>


            <div class="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-6">
              <div class="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 shadow-lg">
                <button
                  type="button"
                  class="btn btn-sm h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
                  @click="zoomOut"
                >
                  <i-lucide-minus class="text-sm" />
                </button>
                <button
                  type="button"
                  class="btn btn-sm h-9 border-0 bg-slate-800 px-3 text-sm text-slate-100 shadow-none hover:bg-slate-700"
                  @click="resetZoom"
                >
                  {{ zoomPercent }}%
                </button>
                <button
                  type="button"
                  class="btn btn-sm h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
                  @click="zoomIn"
                >
                  <i-lucide-plus class="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside
          class="flex w-[22rem] shrink-0 flex-col border-l border-white/10 bg-slate-900 transition-all duration-200"
          :class="isDescriptionOpen ? 'translate-x-0' : 'translate-x-full'"
        >
  
          <div class="flex items-center justify-start gap-1 border-b border-white/10 px-4 py-2">
            <div class="mx-1 h-7 w-px bg-white/10"></div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-100 transition hover:bg-[#52627e]"
              @click="undoMarker"
            >
              <i-lucide-undo-2 class="text-base" />
            </button>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-100 transition hover:bg-[#52627e]"
              @click="redoMarker"
            >
              <i-lucide-redo-2 class="text-base" />
            </button>
          </div>
          <div class="border-b border-white/10 px-4 py-3">
            <div class="flex items-center gap-2 text-base font-bold text-white">
              <i-lucide-notebook-tabs class="text-sm text-blue-400" />
              기능 설명 리스트
            </div>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            <div
              v-for="annotation in descriptionAnnotations"
              :key="annotation.id"
              :ref="setDescriptionItemRef(annotation.id)"
              class="rounded-xl border bg-slate-800/80 p-3 transition-colors"
              :class="annotation.description.trim() ? 'border-white/10' : 'border-red-300/50'"
            >
              <div class="mb-2.5 flex items-center gap-2">
                <div class="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {{ annotation.number }}
                </div>
                <div class="text-xs font-semibold text-white">STEP {{ annotation.number }}</div>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost ml-auto text-rose-300 shadow-none hover:bg-transparent"
                  @click="removeMarker(annotation.id)"
                >
                  <i-lucide-trash-2 class="text-xs" />
                </button>
              </div>

              <input
                :ref="setInputRef(annotation.id)"
                :value="annotation.description"
                type="text"
                class="input input-sm w-full border bg-slate-900/80 text-white shadow-none"
                :class="annotation.description.trim() ? 'border-white/10' : 'border-red-300/50'"
                placeholder="기능 설명을 입력하세요..."
                @input="updateDescription(annotation.id, ($event.target as HTMLInputElement).value)"
                @focus="focusAnnotation(annotation.id)"
              />
            </div>
          </div>

          <div class="border-t border-white/10 p-4">
            <button
              type="button"
              class="btn w-full border-0 bg-blue-900 text-white shadow-none hover:bg-blue-900"
              @click="saveDescriptions"
            >
              <i-lucide-save class="text-sm" />
              설명 저장하기
            </button>
          </div>
        </aside>

        <button
          type="button"
          class="absolute right-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
          :class="isDescriptionOpen ? '-translate-x-[22rem]' : 'translate-x-0'"
          @click="isDescriptionOpen = !isDescriptionOpen"
        >
          <i-lucide-chevron-right v-if="isDescriptionOpen" class="text-sm" />
          <i-lucide-chevron-left v-else class="text-sm" />
        </button>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Canvas, Circle, FabricImage, FabricText, Group, Point } from 'fabric'
import {
  createSelectionFromFolders,
  getSelectedFolders,
  reindexNumberAnnotations,
  toFileImageSrc,
  type WorkspaceAnnotation,
  type WorkspaceFolder,
  type WorkspaceScreenshot
} from '@/utils/manualWorkspace'

type ToolMode = 'number' | 'box'
type FabricEditorObject = Group

interface ProjectRecord {
  id: string
  name: string
  description: string
}

interface WorkspaceResponse {
  project: ProjectRecord | null
  folders: Array<{
    id: string
    title: string
    path: string
    description: string
    area_type: 'capture' | 'document'
    screenshots: Array<{
      id: string
      image_path: string
      image_src?: string
      page_title: string
      menu_path: string
      screen_description: string
      functionality_description: string
      writer_name: string
      page_no: number
      is_selected: number
      annotations: Array<{
        id: string
        marker_no: number | null
        x: number
        y: number
        width: number | null
        height: number | null
        description: string
        tool_type: 'number' | 'box'
      }>
    }>
  }>
}

const router = useRouter()
const route = useRoute()

// 공통색상과 줌 범위 설정
const ANNOTATION_STROKE = '#f43f5e'
const MIN_RELATIVE_ZOOM = 1
const MAX_RELATIVE_ZOOM = 8
const ZOOM_STEP = 1.12

const projectId = computed(() => String(route.query.projectId ?? ''))
const currentProject = ref<ProjectRecord | null>(null)
const folders = ref<WorkspaceFolder[]>([])
const selectedForManual = ref<Record<string, string[]>>({})
const selectedFolders = computed(() => getSelectedFolders(folders.value, selectedForManual.value))


const selectedFolderId = ref(String(route.query.documentFolderId ?? route.query.folderId ?? ''))
const selectedScreenshotId = ref(String(route.query.screenshotId ?? ''))
const isLeftSidebarOpen = ref(true)
const isDescriptionOpen = ref(true)
const isThumbnailOpen = ref(true)
const expandedFolderIds = ref<string[]>([])
const activeTool = ref<ToolMode>('number')
const zoomScale = ref(1)
const focusedAnnotationId = ref<string | null>(null)
const removedStack = ref<WorkspaceAnnotation[]>([])

const canvasHostRef = ref<HTMLDivElement | null>(null)
const fabricCanvasRef = ref<HTMLCanvasElement | null>(null)
const fabricCanvas = ref<Canvas | null>(null)
const backgroundImage = ref<FabricImage | null>(null)
const sceneWidth = ref(1)
const sceneHeight = ref(1)
const lastRenderedScreenshotId = ref('')
const descriptionItemRefs = ref<Record<string, HTMLElement | null>>({})
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})

const fallbackScreenshot: WorkspaceScreenshot = {
  id: '',
  image: '',
  filePath: '',
  isSelected: false,
  annotations: []
}

const fallbackFolder: WorkspaceFolder = {
  id: '',
  title: '선택된 폴더 없음',
  path: '',
  description: '',
  screenshots: [fallbackScreenshot]
}

const mapWorkspaceFolders = (response: WorkspaceResponse): WorkspaceFolder[] =>
  response.folders
    .filter((folder) => folder.area_type === 'document')
    .map((folder) => ({
    id: folder.id,
    title: folder.title,
    path: folder.path,
    description: folder.description,
    screenshots: folder.screenshots.map((screenshot) => ({
      id: screenshot.id,
      image: screenshot.image_src ?? toFileImageSrc(screenshot.image_path),
      filePath: screenshot.image_path,
      isSelected: screenshot.is_selected === 1,
      pageTitle: screenshot.page_title,
      menuPath: screenshot.menu_path,
      screenDescription: screenshot.screen_description,
      functionalityDescription: screenshot.functionality_description,
      writerName: screenshot.writer_name,
      pageNo: screenshot.page_no,
      annotations: screenshot.annotations.map((annotation) => ({
        id: annotation.id,
        number: annotation.marker_no ?? 0,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width ?? undefined,
        height: annotation.height ?? undefined,
        description: annotation.description,
        toolType: annotation.tool_type
      }))
    }))
    }))

const currentFolder = computed(
  () => selectedFolders.value.find((folder) => folder.id === selectedFolderId.value) ?? selectedFolders.value[0] ?? fallbackFolder
)
const currentScreenshot = computed(
  () =>
    currentFolder.value.screenshots.find((shot) => shot.id === selectedScreenshotId.value) ??
    currentFolder.value.screenshots[0] ??
    fallbackScreenshot
)
const currentAnnotations = computed<WorkspaceAnnotation[]>(() =>
  [...currentScreenshot.value.annotations]
    .filter((annotation) => annotation.toolType !== 'box')
    .sort((left, right) => left.number - right.number)
)
const descriptionAnnotations = computed(() => currentAnnotations.value)
const zoomPercent = computed(() => Math.round(zoomScale.value * 100))

// canvas가 실제 그려질 픽셀 크기 계산
const getCanvasDimensions = (): { width: number; height: number } => ({
  width: canvasHostRef.value?.clientWidth ?? 1,
  height: canvasHostRef.value?.clientHeight ?? 1
})

const getBaseZoom = (): number => {
  const { width, height } = getCanvasDimensions()
  return Math.min(width / sceneWidth.value, height / sceneHeight.value)
}

// 화면에 맞춰진 기본 줌과 사용자가 추가로 조절한 줌 배율을 합쳐 실제 배율을 만든다.
const getAbsoluteZoom = (): number => Math.max(getBaseZoom() * zoomScale.value, 0.0001)

const syncSelectionFromRoute = (): void => {
  selectedFolderId.value = String(route.query.documentFolderId ?? route.query.folderId ?? '')
  selectedScreenshotId.value = String(route.query.screenshotId ?? '')
}

const clampRelativeZoom = (value: number): number =>
  Math.min(Math.max(Number(value.toFixed(3)), MIN_RELATIVE_ZOOM), MAX_RELATIVE_ZOOM)

const clampViewport = (): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  // 줌 이후 화면이 너무 바깥으로 밀리지 않도록 viewport를 다시 가운데 범위로 고정한다.
  const viewport = canvas.viewportTransform
  if (!viewport) return

  const { width, height } = getCanvasDimensions()
  const zoom = canvas.getZoom()
  const scaledWidth = sceneWidth.value * zoom
  const scaledHeight = sceneHeight.value * zoom

  viewport[4] =
    scaledWidth <= width
      ? (width - scaledWidth) / 2
      : Math.min(0, Math.max(width - scaledWidth, viewport[4]))
  viewport[5] =
    scaledHeight <= height
      ? (height - scaledHeight) / 2
      : Math.min(0, Math.max(height - scaledHeight, viewport[5]))

  canvas.setViewportTransform(viewport)
}

const applyViewport = (): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  // 이미지 중앙 배치
  const { width, height } = getCanvasDimensions()
  const zoom = getAbsoluteZoom()
  const offsetX = (width - sceneWidth.value * zoom) / 2
  const offsetY = (height - sceneHeight.value * zoom) / 2

  canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY])
  canvas.requestRenderAll()
}

const updateCanvasInteractionMode = (): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  canvas.skipTargetFind = false
  canvas.selection = false

  const background = backgroundImage.value
  canvas.getObjects().forEach((item) => {
    if (background && item === (background as unknown as typeof item)) return

    item.set({
      selectable: false,
      evented: true
    })
  })

  canvas.discardActiveObject()

  canvas.requestRenderAll()
}

const zoomAtViewportPoint = (point: Point, nextRelativeZoom: number): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  // 휠을 굴린 위치를 기준으로 zoomToPoint를 적용한다.
  zoomScale.value = clampRelativeZoom(nextRelativeZoom)
  canvas.zoomToPoint(point, getAbsoluteZoom())
  clampViewport()
  canvas.requestRenderAll()
}

const zoomIn = (): void => {
  const { width, height } = getCanvasDimensions()
  zoomAtViewportPoint(new Point(width / 2, height / 2), zoomScale.value * ZOOM_STEP)
}

const zoomOut = (): void => {
  const { width, height } = getCanvasDimensions()
  zoomAtViewportPoint(new Point(width / 2, height / 2), zoomScale.value / ZOOM_STEP)
}

const resetZoom = (): void => {
  zoomScale.value = 1
  applyViewport()
}

const handleCanvasWheel = (event: WheelEvent): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  // 확대/축소는 이미지와 도형이 함께 움직이도록 Fabric viewport에 직접 적용한다.
  const pointer = canvas.getViewportPoint(event)
  const nextRelativeZoom = event.deltaY < 0 ? zoomScale.value * ZOOM_STEP : zoomScale.value / ZOOM_STEP
  zoomAtViewportPoint(pointer, nextRelativeZoom)
}

const loadWorkspaceFromDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  const response = (await window.api.invoke('workspace:get', {
    projectId: projectId.value
  })) as WorkspaceResponse

  currentProject.value = response.project
  folders.value = mapWorkspaceFolders(response)
  selectedForManual.value = createSelectionFromFolders(folders.value)
}

const syncFoldersToDatabase = async (): Promise<void> => {
  if (!projectId.value || !currentProject.value) return

  await window.api.invoke('capture:syncFolders', {
    projectId: projectId.value,
    projectName: currentProject.value.name,
    projectDescription: currentProject.value.description,
    areaScope: 'document',
    folders: folders.value.map((folder, index) => ({
      id: folder.id,
      title: folder.title,
      description: folder.description,
      path: folder.path,
      areaType: 'document',
      sortOrder: index
    }))
  })
}

const persistAnnotationsForScreenshot = async (screenshot: WorkspaceScreenshot): Promise<void> => {
  await window.api.invoke('annotation:replace', {
    captureId: screenshot.id,
    annotations: screenshot.annotations.map((annotation) => ({
      id: annotation.id,
      toolType: annotation.toolType ?? 'number',
      markerNo: annotation.toolType === 'box' ? null : annotation.number,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width ?? null,
      height: annotation.height ?? null,
      description: annotation.description
    }))
  })
}

const ensureCurrentSelection = (): void => {
  if (selectedScreenshotId.value) {
    const matchedFolder = selectedFolders.value.find((folder) =>
      folder.screenshots.some((shot) => shot.id === selectedScreenshotId.value)
    )

    if (matchedFolder) {
      selectedFolderId.value = matchedFolder.id
      return
    }
  }

  const folder = selectedFolders.value.find((item) => item.id === selectedFolderId.value) ?? selectedFolders.value[0]
  if (!folder) {
    selectedFolderId.value = ''
    selectedScreenshotId.value = ''
    return
  }

  selectedFolderId.value = folder.id

  const nextScreenshotId =
    folder.screenshots.find((shot) => shot.id === selectedScreenshotId.value)?.id ?? folder.screenshots[0]?.id
  selectedScreenshotId.value = nextScreenshotId ?? ''
}

const ensureExpandedFolder = (): void => {
  const currentId = selectedFolderId.value
  if (!currentId) return
  if (!expandedFolderIds.value.includes(currentId)) {
    expandedFolderIds.value = [...expandedFolderIds.value, currentId]
  }
}

const patchCurrentFolder = (updater: (folder: WorkspaceFolder) => WorkspaceFolder): void => {
  folders.value = folders.value.map((folder) => (folder.id === currentFolder.value.id ? updater(folder) : folder))
  void syncFoldersToDatabase()
}

const patchCurrentScreenshot = (updater: (screenshot: WorkspaceScreenshot) => WorkspaceScreenshot): void => {
  let nextScreenshot: WorkspaceScreenshot | null = null

  folders.value = folders.value.map((folder) => {
    if (folder.id !== currentFolder.value.id) return folder

    return {
      ...folder,
      screenshots: folder.screenshots.map((shot) => {
        if (shot.id !== currentScreenshot.value.id) return shot
        nextScreenshot = updater(shot)
        return nextScreenshot
      })
    }
  })

  if (nextScreenshot) {
    void persistAnnotationsForScreenshot(nextScreenshot)
  }
}

const reindexAnnotations = (items: WorkspaceAnnotation[]): WorkspaceAnnotation[] =>
  reindexNumberAnnotations(items)

const createNumberObject = (annotation: WorkspaceAnnotation): Group => {
  // number는 원형 배지 + 숫자 텍스트를 하나의 Group으로 묶어서 그린다.
  const circle = new Circle({
    radius: 20,
    fill: ANNOTATION_STROKE,
    stroke: '#ffffff',
    strokeWidth: 3,
    originX: 'center',
    originY: 'center'
  })

  const text = new FabricText(String(annotation.number), {
    fontSize: 15,
    fontWeight: '700',
    fill: '#ffffff',
    originX: 'center',
    originY: 'center'
  })

  const group = new Group([circle, text], {
    left: annotation.x * sceneWidth.value,
    top: annotation.y * sceneHeight.value,
    originX: 'center',
    originY: 'center',
    hasControls: false,
    hasBorders: false,
    lockScalingX: true,
    lockScalingY: true,
    borderColor: ANNOTATION_STROKE,
    cornerColor: ANNOTATION_STROKE,
    cornerStrokeColor: '#ffffff',
    transparentCorners: false
  })

  group.set('annotationId', annotation.id)
  group.set('toolType', 'number')
  return group
}

const redrawFabricObjects = (): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  // 현재 screenshot의 annotation 배열을 기준으로 Fabric object를 전부 다시 만든다.
  const background = backgroundImage.value
  const removableObjects = canvas
    .getObjects()
    .filter((item) => !background || item !== (background as unknown as typeof item))
  removableObjects.forEach((item) => canvas.remove(item))

  currentAnnotations.value
    .filter((annotation) => annotation.toolType !== 'box')
    .forEach((annotation) => {
      canvas.add(createNumberObject(annotation))
    })

  if (backgroundImage.value) {
    canvas.sendObjectToBack(backgroundImage.value as never)
  }

  updateCanvasInteractionMode()
  canvas.requestRenderAll()
}

const syncAnnotationFromObject = (object: FabricEditorObject): void => {
  const annotationId = (object as unknown as { annotationId?: string }).annotationId
  if (!annotationId) return

  // Fabric에서 이동된 number 마커 결과를 다시 annotation 데이터로 환산해 저장한다.
  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: screenshot.annotations.map((annotation) => {
      if (annotation.id !== annotationId) return annotation

      return {
        ...annotation,
        toolType: 'number',
        x: (object.left ?? 0) / sceneWidth.value,
        y: (object.top ?? 0) / sceneHeight.value
      }
    })
  }))
}

const selectAnnotation = async (annotationId: string): Promise<void> => {
  // canvas에서 선택한 주석과 우측 리스트 항목을 느슨하게 연결한다.
  focusedAnnotationId.value = annotationId
  await nextTick()
  descriptionItemRefs.value[annotationId]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
}

const focusAnnotation = async (annotationId: string): Promise<void> => {
  // 우측 input에 포커스가 갔을 때 반대로 canvas 오브젝트도 활성화한다.
  await selectAnnotation(annotationId)
  const canvas = fabricCanvas.value
  const activeObject = canvas
    ?.getObjects()
    .find((item) => (item as unknown as { annotationId?: string }).annotationId === annotationId)

  if (activeObject && canvas) {
    canvas.setActiveObject(activeObject)
    canvas.requestRenderAll()
  }

  await nextTick()
  inputRefs.value[annotationId]?.focus()
}

const addNumberAnnotation = (left: number, top: number): void => {
  // number 도구는 클릭 위치를 비율 좌표로 저장해서 해상도가 바뀌어도 위치를 유지한다.
  const nextAnnotation: WorkspaceAnnotation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    number: currentAnnotations.value.length + 1,
    x: Math.min(Math.max(left / sceneWidth.value, 0.01), 0.99),
    y: Math.min(Math.max(top / sceneHeight.value, 0.01), 0.99),
    description: '',
    toolType: 'number'
  }

  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: [...screenshot.annotations, nextAnnotation]
  }))

  removedStack.value = []
  redrawFabricObjects()
  void focusAnnotation(nextAnnotation.id)
}

const removeMarker = (annotationId: string): void => {
  // 삭제 시에는 undo를 위해 removedStack에도 함께 쌓아둔다.
  const removed = currentAnnotations.value.find((item) => item.id === annotationId)
  if (!removed) return

  removedStack.value = [...removedStack.value, removed]
  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: reindexAnnotations(screenshot.annotations.filter((item) => item.id !== annotationId))
  }))

  if (focusedAnnotationId.value === annotationId) {
    focusedAnnotationId.value = null
  }

  redrawFabricObjects()
}

const undoMarker = (): void => {
  if (currentAnnotations.value.length === 0) return
  removeMarker(currentAnnotations.value[currentAnnotations.value.length - 1].id)
}

const redoMarker = (): void => {
  const restored = removedStack.value[removedStack.value.length - 1]
  if (!restored) return

  removedStack.value = removedStack.value.slice(0, -1)
  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: reindexAnnotations([...screenshot.annotations, restored])
  }))

  redrawFabricObjects()
}

const updateDescription = (annotationId: string, description: string): void => {
  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: screenshot.annotations.map((item) => (item.id === annotationId ? { ...item, description } : item))
  }))
}

const buildFunctionalityDescription = (): string =>
  currentAnnotations.value
    .filter((annotation) => annotation.description.trim())
    .sort((left, right) => left.number - right.number)
    .map((annotation) => `${annotation.number}. ${annotation.description.trim()}`)
    .join('\n')

const exportCanvasAtSceneSize = (): string | null => {
  const canvas = fabricCanvas.value
  if (!canvas) return null

  const previousDimensions = {
    width: canvas.getWidth(),
    height: canvas.getHeight()
  }
  const previousViewport = canvas.viewportTransform ? [...canvas.viewportTransform] : null

  canvas.discardActiveObject()
  canvas.setDimensions({
    width: sceneWidth.value,
    height: sceneHeight.value
  })
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.renderAll()

  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 1
  })

  canvas.setDimensions(previousDimensions)
  if (previousViewport) {
    canvas.setViewportTransform(previousViewport)
  }
  canvas.renderAll()

  return dataUrl
}

const saveDescriptions = async (): Promise<void> => {
  const canvas = fabricCanvas.value
  if (!canvas || !currentScreenshot.value.filePath) return

  const functionalityDescription = buildFunctionalityDescription()
  const dataUrl = exportCanvasAtSceneSize()
  if (!dataUrl) return

  await window.api.invoke('capture:updateMeta', {
    captureId: currentScreenshot.value.id,
    pageTitle: currentScreenshot.value.pageTitle ?? currentFolder.value.title,
    menuPath: currentScreenshot.value.menuPath ?? '',
    screenDescription: currentScreenshot.value.screenDescription ?? '',
    functionalityDescription,
    writerName: currentScreenshot.value.writerName ?? '',
    pageNo: currentScreenshot.value.pageNo ?? 1
  })

  await window.api.invoke('capture:overwriteImage', {
    filePath: currentScreenshot.value.filePath,
    dataUrl
  })

  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    image: dataUrl,
    functionalityDescription
  }))

  await goEditorOverview()
}

const updateFolderPath = (path: string): void => {
  patchCurrentFolder((folder) => ({
    ...folder,
    path
  }))
}

const updateFolderDescription = (description: string): void => {
  patchCurrentFolder((folder) => ({
    ...folder,
    description
  }))
}

const selectFolder = (id: string): void => {
  selectedFolderId.value = id
  ensureCurrentSelection()
  ensureExpandedFolder()
  focusedAnnotationId.value = null
}

const selectScreenshot = (id: string): void => {
  selectedScreenshotId.value = id
  ensureExpandedFolder()
  zoomScale.value = 1
  focusedAnnotationId.value = null
}

const isFolderExpanded = (folderId: string): boolean => expandedFolderIds.value.includes(folderId)

const toggleFolderExpanded = (folderId: string): void => {
  expandedFolderIds.value = expandedFolderIds.value.includes(folderId)
    ? expandedFolderIds.value.filter((id) => id !== folderId)
    : [...expandedFolderIds.value, folderId]
}

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goWorkspace = async (): Promise<void> => {
  await router.push({
    name: 'editor-index',
    query: {
      projectId: projectId.value,
      documentFolderId: selectedFolderId.value || undefined
    }
  })
}

const goEditorOverview = async (): Promise<void> => {
  await router.push({
    name: 'editor-index',
    query: {
      projectId: projectId.value,
      documentFolderId: selectedFolderId.value || undefined,
      screenshotId: selectedScreenshotId.value || undefined,
      refreshTs: String(Date.now())
    }
  })
}

const setActiveTool = (tool: ToolMode): void => {
  // 툴을 바꾸면 Fabric 선택 가능 여부도 같이 바꿔준다.
  activeTool.value = tool
  const canvas = fabricCanvas.value
  if (!canvas) return
  canvas.discardActiveObject()
  focusedAnnotationId.value = null
  updateCanvasInteractionMode()
}

const setDescriptionItemRef =
  (annotationId: string) =>
  (element: Element | ComponentPublicInstance | null): void => {
    descriptionItemRefs.value[annotationId] = element as HTMLElement | null
  }

const setInputRef =
  (annotationId: string) =>
  (element: Element | ComponentPublicInstance | null): void => {
    inputRefs.value[annotationId] = element as HTMLInputElement | null
  }

const loadSceneBackground = async (): Promise<void> => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  canvas.getObjects().forEach((item) => canvas.remove(item))

  if (!currentScreenshot.value.image) {
    backgroundImage.value = null
    sceneWidth.value = 1
    sceneHeight.value = 1
    return
  }

  const image = await FabricImage.fromURL(currentScreenshot.value.image)
  image.set({
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    hoverCursor: 'default'
  })

  sceneWidth.value = image.width || 1
  sceneHeight.value = image.height || 1

  backgroundImage.value = image
  canvas.add(image)
  canvas.sendObjectToBack(image as never)
}

const renderEditorScene = async (): Promise<void> => {
  await nextTick()
  const canvas = fabricCanvas.value
  if (!canvas || !canvasHostRef.value) return

  // annotation 초기화
  const { width, height } = getCanvasDimensions()
  canvas.setDimensions({ width, height })
  await loadSceneBackground()
  redrawFabricObjects()
  applyViewport()
}

const setupCanvasEvents = (): void => {
  const canvas = fabricCanvas.value
  if (!canvas) return

  canvas.on('mouse:down', (event) => {
    const target = event.target as FabricEditorObject | undefined

    // 우클릭 삭제
    if ((event.e as MouseEvent).button === 2) {
      const annotationId = target && (target as unknown as { annotationId?: string }).annotationId
      if (annotationId) {
        removeMarker(annotationId)
      }
      return
    }

    // 기존 도형 위에 새로 만들지X
    if (target) {
      
      return
    }

    const pointer = canvas.getScenePoint(event.e)
    if (activeTool.value === 'number') {
      addNumberAnnotation(pointer.x, pointer.y)
      return
    }
  })

  canvas.on('selection:created', () => {
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  })

  canvas.on('selection:updated', () => {
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  })

  canvas.on('selection:cleared', () => {
    focusedAnnotationId.value = null
  })

  canvas.on('object:modified', (event) => {
    const target = event.target as FabricEditorObject | undefined
    if (!target) return
    syncAnnotationFromObject(target)
    focusedAnnotationId.value = null
    redrawFabricObjects()
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  })

  canvas.on('mouse:up', () => {
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  })
}

const syncSceneIfNeeded = async (): Promise<void> => {
  ensureCurrentSelection()

  // 현재 폴더/스크린샷 조합이 바뀌었을 때만 scene 전체를 다시 초기화한다.
  const sceneKey = `${currentFolder.value.id}:${currentScreenshot.value.id}`
  if (lastRenderedScreenshotId.value === sceneKey) {
    redrawFabricObjects()
    applyViewport()
    return
  }

  lastRenderedScreenshotId.value = sceneKey
  await renderEditorScene()
}

watch(
  () => [selectedFolderId.value, selectedScreenshotId.value, currentAnnotations.value.length],
  async () => {
    await syncSceneIfNeeded()
  },
  { immediate: true }
)

onMounted(async () => {
  if (!fabricCanvasRef.value) return

  syncSelectionFromRoute()
  fabricCanvas.value = new Canvas(fabricCanvasRef.value, {
    preserveObjectStacking: true,
    selection: false,
    targetFindTolerance: 10
  })

  setupCanvasEvents()
  await loadWorkspaceFromDatabase()
  ensureCurrentSelection()
  ensureExpandedFolder()
  await syncSceneIfNeeded()
  updateCanvasInteractionMode()

  window.addEventListener('resize', applyViewport)
})

onBeforeUnmount(() => {
  // 화면을 벗어날 때 Fabric 인스턴스와 resize 이벤트를 정리한다.
  window.removeEventListener('resize', applyViewport)
  fabricCanvas.value?.dispose()
  fabricCanvas.value = null
})

watch(
  () => route.fullPath,
  async () => {
    syncSelectionFromRoute()
    await loadWorkspaceFromDatabase()
    ensureCurrentSelection()
    ensureExpandedFolder()
    focusedAnnotationId.value = null
    zoomScale.value = 1
    await syncSceneIfNeeded()
  }
)
</script>
