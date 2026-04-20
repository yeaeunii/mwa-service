import { ref, type Ref } from 'vue'

const MIME = 'application/json'

// ─── Drag Source ───

export interface UseDragSourceOptions<T extends string | number = number> {
  /** 현재 선택된 ID Set (useDragSelect의 selectedIds) */
  selectedIds: Ref<Set<T>>
  /** 커스텀 드래그 고스트 엘리먼트 ref */
  ghostRef: Ref<HTMLElement | null>
  /** useDragSelect의 cancelDrag (rubber band 충돌 방지용) */
  cancelDragSelect?: () => void
}

export interface UseDragSourceReturn<T extends string | number = number> {
  /** 드래그 중인 아이템 개수 (고스트 텍스트용) */
  draggingCount: Ref<number>
  /** 각 아이템의 @dragstart에 바인딩 */
  onDragStart: (id: T, e: DragEvent) => void
  /** 각 아이템의 @dragend에 바인딩 */
  onDragEnd: () => void
}

export function useDragSource<T extends string | number = number>(
  options: UseDragSourceOptions<T>
): UseDragSourceReturn<T> {
  const { selectedIds, ghostRef, cancelDragSelect } = options
  const draggingCount = ref(0)

  function onDragStart(id: T, e: DragEvent): void {
    cancelDragSelect?.()

    if (!selectedIds.value.has(id)) {
      selectedIds.value = new Set([id])
    }

    const draggedIds = [...selectedIds.value]
    draggingCount.value = draggedIds.length

    e.dataTransfer!.effectAllowed = 'copy'
    e.dataTransfer!.setData(MIME, JSON.stringify(draggedIds))

    if (ghostRef.value) {
      e.dataTransfer!.setDragImage(ghostRef.value, 0, 0)
    }
  }

  function onDragEnd(): void {
    draggingCount.value = 0
  }

  return { draggingCount, onDragStart, onDragEnd }
}

// ─── Drop Zone ───

export interface UseDropZoneOptions<T extends string | number = number> {
  /** 드롭 시 호출되는 콜백. 파싱된 ID 배열을 전달받음 */
  onDropItems: (ids: T[]) => void
}

export interface UseDropZoneReturn {
  /** 드롭 존 위에 드래그 중인지 여부 */
  isOverDropZone: Ref<boolean>
  /** 드롭 존의 @dragover.prevent에 바인딩 */
  onDragOver: (e: DragEvent) => void
  /** 드롭 존의 @dragleave에 바인딩 */
  onDragLeave: () => void
  /** 드롭 존의 @drop.prevent에 바인딩 */
  onDrop: (e: DragEvent) => void
}

export function useDropZone<T extends string | number = number>(
  options: UseDropZoneOptions<T>
): UseDropZoneReturn {
  const { onDropItems } = options
  const isOverDropZone = ref(false)
  let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

  function onDragOver(e: DragEvent): void {
    if (!e.dataTransfer?.types.includes(MIME)) return
    e.dataTransfer.dropEffect = 'copy'
    if (dragLeaveTimer) {
      clearTimeout(dragLeaveTimer)
      dragLeaveTimer = null
    }
    isOverDropZone.value = true
  }

  function onDragLeave(): void {
    dragLeaveTimer = setTimeout(() => {
      isOverDropZone.value = false
    }, 50)
  }

  function onDrop(e: DragEvent): void {
    isOverDropZone.value = false
    const raw = e.dataTransfer?.getData(MIME)
    if (!raw) return

    const ids: T[] = JSON.parse(raw)
    if (ids.length > 0) {
      onDropItems(ids)
    }
  }

  return { isOverDropZone, onDragOver, onDragLeave, onDrop }
}
