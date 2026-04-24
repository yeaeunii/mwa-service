<template>
  <div class="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
    <div class="absolute inset-0 overflow-hidden bg-slate-950" @contextmenu.prevent>
      <div class="flex h-full w-full items-center justify-center p-10">
        <div class="relative inline-block">
          <canvas ref="canvasEl" class="border border-white/10"></canvas>

          <div
            v-show="delBtnPos"
            class="pointer-events-auto absolute z-50"
            :style="
              delBtnPos
                ? {
                    left: `${delBtnPos.left}px`,
                    top: `${delBtnPos.top}px`
                  }
                : {}
            "
          >
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent shadow-lg"
              @click="removeSelected"
            >
              <i-lucide-trash-2 class="text-sm text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Canvas, Circle, FabricImage, FabricText, Group, Rect, filters } from 'fabric'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { CanvasAnnotation, ToolMode } from '@/types'

type CanvasObj = (Rect | FabricImage | Group) & {
  annotationId?: string
  annotationToolType?: CanvasAnnotation['toolType']
}

const props = defineProps<{
  imageSrc: string
  annotations: CanvasAnnotation[]
  activeTool: ToolMode
  activeColor: string
}>()

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
}>()

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 700

const canvasEl = ref<HTMLCanvasElement | null>(null)
const delBtnPos = ref<{ left: number; top: number } | null>(null)
const selectedObj = shallowRef<CanvasObj | null>(null)

let canvas: Canvas | null = null
let baseImg: FabricImage | null = null
let drawBox: Rect | null = null
let drawing = false
let startX = 0
let startY = 0

const clearSel = (): void => {
  selectedObj.value = null
  delBtnPos.value = null
}

const syncSel = (): void => {
  if (!canvas) return

  const activeObj = canvas.getActiveObject()
  if (!activeObj || activeObj === baseImg) {
    clearSel()
    return
  }

  selectedObj.value = activeObj as CanvasObj
  const bounds = activeObj.getBoundingRect()

  delBtnPos.value = {
    left: bounds.left + bounds.width - 34,
    top: Math.max(0, bounds.top - 40)
  }
}

const applyZoom = (nextPct: number): void => {
  if (!canvas) return

  canvas.setZoom(nextPct / 100)
  canvas.requestRenderAll()
}

const resetViewport = (): void => {
  if (!canvas) return

  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.requestRenderAll()
}

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

const findCanvasObject = (annotationId: string): CanvasObj | null => {
  if (!canvas) return null

  return (
    canvas.getObjects().find((obj) => (obj as CanvasObj).annotationId === annotationId) as
      | CanvasObj
      | undefined
      | null
  ) ?? null
}


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
}

const bringForward = (annotationId: string): void => {
  if (!canvas) return

  const obj = findCanvasObject(annotationId)
  if (!obj) return

  canvas.bringObjectForward(obj)
  canvas.setActiveObject(obj)
  syncSel()
  canvas.requestRenderAll()
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
}



const makeNumberMarker = (annotation: CanvasAnnotation): CanvasObj => {
  const circle = new Circle({
    radius: 14,
    fill: annotation.color,
    originX: 'center',
    originY: 'center'
  })

  const text = new FabricText(String(annotation.number ?? 0), {
    fontSize: 14,
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
      hasBorders: false
    }) as CanvasObj,
    annotation.id,
    annotation.toolType
  )
}

const makeBox = (annotation: CanvasAnnotation): CanvasObj =>
  setAnnotationMeta(
    new Rect({
      left: annotation.x,
      top: annotation.y,
      originX: 'left',
      originY: 'top',
      width: annotation.width ?? 0,
      height: annotation.height ?? 0,
      fill: annotation.toolType === 'filled-box' ? annotation.color : 'transparent',
      stroke: annotation.color,
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    }) as CanvasObj,
    annotation.id,
    annotation.toolType
  )

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

  return setAnnotationMeta(mosaicPiece as CanvasObj, annotation.id, annotation.toolType)
}

const buildObject = (annotation: CanvasAnnotation): CanvasObj | null => {
  if (annotation.toolType === 'number') return makeNumberMarker(annotation)
  if (annotation.toolType === 'mosaic') return makeMosaic(annotation)
  return makeBox(annotation)
}

const syncCanvasObjects = (): void => {
  if (!canvas) return

  const selectedId = selectedObj.value?.annotationId ?? null

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
    } else {
      clearSel()
    }
  }

  canvas.requestRenderAll()
}

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
  const scale = Math.min(CANVAS_WIDTH / imageWidth, CANVAS_HEIGHT / imageHeight)

  image.set({
    originX: 'center',
    originY: 'center',
    left: CANVAS_WIDTH / 2,
    top: CANVAS_HEIGHT / 2,
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

const getNextNumber = (): number => {
  const numbers = props.annotations
    .filter((annotation) => annotation.toolType === 'number')
    .map((annotation) => annotation.number ?? 0)

  return (numbers.length ? Math.max(...numbers) : 0) + 1
}

const emitObjectUpdate = (obj: CanvasObj, overrides?: Partial<CanvasAnnotation>): void => {
  const current = findAnnotation(obj.annotationId)
  if (!current) return

  if (obj instanceof Group) {
    emit('update-annotation', {
      ...current,
      x: obj.left ?? current.x,
      y: obj.top ?? current.y,
      ...overrides
    })
    return
  }

  emit('update-annotation', {
    ...current,
    x: obj.left ?? current.x,
    y: obj.top ?? current.y,
    width: (obj.width ?? current.width ?? 0) * (obj.scaleX ?? 1),
    height: (obj.height ?? current.height ?? 0) * (obj.scaleY ?? 1),
    ...overrides
  })
}

const startBox = (left: number, top: number): void => {
  if (!canvas) return

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

const removeSelected = (): void => {
  if (!canvas || !selectedObj.value?.annotationId) return
  emit('remove-annotation', selectedObj.value.annotationId)
}

const setupCanvas = (): void => {
  if (!canvasEl.value) return

  canvas = new Canvas(canvasEl.value, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    selection: true
  })

  canvas.on('selection:created', syncSel)
  canvas.on('selection:updated', syncSel)
  canvas.on('selection:cleared', clearSel)
  canvas.on('object:moving', syncSel)
  canvas.on('object:scaling', syncSel)
  canvas.on('object:modified', (event) => {
    syncSel()
    const target = event.target as CanvasObj | undefined
    if (!target?.annotationId) return
    emitObjectUpdate(target)
  })

canvas.on('mouse:down', (event) => {
  if (!canvas) return

  const mouseEvent = event.e as MouseEvent

  if (mouseEvent.button === 2) {
    if (event.target) {
      const target = event.target as CanvasObj
      const annotationId = target.annotationId

      if (annotationId) {
        canvas.setActiveObject(target)
        syncSel()

        emit('open-context-menu', {
          annotationId,
          left: mouseEvent.offsetX,
          top: mouseEvent.offsetY
        })
        return
      }
    }

    emit('close-context-menu')
    return
  }

  emit('close-context-menu')

  if (event.target) return

  const pointer = canvas.getScenePoint(event.e)

  if (props.activeTool === 'number') {
    const nextNumber = getNextNumber()
    emit('add-annotation', {
      id: `ann-${Date.now()}`,
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

    const nextAnnotation: CanvasAnnotation = {
      id: `ann-${Date.now()}`,
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
    emit('add-annotation', nextAnnotation)
  })
}

watch(
  () => props.imageSrc,
  () => {
    void drawImage()
  },
  { immediate: true }
)

watch(
  () => props.annotations,
  () => {
    syncCanvasObjects()
  },
  { deep: true }
)

watch(
  () => props.activeColor,
  (nextColor) => {
    console.log(selectedObj.value)

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
)


onMounted(() => {
  setupCanvas()
  void drawImage()
})

onBeforeUnmount(() => {
  canvas?.dispose()
  canvas = null
})

defineExpose({
  setZoom: applyZoom,
  resetViewport,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackwards
})
</script>
