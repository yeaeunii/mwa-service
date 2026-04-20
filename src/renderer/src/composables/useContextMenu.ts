import { onMounted, onUnmounted, reactive, ref, type Ref } from 'vue'

interface UseContextMenuOptions {
  closeOnWindowClick?: boolean
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
  closeContextMenu: () => void
}

export function useContextMenu<T = Record<string, unknown>>(
  options: UseContextMenuOptions = {}
): UseContextMenuReturn<T> {
  const { closeOnWindowClick = true } = options

  const selectedItem = ref<T | null>(null) as Ref<T | null>
  const contextMenu = reactive<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0
  })

  const openContextMenu = (e: MouseEvent, item: T): void => {
    contextMenu.x = e.clientX
    contextMenu.y = e.clientY
    contextMenu.visible = true
    selectedItem.value = item
  }

  const closeContextMenu = (): void => {
    contextMenu.visible = false
    selectedItem.value = null
  }

  onMounted(() => {
    if (!closeOnWindowClick) return
    window.addEventListener('click', closeContextMenu)
  })

  onUnmounted(() => {
    if (!closeOnWindowClick) return
    window.removeEventListener('click', closeContextMenu)
  })

  return {
    contextMenu,
    selectedItem,
    openContextMenu,
    closeContextMenu
  }
}
