<template>
  <div ref="editorFrame" class="relative min-h-0 flex-1 overflow-hidden bg-white" @wheel="onWheel">
    <div class="absolute inset-0 overflow-hidden bg-white" @contextmenu.prevent>
      <div class="flex h-full w-full items-center justify-center p-4">
        <div class="relative inline-block">
          <canvas ref="canvasEl" class="border border-white/10"></canvas>

          <div
            v-if="contextMenu"
            class="absolute z-50 w-36 overflow-hidden rounded-lg border border-base-content/10 bg-base-100 py-1 text-xs shadow-xl"
            :style="{
              left: `${contextMenu.left}px`,
              top: `${contextMenu.top}px`
            }"
            @mousedown.stop
            @contextmenu.prevent.stop
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-base-200"
              @click="onClickLayerAction('front')"
            >
              <i-lucide-bring-to-front class="h-3.5 w-3.5 text-primary" />
              맨 앞으로
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-base-200"
              @click="onClickLayerAction('forward')"
            >
              <i-lucide-arrow-up class="h-3.5 w-3.5 text-primary" />
              앞으로
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-base-200"
              @click="onClickLayerAction('backward')"
            >
              <i-lucide-arrow-down class="h-3.5 w-3.5 text-primary" />
              뒤로
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-base-200"
              @click="onClickLayerAction('back')"
            >
              <i-lucide-send-to-back class="h-3.5 w-3.5 text-primary" />
              맨 뒤로
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Canvas,
  Circle,
  Control,
  FabricImage,
  FabricText,
  Group,
  Point,
  Rect,
  controlsUtils,
  Shadow,
  filters
} from 'fabric'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { CanvasAnnotation, ToolMode } from '@/types'

type CanvasObj = (Rect | FabricImage | Group) & {
  annotationId?: string
  annotationToolType?: CanvasAnnotation['toolType']
}

type CloneDragState = {
  annotation: CanvasAnnotation
  target: CanvasObj
  preview: CanvasObj | null
  originalLeft: number
  originalTop: number
  currentLeft: number
  currentTop: number
}

type RotationState = {
  target: CanvasObj
  center: Point
}

// ─── Props / Emits ───

const props = defineProps<{
  imageSrc: string
  annotations: CanvasAnnotation[]
  activeTool: ToolMode
  activeColor: string
}>()

// 부모 이벤트
const emit = defineEmits<{
  'add-annotation': [annotation: CanvasAnnotation]
  'update-annotation': [annotation: CanvasAnnotation]
  'remove-annotation': [annotationId: string]
  'open-context-menu': [
    payload: {
      annotationId: string
      left: number
      top: number
    }
  ]
  'close-context-menu': []
  'zoom-wheel': [
    payload: {
      deltaPct: number
      point: {
        x: number
        y: number
      }
    }
  ]
}>()

const MIN_CANVAS_WIDTH = 640
const MIN_CANVAS_HEIGHT = 420
const CANVAS_PADDING = 32

// ─── Template Refs / UI State ───

// DOM 참조
const editorFrame = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const contextMenu = ref<{ annotationId: string; left: number; top: number } | null>(null)
const selectedObj = shallowRef<CanvasObj | null>(null)
const listSelectId = ref<string | null>(null)

// ─── Fabric Runtime State ───

// Fabric 인스턴스
let canvas: Canvas | null = null
let baseImg: FabricImage | null = null
let resizeObserver: ResizeObserver | null = null

// ─── Drawing / Clipboard State ───

// 드래그 생성 상태
let drawBox: Rect | null = null
let drawing = false
let startX = 0
let startY = 0
let pendingSelectAnnotationId: string | null = null

// 복제 상태
let copiedAnnotation: CanvasAnnotation | null = null // 복사해둔 어노테이션
let cloneDragState: CloneDragState | null = null // Ctrl 드래그 복제 중 상태
let rotationState: RotationState | null = null // 회전 중 상태

// ─── Selection State ───

const NUMBER_STROKE_COLOR = '#ffffff'

const getColor = (): string =>
  getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#4f46e5'

const setNumberRing = (obj: CanvasObj | null, selected: boolean): void => {
  if (!(obj instanceof Group) || obj.annotationToolType !== 'number') return

  const fromFunctionList = selected && obj.annotationId === listSelectId.value
  const circle = obj.getObjects().find((child) => child instanceof Circle)
  circle?.set({
    stroke: fromFunctionList ? getColor() : NUMBER_STROKE_COLOR,
    strokeWidth: fromFunctionList ? 5 : 3
  })
  obj.set({
    hasBorders: !fromFunctionList
  })
  obj.setCoords()
}

const isDrawingTool = (tool: ToolMode): boolean =>
  tool === 'number' || tool === 'strokebox' || tool === 'filled-box' || tool === 'mosaic'

const syncCanvasSelectionMode = (): void => {
  if (!canvas) return
  canvas.selection = !isDrawingTool(props.activeTool)
}

// 선택 해제
const clearSel = (): void => {
  setNumberRing(selectedObj.value, false)
  selectedObj.value = null
  contextMenu.value = null
  listSelectId.value = null
  canvas?.requestRenderAll()
}

// 선택 동기화
const syncSel = (): void => {
  if (!canvas) return

  const activeObj = canvas.getActiveObject() as CanvasObj | null
  if (!activeObj || activeObj === baseImg) {
    clearSel()
    return
  }

  if (selectedObj.value !== activeObj) {
    setNumberRing(selectedObj.value, false)
  }
  selectedObj.value = activeObj as CanvasObj
  setNumberRing(selectedObj.value, true)
}

// 기능입력시 번호 태깅 선택
const selectAnnotation = (annotationId: string): void => {
  if (!canvas) return

  const target = canvas
    .getObjects()
    .find((obj) => (obj as CanvasObj).annotationId === annotationId) as CanvasObj | undefined

  if (!target) return

  listSelectId.value = annotationId
  if (selectedObj.value !== target) {
    setNumberRing(selectedObj.value, false)
  }
  canvas.setActiveObject(target)
  selectedObj.value = target
  setNumberRing(target, true)
  canvas.requestRenderAll()
}

const applyColor = (nextColor: string): void => {
  if (!selectedObj.value) return

  const selectedAnnotation = findAnnotation(selectedObj.value.annotationId)
  if (!selectedAnnotation || selectedAnnotation.toolType === 'mosaic') return

  if (selectedObj.value instanceof Group) {
    const circle = selectedObj.value.getObjects().find((child) => child instanceof Circle)
    circle?.set('fill', nextColor)
  } else if (selectedObj.value instanceof Rect) {
    if (selectedAnnotation.toolType === 'filled-box') {
      selectedObj.value.set({
        fill: nextColor,
        stroke: nextColor
      })
    } else {
      selectedObj.value.set({
        stroke: nextColor
      })
    }
  }

  selectedObj.value.setCoords()
  canvas?.requestRenderAll()
  emit('update-annotation', {
    ...selectedAnnotation,
    color: nextColor
  })
}

// ─── Viewport / Image Export ───

// Ctrl 휠 확대
const onWheel = (event: WheelEvent): void => {
  if (!event.ctrlKey || !canvas) return

  event.preventDefault()

  const rect = canvas.upperCanvasEl.getBoundingClientRect()

  emit('zoom-wheel', {
    deltaPct: event.deltaY < 0 ? 5 : -5,
    point: {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  })
}

// 전체 확대
const applyZoom = (nextPct: number): void => {
  if (!canvas) return

  canvas.setZoom(nextPct / 100)
  canvas.requestRenderAll()
}

// 지점 확대
const applyZoomAtPoint = (nextPct: number, point: { x: number; y: number }): void => {
  if (!canvas) return

  canvas.zoomToPoint(new Point(point.x, point.y), nextPct / 100)
  canvas.requestRenderAll()
}

// 뷰포트 초기화
const resetViewport = (): void => {
  if (!canvas) return

  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.requestRenderAll()
}

// 원본 회전
const rotateBaseImageCCW90 = (): void => {
  if (!canvas || !baseImg) return

  const nextAngle = (baseImg.angle ?? 0) - 90
  baseImg.set({
    angle: nextAngle
  })

  baseImg.setCoords()
  canvas.requestRenderAll()
}

// 선택 회전
const rotateSelectedAnnotationCCW90 = (): void => {
  if (!canvas || !selectedObj.value?.annotationId) return

  const centerPoint = selectedObj.value.getCenterPoint()
  const nextAngle = ((selectedObj.value.angle ?? 0) - 90) % 360
  selectedObj.value.set({
    angle: nextAngle
  })
  selectedObj.value.setPositionByOrigin(centerPoint, 'center', 'center')
  selectedObj.value.setCoords()
  canvas.setActiveObject(selectedObj.value)
  syncSel()
  canvas.requestRenderAll()
  emitObjectUpdate(selectedObj.value, {
    angle: nextAngle
  })
}

// 원본 영역
const getImgBounds = (): { left: number; top: number; width: number; height: number } | null => {
  if (!baseImg) return null

  const width = (baseImg.width ?? 0) * (baseImg.scaleX ?? 1)
  const height = (baseImg.height ?? 0) * (baseImg.scaleY ?? 1)

  return {
    left: (baseImg.left ?? 0) - width / 2,
    top: (baseImg.top ?? 0) - height / 2,
    width,
    height
  }
}

// PNG export
const exportImageDataURL = (): string | null => {
  if (!canvas) return null

  const activeObj = canvas.getActiveObject() as CanvasObj | null
  const selectedObjBeforeExport = selectedObj.value
  const listSelectIdBeforeExport = listSelectId.value
  setNumberRing(selectedObjBeforeExport, false)
  canvas.discardActiveObject()
  canvas.renderAll()

  const bounds = getImgBounds()
  const dataUrl = !bounds
    ? canvas.toDataURL({
        format: 'png',
        multiplier: 1
      })
    : canvas.toDataURL({
        format: 'png',
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        multiplier: 1
      })

  if (activeObj) canvas.setActiveObject(activeObj)
  listSelectId.value = listSelectIdBeforeExport
  selectedObj.value = selectedObjBeforeExport
  setNumberRing(selectedObj.value, Boolean(selectedObj.value))
  canvas.requestRenderAll()

  return dataUrl
}

// ─── Annotation Lookup / Metadata ───

const findAnnotation = (annotationId?: string): CanvasAnnotation | null =>
  props.annotations.find((annotation) => annotation.id === annotationId) ?? null

const setAnnotationMeta = (
  obj: CanvasObj,
  annotationId: string,
  toolType: CanvasAnnotation['toolType']
): CanvasObj => {
  obj.annotationId = annotationId
  obj.annotationToolType = toolType
  return obj
}

const rotateControlIcon = new Image()
rotateControlIcon.src =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="#262626" stroke-width="5"/>
      <path d="M21 3v6h-6" stroke="#262626" stroke-width="5"/>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="#ffffff" stroke-width="2.4"/>
      <path d="M21 3v6h-6" stroke="#ffffff" stroke-width="2.4"/>
    </svg>
  `)

// 회전 아이콘
const renderRotateControl = (ctx: CanvasRenderingContext2D, left: number, top: number): void => {
  ctx.save()

  ctx.drawImage(rotateControlIcon, left - 12, top - 12, 24, 24)
  ctx.restore()
}

const enableRotationControl = (obj: CanvasObj): CanvasObj => {
  obj.set({
    lockRotation: false,
    centeredRotation: true
  })
  obj.controls.mtr = new Control({
    x: 0,
    y: -0.5,
    offsetY: -34,
    cursorStyle: 'grab',
    actionHandler: controlsUtils.rotationWithSnapping,
    render: renderRotateControl
  })

  return obj
}

const findCanvasObject = (annotationId: string): CanvasObj | null => {
  if (!canvas) return null

  return (
    (canvas.getObjects().find((obj) => (obj as CanvasObj).annotationId === annotationId) as
      | CanvasObj
      | undefined
      | null) ?? null
  )
}

// ─── Layer Z-Index Sync ───

// zIndex 동기화
const syncAnnotationZIndexFromCanvas = (): void => {
  if (!canvas) return

  const annotationObjects = canvas
    .getObjects()
    .filter((obj) => (obj as CanvasObj).annotationId) as CanvasObj[]

  annotationObjects.forEach((obj, index) => {
    const annotation = findAnnotation(obj.annotationId)
    if (!annotation) return

    const nextZIndex = index + 1
    if (annotation.zIndex === nextZIndex) return

    emit('update-annotation', {
      ...annotation,
      zIndex: nextZIndex
    })
  })
}

// ─── Layer Ordering ───

// 레이어 이동
const bringToFront = (annotationId: string): void => {
  if (!canvas) return

  const obj = findCanvasObject(annotationId)
  if (!obj) return

  canvas.bringObjectToFront(obj)

  if (baseImg) {
    canvas.sendObjectToBack(baseImg)
  }

  canvas.setActiveObject(obj)
  syncSel()
  canvas.requestRenderAll()
  syncAnnotationZIndexFromCanvas()
}

const sendToBack = (annotationId: string): void => {
  if (!canvas) return

  const obj = findCanvasObject(annotationId)
  if (!obj) return

  canvas.sendObjectToBack(obj)

  if (baseImg) {
    canvas.sendObjectToBack(baseImg)
  }

  canvas.setActiveObject(obj)
  syncSel()
  canvas.requestRenderAll()
  syncAnnotationZIndexFromCanvas()
}

const bringForward = (annotationId: string): void => {
  if (!canvas) return

  const obj = findCanvasObject(annotationId)
  if (!obj) return

  canvas.bringObjectForward(obj)
  canvas.setActiveObject(obj)
  syncSel()
  canvas.requestRenderAll()
  syncAnnotationZIndexFromCanvas()
}

const sendBackwards = (annotationId: string): void => {
  if (!canvas) return

  const obj = findCanvasObject(annotationId)
  if (!obj) return

  canvas.sendObjectBackwards(obj)

  if (baseImg) {
    canvas.sendObjectToBack(baseImg)
  }

  canvas.setActiveObject(obj)
  syncSel()
  canvas.requestRenderAll()
  syncAnnotationZIndexFromCanvas()
}

const onClickLayerAction = (action: 'front' | 'forward' | 'backward' | 'back'): void => {
  const annotationId = contextMenu.value?.annotationId
  if (!annotationId) return

  if (action === 'front') bringToFront(annotationId)
  if (action === 'forward') bringForward(annotationId)
  if (action === 'backward') sendBackwards(annotationId)
  if (action === 'back') sendToBack(annotationId)

  contextMenu.value = null
  emit('close-context-menu')
}

// ─── Fabric Object Builders ───

// 객체 생성
const makeNumberMarker = (annotation: CanvasAnnotation): CanvasObj => {
  const circle = new Circle({
    radius: 16,
    fill: annotation.color,
    stroke: '#ffffff',
    strokeWidth: 3,
    shadow: new Shadow({
      color: 'rgba(0, 0, 0, 0.35)',
      blur: 18,
      offsetX: 0,
      offsetY: 5
    }),
    originX: 'center',
    originY: 'center'
  })

  const text = new FabricText(String(annotation.number ?? 0), {
    fontSize: 16,
    fontWeight: '700',
    fill: 'white',
    originX: 'center',
    originY: 'center'
  })

  return setAnnotationMeta(
    new Group([circle, text], {
      left: annotation.x,
      top: annotation.y,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: true
    }) as CanvasObj,
    annotation.id,
    annotation.toolType
  )
}

const makeBox = (annotation: CanvasAnnotation): CanvasObj => {
  const rect = new Rect({
    left: annotation.x,
    top: annotation.y,
    originX: 'left',
    originY: 'top',
    angle: annotation.angle ?? 0,
    width: annotation.width ?? 0,
    height: annotation.height ?? 0,
    fill: annotation.toolType === 'filled-box' ? annotation.color : 'transparent',
    stroke: annotation.color,
    strokeWidth: 2,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true
  }) as CanvasObj

  return enableRotationControl(setAnnotationMeta(rect, annotation.id, annotation.toolType))
}

const makeMosaic = (annotation: CanvasAnnotation): CanvasObj | null => {
  if (!baseImg) return null

  const bounds = getImgBounds()
  if (!bounds) return null

  const clippedLeft = Math.max(annotation.x, bounds.left)
  const clippedTop = Math.max(annotation.y, bounds.top)
  const clippedWidth =
    Math.min(annotation.x + (annotation.width ?? 0), bounds.left + bounds.width) - clippedLeft
  const clippedHeight =
    Math.min(annotation.y + (annotation.height ?? 0), bounds.top + bounds.height) - clippedTop

  if (clippedWidth < 5 || clippedHeight < 5) return null

  const baseScaleX = baseImg.scaleX ?? 1
  const baseScaleY = baseImg.scaleY ?? 1
  const sourceX = Math.floor((clippedLeft - bounds.left) / baseScaleX)
  const sourceY = Math.floor((clippedTop - bounds.top) / baseScaleY)
  const sourceWidth = Math.max(1, Math.ceil(clippedWidth / baseScaleX))
  const sourceHeight = Math.max(1, Math.ceil(clippedHeight / baseScaleY))

  const mosaicPiece = new FabricImage(baseImg.getElement(), {
    left: clippedLeft,
    top: clippedTop,
    cropX: sourceX,
    cropY: sourceY,
    width: sourceWidth,
    height: sourceHeight,
    originX: 'left',
    originY: 'top',
    angle: annotation.angle ?? 0,
    scaleX: clippedWidth / sourceWidth,
    scaleY: clippedHeight / sourceHeight,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true
  })

  const blocksize = clippedWidth > 180 || clippedHeight > 80 ? 10 : 5
  mosaicPiece.filters = [new filters.Pixelate({ blocksize })]
  mosaicPiece.applyFilters()

  return enableRotationControl(
    setAnnotationMeta(mosaicPiece as CanvasObj, annotation.id, annotation.toolType)
  )
}

const buildObject = (annotation: CanvasAnnotation): CanvasObj | null => {
  if (annotation.toolType === 'number') return makeNumberMarker(annotation)
  if (annotation.toolType === 'mosaic') return makeMosaic(annotation)
  return makeBox(annotation)
}

// ─── Canvas Rendering / Resizing ───

// 캔버스 동기화
const syncCanvasObjects = (): void => {
  if (!canvas) return

  const selectedId = pendingSelectAnnotationId ?? selectedObj.value?.annotationId ?? null

  for (const obj of [...canvas.getObjects()]) {
    if (obj !== baseImg) {
      canvas.remove(obj)
    }
  }

  const sortedAnnotations = [...props.annotations].sort((left, right) => {
    const leftZ = left.zIndex ?? 0
    const rightZ = right.zIndex ?? 0
    if (leftZ !== rightZ) return leftZ - rightZ
    return (left.order ?? left.number ?? 0) - (right.order ?? right.number ?? 0)
  })

  for (const annotation of sortedAnnotations) {
    const obj = buildObject(annotation)
    if (!obj) continue
    canvas.add(obj)
  }

  if (baseImg) {
    canvas.sendObjectToBack(baseImg)
  }

  if (selectedId) {
    const active = canvas
      .getObjects()
      .find((obj) => (obj as CanvasObj).annotationId === selectedId) as CanvasObj | undefined

    if (active) {
      canvas.setActiveObject(active)
      selectedObj.value = active
      setNumberRing(active, true)
      pendingSelectAnnotationId = null
    } else {
      pendingSelectAnnotationId = null
      clearSel()
    }
  }

  canvas.requestRenderAll()
}

// 원본 이미지 로드
const drawImage = async (): Promise<void> => {
  if (!canvas) return

  for (const obj of [...canvas.getObjects()]) {
    canvas.remove(obj)
  }

  clearSel()
  baseImg = null

  if (!props.imageSrc) {
    canvas.requestRenderAll()
    return
  }

  const image = await FabricImage.fromURL(props.imageSrc)
  const imageWidth = image.width ?? 1
  const imageHeight = image.height ?? 1
  const canvasWidth = canvas.getWidth()
  const canvasHeight = canvas.getHeight()
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight)

  image.set({
    originX: 'center',
    originY: 'center',
    left: canvasWidth / 2,
    top: canvasHeight / 2,
    scaleX: scale,
    scaleY: scale,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false
  })

  canvas.add(image)
  canvas.sendObjectToBack(image)
  baseImg = image
  syncCanvasObjects()
}

// 캔버스 리사이즈
const resizeCanvasToFrame = (): void => {
  if (!canvas || !editorFrame.value) return

  const nextWidth = Math.max(MIN_CANVAS_WIDTH, editorFrame.value.clientWidth - CANVAS_PADDING)
  const nextHeight = Math.max(MIN_CANVAS_HEIGHT, editorFrame.value.clientHeight - CANVAS_PADDING)

  if (canvas.getWidth() === nextWidth && canvas.getHeight() === nextHeight) return

  canvas.setDimensions({
    width: nextWidth,
    height: nextHeight
  })

  void drawImage()
}

// 다음 번호
const getNextNumber = (): number => {
  const numbers = props.annotations
    .filter((annotation) => annotation.toolType === 'number')
    .map((annotation) => annotation.number ?? 0)

  return (numbers.length ? Math.max(...numbers) : 0) + 1
}

// ─── Copy / Clone / Keyboard Movement ───

// 복사 붙여넣기
const copySelectedAnnotation = (): void => {
  const annotation = findAnnotation(selectedObj.value?.annotationId)
  if (!annotation || annotation.toolType === 'number') return

  copiedAnnotation = {
    ...annotation,
    number: undefined,
    order: undefined
  }
}

const pasteCopiedAnnotation = (): void => {
  if (!copiedAnnotation) return

  const nextAnnotation: CanvasAnnotation = {
    ...copiedAnnotation,
    id: `ann-${Date.now()}`,
    x: copiedAnnotation.x + 16,
    y: copiedAnnotation.y + 16,
    zIndex: props.annotations.length + 1
  }

  copiedAnnotation = nextAnnotation
  emit('add-annotation', nextAnnotation)
}

// 방향키 이동
const moveSelectedByKeyboard = (deltaX: number, deltaY: number): void => {
  if (!canvas || !selectedObj.value?.annotationId) return

  selectedObj.value.set({
    left: (selectedObj.value.left ?? 0) + deltaX,
    top: (selectedObj.value.top ?? 0) + deltaY
  })
  selectedObj.value.setCoords()
  syncSel()
  canvas.requestRenderAll()
  emitObjectUpdate(selectedObj.value)
}

// Ctrl 드래그 시작
const startCloneDrag = (target: CanvasObj): void => {
  if (!canvas) return

  const annotation = findAnnotation(target.annotationId)
  if (!annotation || annotation.toolType === 'number') return

  const preview = buildObject({
    ...annotation,
    id: `preview-${annotation.id}`
  })

  if (preview) {
    preview.annotationId = undefined
    preview.selectable = false
    preview.evented = false
    preview.opacity = 0.85
    canvas.add(preview)
    canvas.bringObjectToFront(preview)
  }

  cloneDragState = {
    annotation,
    target,
    preview,
    originalLeft: target.left ?? annotation.x,
    originalTop: target.top ?? annotation.y,
    currentLeft: target.left ?? annotation.x,
    currentTop: target.top ?? annotation.y
  }
}

// Ctrl 드래그 완료
const finishCloneDrag = (target: CanvasObj): boolean => {
  if (!cloneDragState || cloneDragState.target !== target) return false

  const cloneState = cloneDragState
  const droppedLeft = cloneDragState.currentLeft
  const droppedTop = cloneDragState.currentTop

  target.set({
    left: cloneDragState.originalLeft,
    top: cloneDragState.originalTop
  })
  target.setCoords()

  if (cloneState.preview && canvas) {
    canvas.remove(cloneState.preview)
  }

  const nextAnnotation: CanvasAnnotation = {
    ...cloneState.annotation,
    id: `ann-${Date.now()}`,
    x: droppedLeft,
    y: droppedTop,
    zIndex: props.annotations.length + 1
  }

  cloneDragState = null
  canvas?.setActiveObject(target)
  syncSel()
  canvas?.requestRenderAll()
  emit('add-annotation', nextAnnotation)
  return true
}

// 이동 중 처리
const onObjectMoving = (target?: CanvasObj): void => {
  if (cloneDragState && target && cloneDragState.target === target) {
    cloneDragState.currentLeft = target.left ?? cloneDragState.currentLeft
    cloneDragState.currentTop = target.top ?? cloneDragState.currentTop

    cloneDragState.preview?.set({
      left: cloneDragState.currentLeft,
      top: cloneDragState.currentTop
    })
    cloneDragState.preview?.setCoords()

    target.set({
      left: cloneDragState.originalLeft,
      top: cloneDragState.originalTop
    })
    target.setCoords()
    canvas?.requestRenderAll()
  }

  syncSel()
}

// 회전 중 처리
const onObjectRotating = (target?: CanvasObj): void => {
  if (!target?.annotationId) return

  if (!rotationState || rotationState.target !== target) {
    rotationState = {
      target,
      center: target.getCenterPoint()
    }
  }

  target.setPositionByOrigin(rotationState.center, 'center', 'center')
  target.setCoords()
  syncSel()
}

// 단축키
const onKeyDown = (event: KeyboardEvent): void => {
  const target = event.target as HTMLElement | null
  const isEditableTarget =
    target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

  if (isEditableTarget) return

  const key = event.key.toLowerCase()
  if (key === 'delete') {
    event.preventDefault()
    removeSelected()
    return
  }

  const moveStep = event.shiftKey ? 10 : 1
  if (key === 'arrowleft') {
    event.preventDefault()
    moveSelectedByKeyboard(-moveStep, 0)
    return
  }
  if (key === 'arrowright') {
    event.preventDefault()
    moveSelectedByKeyboard(moveStep, 0)
    return
  }
  if (key === 'arrowup') {
    event.preventDefault()
    moveSelectedByKeyboard(0, -moveStep)
    return
  }
  if (key === 'arrowdown') {
    event.preventDefault()
    moveSelectedByKeyboard(0, moveStep)
    return
  }

  if (!event.ctrlKey) return

  if (key === 'c') {
    copySelectedAnnotation()
    return
  }

  if (key === 'v') {
    event.preventDefault()
    pasteCopiedAnnotation()
  }
}

// ─── Annotation Data Sync ───

// 객체 변경 반영
const emitObjectUpdate = (obj: CanvasObj, overrides?: Partial<CanvasAnnotation>): void => {
  const current = findAnnotation(obj.annotationId)
  if (!current) return

  if (obj instanceof Group) {
    emit('update-annotation', {
      ...current,
      x: obj.left ?? current.x,
      y: obj.top ?? current.y,
      angle: obj.angle ?? current.angle ?? 0,
      ...overrides
    })
    return
  }

  emit('update-annotation', {
    ...current,
    x: obj.left ?? current.x,
    y: obj.top ?? current.y,
    angle: obj.angle ?? current.angle ?? 0,
    width: (obj.width ?? current.width ?? 0) * (obj.scaleX ?? 1),
    height: (obj.height ?? current.height ?? 0) * (obj.scaleY ?? 1),
    ...overrides
  })
}

// 임시 박스
const startBox = (left: number, top: number): void => {
  if (!canvas) return

  canvas.discardActiveObject()
  clearSel()
  canvas.selection = false
  drawing = true
  startX = left
  startY = top

  drawBox = new Rect({
    left,
    top,
    originX: 'left',
    originY: 'top',
    width: 0,
    height: 0,
    fill: props.activeTool === 'filled-box' ? props.activeColor : 'transparent',
    stroke: props.activeColor,
    strokeWidth: 2,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false
  })

  canvas.add(drawBox)
}

// ─── Delete / Fabric Event Wiring ───

// 선택 삭제
const removeSelected = (): void => {
  if (!canvas) return

  const activeObj = canvas.getActiveObject() as CanvasObj | null
  const activeObjects = activeObj?.annotationId
    ? [activeObj as CanvasObj]
    : activeObj && 'getObjects' in activeObj
      ? ((activeObj as unknown as { getObjects: () => CanvasObj[] }).getObjects() ?? [])
      : selectedObj.value
        ? [selectedObj.value]
        : []

  const annotationIds = activeObjects
    .map((obj) => obj.annotationId)
    .filter((annotationId): annotationId is string => Boolean(annotationId))

  if (annotationIds.length === 0) return

  canvas.discardActiveObject()
  clearSel()
  annotationIds.forEach((annotationId) => emit('remove-annotation', annotationId))
}

// Fabric 이벤트
const setupCanvas = (): void => {
  if (!canvasEl.value) return

  canvas = new Canvas(canvasEl.value, {
    width: MIN_CANVAS_WIDTH,
    height: MIN_CANVAS_HEIGHT,
    selection: true
  })
  syncCanvasSelectionMode()

  canvas.on('selection:created', syncSel)
  canvas.on('selection:updated', syncSel)
  canvas.on('selection:cleared', clearSel)
  canvas.on('object:moving', (event) => {
    onObjectMoving(event.target as CanvasObj | undefined)
  })
  canvas.on('object:scaling', syncSel)
  canvas.on('object:rotating', (event) => {
    onObjectRotating(event.target as CanvasObj | undefined)
  })
  canvas.on('object:modified', (event) => {
    syncSel()
    const target = event.target as CanvasObj | undefined
    if (!target?.annotationId) return
    if (finishCloneDrag(target)) return
    emitObjectUpdate(target)
    rotationState = null
  })

  canvas.on('mouse:down', (event) => {
    if (!canvas) return

    const mouseEvent = event.e as MouseEvent
    const target = event.target as CanvasObj | undefined

    listSelectId.value = null

    if (mouseEvent.button === 2) {
      if (target) {
        const annotationId = target.annotationId

        if (annotationId) {
          canvas.setActiveObject(target)
          syncSel()
          contextMenu.value = {
            annotationId,
            left: mouseEvent.offsetX,
            top: mouseEvent.offsetY
          }

          emit('open-context-menu', {
            annotationId,
            left: mouseEvent.offsetX,
            top: mouseEvent.offsetY
          })
          return
        }
      }

      contextMenu.value = null
      emit('close-context-menu')
      return
    }

    contextMenu.value = null
    emit('close-context-menu')

    if (target) {
      if (mouseEvent.ctrlKey && target.annotationId) {
        startCloneDrag(target)
      }
      return
    }

    const pointer = canvas.getScenePoint(event.e)

    if (props.activeTool === 'number') {
      const nextNumber = getNextNumber()
      const annotationId = `ann-${Date.now()}`
      pendingSelectAnnotationId = annotationId
      emit('add-annotation', {
        id: annotationId,
        toolType: 'number',
        color: props.activeColor,
        number: nextNumber,
        order: nextNumber,
        x: pointer.x,
        y: pointer.y,
        zIndex: props.annotations.length + 1
      })
      return
    }

    if (!['strokebox', 'filled-box', 'mosaic'].includes(props.activeTool ?? '')) return
    startBox(pointer.x, pointer.y)
  })

  canvas.on('mouse:move', (event) => {
    if (!canvas || !drawing || !drawBox) return

    const pointer = canvas.getScenePoint(event.e)
    drawBox.set({
      left: startX,
      top: startY,
      width: Math.max(0, pointer.x - startX),
      height: Math.max(0, pointer.y - startY)
    })
    drawBox.setCoords()
    canvas.requestRenderAll()
  })

  canvas.on('mouse:up', () => {
    if (!drawBox || !canvas || !props.activeTool) return

    const width = drawBox.width ?? 0
    const height = drawBox.height ?? 0

    if (width < 5 || height < 5) {
      canvas.remove(drawBox)
      drawBox = null
      drawing = false
      canvas.requestRenderAll()
      return
    }

    const annotationId = `ann-${Date.now()}`
    const nextAnnotation: CanvasAnnotation = {
      id: annotationId,
      toolType: props.activeTool as CanvasAnnotation['toolType'],
      color: props.activeColor,
      x: drawBox.left ?? 0,
      y: drawBox.top ?? 0,
      width,
      height,
      zIndex: props.annotations.length + 1
    }

    canvas.remove(drawBox)
    drawBox = null
    drawing = false
    pendingSelectAnnotationId = annotationId
    emit('add-annotation', nextAnnotation)
  })
}

// ─── Watchers / Lifecycle ───

watch(
  () => props.imageSrc,
  () => {
    void drawImage()
  },
  { immediate: true }
)

// annotation watch
watch(
  () => props.annotations,
  () => {
    syncCanvasObjects()
  },
  { deep: true }
)

watch(
  () => props.activeTool,
  () => {
    syncCanvasSelectionMode()
  },
  { immediate: true }
)

// 색상 watch
watch(
  () => props.activeColor,
  (nextColor) => {
    applyColor(nextColor)
  }
)

// mount
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  setupCanvas()
  void nextTick(() => {
    resizeCanvasToFrame()

    if (editorFrame.value) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvasToFrame()
      })
      resizeObserver.observe(editorFrame.value)
    }
  })
})

// unmount
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  resizeObserver?.disconnect()
  resizeObserver = null
  canvas?.dispose()
  canvas = null
})

// 외부 API
defineExpose({
  setZoom: applyZoom,
  setZoomAtPoint: applyZoomAtPoint,
  resetViewport,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackwards,
  selectAnnotation,
  applyColor,
  rotateSelectedAnnotationCCW90,
  rotateBaseImageCCW90,
  exportImageDataURL
})
</script>
