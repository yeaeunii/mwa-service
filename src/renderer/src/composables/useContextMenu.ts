import { onMounted, onUnmounted, reactive, ref, type Ref } from 'vue'

interface UseContextMenuOptions {
  closeOnWindowClick?: boolean
  closeOnWindowContextMenu?: boolean
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
}

interface UseContextMenuReturn<T> {
  contextMenu: ContextMenuState
  selectedItem: Ref<T | null>
  openContextMenu: (e: MouseEvent, item: T) => void
  openContextMenuAt: (x: number, y: number, item: T) => void
  closeContextMenu: () => void
}

export function useContextMenu<T = Record<string, unknown>>(
  options: UseContextMenuOptions = {}
): UseContextMenuReturn<T> {
  const { closeOnWindowClick = true, closeOnWindowContextMenu = false } = options

  const selectedItem = ref<T | null>(null) as Ref<T | null>
  const contextMenu = reactive<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0
  })

  const openContextMenuAt = (x: number, y: number, item: T): void => {
    contextMenu.x = x
    contextMenu.y = y
    contextMenu.visible = true
    selectedItem.value = item
  }

  const openContextMenu = (e: MouseEvent, item: T): void => {
    openContextMenuAt(e.clientX, e.clientY, item)
  }

  const closeContextMenu = (): void => {
    contextMenu.visible = false
    selectedItem.value = null
  }

  onMounted(() => {
    if (closeOnWindowClick) {
      window.addEventListener('click', closeContextMenu)
    }
    if (closeOnWindowContextMenu) {
      window.addEventListener('contextmenu', closeContextMenu)
    }
  })

  onUnmounted(() => {
    if (closeOnWindowClick) {
      window.removeEventListener('click', closeContextMenu)
    }
    if (closeOnWindowContextMenu) {
      window.removeEventListener('contextmenu', closeContextMenu)
    }
  })

  return {
    contextMenu,
    selectedItem,
    openContextMenu,
    openContextMenuAt,
    closeContextMenu
  }
}
