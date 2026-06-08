import { ref, reactive, computed, onUnmounted, type Ref, type CSSProperties } from 'vue'

export interface UseDragSelectOptions<T extends string | number = number> {
  /** 컨테이너 엘리먼트 ref */
  containerRef: Ref<HTMLElement | null>
  /** 각 아이템의 data 속성 이름 (예: 'shot-id' → data-shot-id) */
  dataAttr: string
  /** 전체 아이템 ID 목록 (Shift+클릭 범위 선택에 사용) */
  itemIds: Ref<T[]>
  /** 드래그 시작 판정 임계값 (px, 기본 4) */
  threshold?: number
  /** 일반 클릭도 Ctrl 클릭처럼 토글 선택할지 여부 */
  toggleOnClick?: boolean
}

export interface UseDragSelectReturn<T extends string | number = number> {
  selectedIds: Ref<Set<T>>
  isDragging: Ref<boolean>
  selectionStyle: Ref<CSSProperties>
  onMouseDown: (e: MouseEvent) => void
  onClickItem: (id: T, e: MouseEvent) => void
  clearSelection: () => void
  selectAll: () => void
  /** 진행 중인 rubber band를 강제 취소 (HTML5 drag 등과 충돌 시 사용) */
  cancelDrag: () => void
}

export function useDragSelect<T extends string | number = number>(
  options: UseDragSelectOptions<T>
): UseDragSelectReturn<T> {
  const { containerRef, dataAttr, itemIds, threshold = 4, toggleOnClick = false } = options

  const selectedIds = ref<Set<T>>(new Set()) as Ref<Set<T>>
  const isDragging = ref(false)

  const dragStart = reactive({ x: 0, y: 0 })
  const dragCurrent = reactive({ x: 0, y: 0 })

  let mouseDownPos = { x: 0, y: 0 }
  let dragStarted = false
  let preserveOnDrag = false

  const selectionStyle = computed<CSSProperties>(() => {
    const left = Math.min(dragStart.x, dragCurrent.x)
    const top = Math.min(dragStart.y, dragCurrent.y)
    const width = Math.abs(dragCurrent.x - dragStart.x)
    const height = Math.abs(dragCurrent.y - dragStart.y)
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`
    }
  })

  function getRelativePos(e: MouseEvent): { x: number; y: number } {
    const container = containerRef.value!
    const rect = container.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top + container.scrollTop
    }
  }

  function rectsIntersect(
    a: { left: number; top: number; right: number; bottom: number },
    b: { left: number; top: number; right: number; bottom: number }
  ): boolean {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  }

  function getSelectionRect(): { left: number; top: number; right: number; bottom: number } {
    return {
      left: Math.min(dragStart.x, dragCurrent.x),
      top: Math.min(dragStart.y, dragCurrent.y),
      right: Math.max(dragStart.x, dragCurrent.x),
      bottom: Math.max(dragStart.y, dragCurrent.y)
    }
  }

  function parseId(raw: string): T {
    const asNum = Number(raw)
    return (Number.isNaN(asNum) ? raw : asNum) as T
  }

  function updateSelectionFromRect(): void {
    const container = containerRef.value
    if (!container) return

    const selRect = getSelectionRect()
    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop

    const newSelected = new Set<T>(preserveOnDrag ? selectedIds.value : [])
    const selector = `[data-${dataAttr}]`

    container.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const raw = el.dataset[toCamelCase(dataAttr)]
      if (raw == null) return
      const id = parseId(raw)
      const r = el.getBoundingClientRect()
      const itemRect = {
        left: r.left - containerRect.left,
        top: r.top - containerRect.top + scrollTop,
        right: r.right - containerRect.left,
        bottom: r.bottom - containerRect.top + scrollTop
      }
      if (rectsIntersect(selRect, itemRect)) {
        if (preserveOnDrag && selectedIds.value.has(id)) {
          newSelected.delete(id)
        } else {
          newSelected.add(id)
        }
      }
    })

    selectedIds.value = newSelected
  }

  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('input, button, a')) return

    const itemEl = target.closest(`[data-${dataAttr}]`) as HTMLElement | null
    if (itemEl) {
      const raw = itemEl.dataset[toCamelCase(dataAttr)]
      if (raw != null && selectedIds.value.has(parseId(raw))) {
        return
      }
    }

    mouseDownPos = { x: e.clientX, y: e.clientY }
    dragStarted = false
    preserveOnDrag = e.metaKey || e.ctrlKey || e.shiftKey

    const pos = getRelativePos(e)
    dragStart.x = pos.x
    dragStart.y = pos.y
    dragCurrent.x = pos.x
    dragCurrent.y = pos.y

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent): void {
    const dx = e.clientX - mouseDownPos.x
    const dy = e.clientY - mouseDownPos.y

    if (!dragStarted && Math.abs(dx) < threshold && Math.abs(dy) < threshold) return

    if (!dragStarted) {
      dragStarted = true
      isDragging.value = true
    }

    const pos = getRelativePos(e)
    dragCurrent.x = pos.x
    dragCurrent.y = pos.y

    updateSelectionFromRect()
  }

  function onMouseUp(e: MouseEvent): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)

    if (!dragStarted) {
      const target = e.target as HTMLElement
      const selector = `[data-${dataAttr}]`
      if (!target.closest(selector)) {
        if (!preserveOnDrag) {
          selectedIds.value = new Set()
        }
      }
    }

    isDragging.value = false
    dragStarted = false
  }

  function onClickItem(id: T, e: MouseEvent): void {
    if (isDragging.value) return

    if (e.shiftKey && selectedIds.value.size > 0) {
      const ids = itemIds.value
      const lastSelected = [...selectedIds.value].pop()!
      const fromIdx = ids.indexOf(lastSelected)
      const toIdx = ids.indexOf(id)
      const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
      const next = new Set(selectedIds.value)
      for (let i = start; i <= end; i++) {
        next.add(ids[i])
      }
      selectedIds.value = next
    } else if (toggleOnClick || e.metaKey || e.ctrlKey) {
      const next = new Set(selectedIds.value)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      selectedIds.value = next
    } else {
      selectedIds.value = new Set([id])
    }
  }

  function clearSelection(): void {
    selectedIds.value = new Set()
  }

  function selectAll(): void {
    selectedIds.value = new Set(itemIds.value)
  }

  function cancelDrag(): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    isDragging.value = false
    dragStarted = false
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })

  return {
    selectedIds,
    isDragging,
    selectionStyle,
    onMouseDown,
    onClickItem,
    clearSelection,
    selectAll,
    cancelDrag
  }
}

/** data-shot-id → shotId */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}
