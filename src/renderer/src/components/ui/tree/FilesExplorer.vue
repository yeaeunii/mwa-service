<template>
  <div
    ref="scrollContainer"
    class="flex flex-row flex-nowrap h-full w-full overflow-x-auto border border-base-300 rounded-lg bg-base-200 shadow-xl"
  >
    <div
      v-for="(items, index) in columns"
      :key="index"
      class="flex-none flex h-full min-h-0 w-64 flex-col border-r border-base-300 bg-base-100 last:border-r-0"
    >
      <div
        class="flex min-h-0 flex-1 flex-col overflow-y-auto"
        data-docs-col-empty-ctx
        :class="[dragOverEmptyColumnIndex === index ? 'bg-primary/5' : '']"
        @dragover="onDragOverColumnEmpty($event, index)"
        @drop.prevent="onDropColumnEmpty($event, index)"
        @click.self="clearMultiSelection()"
        @contextmenu.prevent="onEmptyAreaContextMenu($event, index)"
      >
        <ul class="menu menu-md w-full shrink-0 p-2">
          <li
            v-for="item in items"
            :key="item.id"
            @dragover.stop="onDragOverRow($event, item)"
            @drop.stop.prevent="onDropRow($event, item)"
          >
            <button
              type="button"
              draggable="true"
              class="w-full"
              data-docs-tab-ctx-trigger
              :class="[
                'flex justify-between items-center rounded-md transition-colors',
                multiSelected.has(item.id)
                  ? 'bg-primary/20 text-primary-content'
                  : selectedPath[index] === item.id
                    ? 'active bg-primary text-primary-content'
                    : 'hover:bg-base-200',
                item.type === 'folder' && dragOverFolderId === item.id
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100'
                  : ''
              ]"
              @click="onItemClick($event, item, index)"
              @contextmenu.prevent.stop="onRowContextMenu($event, item, index)"
              @dragstart="onDragStart($event, item)"
              @dragend="onDragEnd"
            >
              <div class="flex items-center gap-2">
                <span v-if="item.type === 'folder'" class="text-warning">📁</span>
                <span v-else class="text-info">📄</span>
                <input
                  v-if="renamingItemId === item.id"
                  ref="renameInputRef"
                  v-model="renameValue"
                  class="input input-xs input-bordered w-40 bg-white text-base-content"
                  @click.stop
                  @keydown.enter="commitRename"
                  @keydown.escape="cancelRename"
                  @blur="commitRename"
                />
                <span v-else class="truncate w-40 text-left">{{ item.name }}</span>
              </div>

              <i-lucide-chevron-right v-if="item.type === 'folder'" class="w-4 h-4 opacity-50" />
            </button>
          </li>
        </ul>
        <div class="min-h-24 flex-1 shrink-0" aria-hidden="true" />
      </div>
    </div>

    <div
      v-if="previewItem"
      class="flex-none w-80 p-8 flex flex-col items-center justify-center bg-base-100 border-l border-base-300"
    >
      <div class="text-6xl mb-4">📄</div>
      <h3 class="text-lg font-bold">{{ previewItem.name }}</h3>
      <p class="text-sm opacity-60">Type: {{ previewItem.type }}</p>
      <button class="btn btn-primary btn-sm mt-4">Open File</button>
    </div>
  </div>

  <Teleport to="body">
    <ul
      v-if="contextMenu.visible"
      class="docs-tab-ctx-menu menu fixed z-[9999] w-52 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      role="menu"
      @click.stop
    >
      <template v-if="isMultiContext">
        <li class="px-2 py-1.5">
          <div class="text-sm font-semibold text-base-content">
            {{ multiSelected.size }}개 선택됨
          </div>
        </li>
        <div class="my-1 border-t border-base-200"></div>
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-error hover:bg-error/10"
            role="menuitem"
            @click="deleteMultipleItems"
          >
            <i-lucide-trash-2 class="h-4 w-4 shrink-0 opacity-70" />
            {{ multiSelected.size }}개 삭제
          </button>
        </li>
      </template>
      <template v-else>
        <li class="px-2 py-1.5">
          <div class="truncate text-sm font-semibold text-base-content">
            {{ ctxMenuItem?.name }}
          </div>
          <div class="text-xs text-base-content/60">
            {{ ctxMenuItem?.type === 'folder' ? '폴더' : '파일' }}
          </div>
        </li>
        <div class="my-1 border-t border-base-200"></div>
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-base-200"
            role="menuitem"
            @click="onDocsContextAction('open')"
          >
            <i-lucide-folder-open class="h-4 w-4 shrink-0 opacity-70" />
            열기
          </button>
        </li>
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-base-200"
            role="menuitem"
            @click="onDocsContextAction('rename')"
          >
            <i-lucide-pencil class="h-4 w-4 shrink-0 opacity-70" />
            이름 바꾸기
          </button>
        </li>
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-error hover:bg-error/10"
            role="menuitem"
            @click="onDocsContextAction('delete')"
          >
            <i-lucide-trash class="h-4 w-4 shrink-0 opacity-70" />
            삭제
          </button>
        </li>
      </template>
    </ul>
    <ul
      v-if="emptyContextMenu.visible"
      class="docs-tab-empty-ctx-menu menu fixed z-[9999] w-52 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      :style="{ left: `${emptyContextMenu.x}px`, top: `${emptyContextMenu.y}px` }"
      role="menu"
      @click.stop
    >
      <li class="px-2 py-1.5">
        <div class="text-xs font-semibold text-base-content/70">이 위치에 만들기</div>
      </li>
      <div class="my-1 border-t border-base-200"></div>
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-base-200"
          role="menuitem"
          @click="onEmptyCtxAction('folder')"
        >
          <i-lucide-folder-plus class="h-4 w-4 shrink-0 opacity-70" />
          새 폴더
        </button>
      </li>
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-base-200"
          role="menuitem"
          @click="onEmptyCtxAction('file')"
        >
          <i-lucide-file-plus class="h-4 w-4 shrink-0 opacity-70" />
          새 파일
        </button>
      </li>
    </ul>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useContextMenu } from '@/composables/useContextMenu'

export interface TreeItem {
  id: number
  name: string
  type: 'folder' | 'file'
  children?: TreeItem[]
}

const props = withDefaults(
  defineProps<{
    initialTree?: TreeItem[]
  }>(),
  { initialTree: () => [] }
)

const emit = defineEmits<{
  (e: 'changed', tree: TreeItem[]): void
}>()

function cloneTree(data: TreeItem[]): TreeItem[] {
  return JSON.parse(JSON.stringify(data)) as TreeItem[]
}

const root = ref<TreeItem[]>(cloneTree(props.initialTree))

watch(
  () => props.initialTree,
  (v) => {
    root.value = cloneTree(v)
    selectedPath.value = []
    previewItem.value = null
    clearMultiSelection()
    syncColumnsFromSelection()
  }
)

function emitChanged(): void {
  emit('changed', cloneTree(root.value))
}

const columns = ref<TreeItem[][]>([root.value])
const selectedPath = ref<number[]>([])
const previewItem = ref<TreeItem | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const multiSelected = ref<Set<number>>(new Set())
const multiSelectedColumn = ref<number>(-1)

const dragSourceId = ref<number | null>(null)
const dragOverFolderId = ref<number | null>(null)
const dragOverEmptyColumnIndex = ref<number | null>(null)

const {
  contextMenu,
  selectedItem: ctxMenuItem,
  openContextMenu,
  closeContextMenu
} = useContextMenu<TreeItem>()

type EmptyCtxPayload = { columnIndex: number }

const {
  contextMenu: emptyContextMenu,
  selectedItem: emptyCtxPayload,
  openContextMenu: openEmptyContextMenu,
  closeContextMenu: closeEmptyContextMenu
} = useContextMenu<EmptyCtxPayload>()

const ctxMenuColumnIndex = ref(0)

const isMultiContext = computed(
  () =>
    multiSelected.value.size > 1 &&
    ctxMenuItem.value != null &&
    multiSelected.value.has(ctxMenuItem.value.id)
)

const renamingItemId = ref<number | null>(null)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename(item: TreeItem): void {
  renamingItemId.value = item.id
  renameValue.value = item.name
  nextTick(() => {
    const inputs = renameInputRef.value
    const el = Array.isArray(inputs) ? (inputs as HTMLInputElement[])[0] : inputs
    if (el) {
      el.focus()
      el.select()
    }
  })
}

function commitRename(): void {
  if (renamingItemId.value == null) return
  const node = findNode(root.value, renamingItemId.value)
  const newName = renameValue.value.trim()

  if (node && newName.length > 0 && newName !== node.name) {
    const loc = findParentList(root.value, node.id)
    const hasDuplicate =
      loc != null &&
      loc.list.some((n) => n.id !== node.id && n.type === node.type && n.name === newName)

    if (!hasDuplicate) {
      node.name = newName
      emitChanged()
    }
  }

  renamingItemId.value = null
  renameValue.value = ''
}

function cancelRename(): void {
  renamingItemId.value = null
  renameValue.value = ''
}

function findNode(list: TreeItem[], id: number): TreeItem | null {
  for (const n of list) {
    if (n.id === id) return n
    if (n.type === 'folder' && n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentList(
  list: TreeItem[],
  id: number,
  parentNode: TreeItem | null = null
): { list: TreeItem[]; index: number; parentNode: TreeItem | null } | null {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return { list, index: i, parentNode }
    }
    const n = list[i]
    if (n.type === 'folder' && n.children) {
      const found = findParentList(n.children, id, n)
      if (found) return found
    }
  }
  return null
}

function subtreeContainsId(node: TreeItem, id: number): boolean {
  if (node.id === id) return true
  if (node.type === 'folder' && node.children) {
    return node.children.some((c) => subtreeContainsId(c, id))
  }
  return false
}

function isChildrenArrayInsideFolder(folder: TreeItem, arr: TreeItem[]): boolean {
  if (folder.type !== 'folder' || !folder.children) return false
  if (folder.children === arr) return true
  return folder.children.some((c) => c.type === 'folder' && isChildrenArrayInsideFolder(c, arr))
}

function moveItemToList(sourceId: number, targetList: TreeItem[]): boolean {
  const srcLoc = findParentList(root.value, sourceId)
  if (!srcLoc) return false

  const sourceNode = srcLoc.list[srcLoc.index]
  if (sourceNode.type === 'folder' && isChildrenArrayInsideFolder(sourceNode, targetList)) {
    return false
  }

  const [removed] = srcLoc.list.splice(srcLoc.index, 1)
  targetList.push(removed)
  return true
}

function moveItem(sourceId: number, targetFolderId: number): boolean {
  if (sourceId === targetFolderId) return false

  const targetFolder = findNode(root.value, targetFolderId)
  if (!targetFolder || targetFolder.type !== 'folder') return false

  if (!targetFolder.children) targetFolder.children = []
  return moveItemToList(sourceId, targetFolder.children)
}

function isSourceInCurrentColumnList(sourceId: number, colIndex: number): boolean {
  const colItems = columns.value[colIndex]
  if (colItems == null) return false
  const srcLoc = findParentList(root.value, sourceId)
  if (!srcLoc) return false
  return srcLoc.list === colItems
}

function isEventInsideMenuListRow(e: DragEvent): boolean {
  const t = e.target
  return t instanceof Element && t.closest('ul.menu li') !== null
}

function syncColumnsFromSelection(): void {
  const cols: TreeItem[][] = [root.value]
  for (let i = 0; i < selectedPath.value.length; i++) {
    const id = selectedPath.value[i]
    const currentColumn = cols[cols.length - 1]
    const node = currentColumn.find((n) => n.id === id)
    if (!node) break
    if (node.type === 'folder' && node.children) {
      cols.push(node.children)
    } else {
      break
    }
  }
  columns.value = cols
}

const selectItem = (item: TreeItem, index: number): void => {
  selectedPath.value = selectedPath.value.slice(0, index)
  selectedPath.value[index] = item.id
  previewItem.value = item.type === 'file' ? item : null
  syncColumnsFromSelection()

  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({
        left: scrollContainer.value.scrollWidth,
        behavior: 'smooth'
      })
    }
  })
}

function clearMultiSelection(): void {
  multiSelected.value = new Set()
  multiSelectedColumn.value = -1
}

function onItemClick(e: MouseEvent, item: TreeItem, index: number): void {
  if (e.metaKey || e.ctrlKey) {
    if (multiSelectedColumn.value !== index) {
      const s = new Set<number>()
      const activeId = selectedPath.value[index]
      if (activeId != null) s.add(activeId)
      multiSelected.value = s
      multiSelectedColumn.value = index
    }

    const activeId = selectedPath.value[index]
    if (activeId != null && !multiSelected.value.has(activeId)) {
      multiSelected.value.add(activeId)
    }

    const s = new Set(multiSelected.value)
    if (s.has(item.id)) {
      s.delete(item.id)
    } else {
      s.add(item.id)
    }

    if (activeId != null) {
      selectedPath.value = selectedPath.value.slice(0, index)
      previewItem.value = null
      syncColumnsFromSelection()
    }

    multiSelected.value = s
    if (s.size === 0) multiSelectedColumn.value = -1
    return
  }
  clearMultiSelection()
  selectItem(item, index)
}

function getEffectiveDragIds(primaryId: number): number[] {
  if (multiSelected.value.size > 0 && multiSelected.value.has(primaryId)) {
    return [...multiSelected.value]
  }
  return [primaryId]
}

function moveMultipleToFolder(ids: number[], targetFolderId: number): boolean {
  let moved = false
  for (const id of ids) {
    if (id === targetFolderId) continue
    if (moveItem(id, targetFolderId)) moved = true
  }
  return moved
}

function moveMultipleToList(ids: number[], targetList: TreeItem[]): boolean {
  let moved = false
  for (const id of ids) {
    if (moveItemToList(id, targetList)) moved = true
  }
  return moved
}

function nextTreeItemId(): number {
  let max = 0
  const walk = (list: TreeItem[]): void => {
    for (const n of list) {
      if (n.id > max) max = n.id
      if (n.type === 'folder' && n.children) walk(n.children)
    }
  }
  walk(root.value)
  return max + 1
}

function onEmptyAreaContextMenu(e: MouseEvent, colIndex: number): void {
  const t = e.target
  if (!(t instanceof Element)) return
  if (t.closest('[data-docs-tab-ctx-trigger]')) return
  if (t.closest('ul.menu li')) return

  closeContextMenu()
  openEmptyContextMenu(e, { columnIndex: colIndex })
}

function uniqueName(baseName: string, list: TreeItem[]): string {
  const names = new Set(list.map((n) => n.name))
  if (!names.has(baseName)) return baseName
  let i = 1
  while (names.has(`${baseName}${i}`)) i++
  return `${baseName}${i}`
}

function onEmptyCtxAction(kind: 'folder' | 'file'): void {
  const payload = emptyCtxPayload.value
  closeEmptyContextMenu()
  if (!payload) return

  const list = columns.value[payload.columnIndex]
  if (list == null) return

  const id = nextTreeItemId()
  const newItem: TreeItem =
    kind === 'folder'
      ? { id, name: uniqueName('새 폴더', list), type: 'folder', children: [] }
      : { id, name: uniqueName('새 파일', list), type: 'file' }

  list.push(newItem)
  syncColumnsFromSelection()
  emitChanged()

  nextTick(() => startRename(newItem))
}

function onRowContextMenu(e: MouseEvent, item: TreeItem, colIndex: number): void {
  closeEmptyContextMenu()
  ctxMenuColumnIndex.value = colIndex
  openContextMenu(e, item)
}

type DocsCtxAction = 'open' | 'rename' | 'delete'

function onDocsContextAction(action: DocsCtxAction): void {
  const item = ctxMenuItem.value
  const col = ctxMenuColumnIndex.value
  closeContextMenu()
  closeEmptyContextMenu()
  if (!item) return

  if (action === 'open') {
    selectItem(item, col)
    return
  }

  if (action === 'rename') {
    startRename(item)
    return
  }

  const loc = findParentList(root.value, item.id)
  if (!loc) return

  const pi = selectedPath.value.indexOf(item.id)
  if (pi >= 0) {
    selectedPath.value = selectedPath.value.slice(0, pi)
  }
  if (previewItem.value?.id === item.id) {
    previewItem.value = null
  }

  loc.list.splice(loc.index, 1)
  syncColumnsFromSelection()
  emitChanged()
}

function deleteMultipleItems(): void {
  closeContextMenu()
  closeEmptyContextMenu()

  const ids = [...multiSelected.value]
  for (const id of ids) {
    const loc = findParentList(root.value, id)
    if (!loc) continue

    const pi = selectedPath.value.indexOf(id)
    if (pi >= 0) {
      selectedPath.value = selectedPath.value.slice(0, pi)
    }
    if (previewItem.value?.id === id) {
      previewItem.value = null
    }

    loc.list.splice(loc.index, 1)
  }

  clearMultiSelection()
  syncColumnsFromSelection()
  emitChanged()
}

onMounted(() => {
  const closeCtxOnOutsideRightClick = (e: MouseEvent): void => {
    const el = e.target
    if (!(el instanceof Element)) return

    if (contextMenu.visible) {
      const keepItem =
        el.closest('.docs-tab-ctx-menu') != null ||
        el.closest('[data-docs-tab-ctx-trigger]') != null
      if (!keepItem) closeContextMenu()
    }

    if (emptyContextMenu.visible) {
      const keepEmpty =
        el.closest('.docs-tab-empty-ctx-menu') != null ||
        el.closest('[data-docs-col-empty-ctx]') != null
      if (!keepEmpty) closeEmptyContextMenu()
    }
  }
  document.addEventListener('contextmenu', closeCtxOnOutsideRightClick)
  onUnmounted(() => document.removeEventListener('contextmenu', closeCtxOnOutsideRightClick))
})

function onDragStart(e: DragEvent, item: TreeItem): void {
  dragSourceId.value = item.id
  const ids = getEffectiveDragIds(item.id)
  e.dataTransfer?.setData('application/x-fs-id', String(item.id))
  e.dataTransfer?.setData('application/x-fs-ids', JSON.stringify(ids))
  e.dataTransfer?.setData('text/plain', item.name)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd(): void {
  dragSourceId.value = null
  dragOverFolderId.value = null
  dragOverEmptyColumnIndex.value = null
}

function onDragOverColumnEmpty(e: DragEvent, colIndex: number): void {
  if (dragSourceId.value === null) return
  if (isEventInsideMenuListRow(e)) return

  dragOverFolderId.value = null

  const sid = dragSourceId.value
  const targetList = columns.value[colIndex]
  if (targetList == null) return

  if (isSourceInCurrentColumnList(sid, colIndex)) {
    dragOverEmptyColumnIndex.value = null
    return
  }

  const srcLoc = findParentList(root.value, sid)
  if (!srcLoc) return

  const sourceNode = srcLoc.list[srcLoc.index]
  if (sourceNode.type === 'folder' && isChildrenArrayInsideFolder(sourceNode, targetList)) {
    dragOverEmptyColumnIndex.value = null
    return
  }

  e.preventDefault()
  dragOverEmptyColumnIndex.value = colIndex
}

function onDropColumnEmpty(e: DragEvent, colIndex: number): void {
  if (isEventInsideMenuListRow(e)) return

  const raw = e.dataTransfer?.getData('application/x-fs-id')
  const sourceId = dragSourceId.value ?? (raw ? Number(raw) : NaN)
  if (!Number.isFinite(sourceId)) return

  if (isSourceInCurrentColumnList(sourceId, colIndex)) {
    e.preventDefault()
    dragOverEmptyColumnIndex.value = null
    return
  }

  const targetList = columns.value[colIndex]
  if (targetList == null) return

  e.preventDefault()
  dragOverEmptyColumnIndex.value = null

  const ids = parseDragIds(e)
  if (ids.length === 0) return
  if (!moveMultipleToList(ids, targetList)) return

  clearMultiSelection()
  previewItem.value = null
  syncColumnsFromSelection()
  emitChanged()
}

function onDragOverRow(e: DragEvent, item: TreeItem): void {
  if (dragSourceId.value === null) return

  dragOverEmptyColumnIndex.value = null

  if (item.type !== 'folder') {
    dragOverFolderId.value = null
    return
  }

  const sid = dragSourceId.value
  if (sid === item.id) {
    dragOverFolderId.value = null
    return
  }

  const src = findNode(root.value, sid)
  if (src?.type === 'folder' && subtreeContainsId(src, item.id)) {
    dragOverFolderId.value = null
    return
  }

  e.preventDefault()
  dragOverFolderId.value = item.id
}

function parseDragIds(e: DragEvent): number[] {
  const rawMulti = e.dataTransfer?.getData('application/x-fs-ids')
  if (rawMulti) {
    try {
      const arr = JSON.parse(rawMulti) as number[]
      if (Array.isArray(arr) && arr.length > 0) return arr
    } catch {
      /* ignore */
    }
  }
  const raw = e.dataTransfer?.getData('application/x-fs-id')
  const id = dragSourceId.value ?? (raw ? Number(raw) : NaN)
  return Number.isFinite(id) ? [id] : []
}

function onDropRow(e: DragEvent, item: TreeItem): void {
  if (item.type !== 'folder') return
  e.preventDefault()

  const ids = parseDragIds(e)
  dragOverFolderId.value = null

  if (ids.length === 0) return
  if (!moveMultipleToFolder(ids, item.id)) return

  clearMultiSelection()
  previewItem.value = null
  syncColumnsFromSelection()
  emitChanged()
}
</script>
