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
          <span class="text-blue-300">캡쳐 선택</span>
        </div>
      </div>
    </div>

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="text-sm font-semibold text-slate-300">폴더 목록</div>
          <button
            type="button"
            class="btn btn-xs border-0 bg-white text-blue-900 shadow-none hover:bg-sky-100"
            @click="openFolderCreateModal"
          >
            <i-lucide-plus class="text-sm" />
          </button>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
            :class="
              folder.id === selectedFolderId
                ? 'border-blue-400/60 bg-slate-800'
                : 'border-white/10 bg-slate-900 hover:border-white/20'
            "
          >
            <button type="button" class="min-w-0 flex-1 text-left" @click="selectFolder(folder.id)">
              <div class="flex items-center gap-2">
                <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
                <div class="badge border-0 bg-blue-900/60 text-blue-100">
                  {{ getSelectedCount(folder.id) }}
                </div>
              </div>
              <div class="text-xs text-slate-400">
                {{ folder.screenshots.length }}개 중 {{ getSelectedCount(folder.id) }}개 선택
              </div>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs h-6 min-h-0 w-6 p-0 text-slate-300 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              @click.stop="openFolderEditModal(folder)"
            >
              <i-lucide-pencil class="text-xs" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs h-6 min-h-0 w-6 p-0 text-rose-400 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              @click.stop="removeFolder(folder.id)"
            >
              <i-lucide-trash-2 class="text-xs" />
            </button>
          </div>
        </div>

        <div class="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
            @click="goCapture"
          >
            <i-lucide-folder-plus class="text-sm" />
            캡처 화면으로
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

      <main class="relative min-w-0 flex-1 overflow-y-auto p-6 pb-28">
        <div class="mb-5">
          <div class="text-xl font-bold text-white">1단계. 매뉴얼에 쓸 캡쳐 선택</div>
          <div class="mt-1 text-sm text-slate-400">
            필요한 화면을 선택한 뒤, 하단의 편집 시작 버튼으로 다음 단계로 이동합니다.
          </div>
        </div>

        <div
          v-if="currentFolder.screenshots.length === 0"
          class="rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          이 폴더에는 캡쳐된 화면이 없습니다.
        </div>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] justify-start gap-4"
        >
          <button
            v-for="screenshot in currentFolder.screenshots"
            :key="screenshot.id"
            type="button"
            class="group overflow-hidden rounded-2xl border-2 text-left transition-colors"
            :class="
              isScreenshotSelected(currentFolder.id, screenshot.id)
                ? 'border-blue-400 bg-slate-900'
                : 'border-white/10 bg-slate-900 hover:border-white/30'
            "
            @click="toggleScreenshotSelection(currentFolder.id, screenshot.id)"
          >
            <div class="relative h-40 w-full overflow-hidden bg-slate-950">
              <button
                type="button"
                class="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
                @click.stop="openSelectPreviewModal(screenshot.id)"
              >
                <i-lucide-expand class="text-xs" />
              </button>
              <img :src="screenshot.image" alt="" class="h-full w-full object-cover" />
              <div
                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                :class="
                  isScreenshotSelected(currentFolder.id, screenshot.id)
                    ? 'border-blue-300 bg-blue-500 text-white'
                    : 'border-white/40 bg-slate-900/80 text-slate-200'
                "
              >
                <i-lucide-check class="text-xs" />
              </div>
            </div>
            <div class="flex items-center justify-between px-3 py-2"></div>
          </button>
        </div>

        <div class="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-6">
          <div class="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-white">{{ selectedManualCount }}개의 화면 선택됨</div>
              <div class="text-xs text-slate-400">필요한 화면만 선택한 뒤 편집 시작을 눌러주세요.</div>
            </div>
            <button
              type="button"
              class="btn btn-sm border-0 bg-slate-700 text-white shadow-none hover:bg-slate-600"
              :disabled="selectedManualCount === 0"
              @click="clearSelectedScreenshots"
            >
              전체 선택 해제
            </button>
            <button
              type="button"
              class="btn h-11 border-0 bg-blue-700 px-6 text-base font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-700"
              :disabled="selectedManualCount === 0"
              @click="goWorkspace"
            >
              매뉴얼 편집 시작
              <i-lucide-arrow-right class="text-base" />
            </button>
          </div>
        </div>
      </main>
    </div>

    <ModalCaptureFolderForm ref="folderModalRef" @onSave="saveFolderFromModal" />
    <ModalCaptureImages
      ref="selectPreviewModalRef"
      :captureImageItems="currentFolderCaptureImages"
      :title="currentFolder.title"
      :selectedImageIds="currentFolderSelectedIds"
      readonly
      @onToggleSelect="toggleSelectionFromPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { editorDummyFolders, type DummyEditorFolder } from '@/assets/dummy/data'

type EditorFolder = DummyEditorFolder

type SelectedForManual = Record<number, string[]>

const STORAGE_KEY = 'miso-editor-selected-screenshots'

const router = useRouter()

const createEmptySelection = (folders: EditorFolder[]): SelectedForManual =>
  folders.reduce<SelectedForManual>((acc, folder) => {
    acc[folder.id] = []
    return acc
  }, {})

const saveSelectedForManual = (selection: SelectedForManual): void => {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
}

const folders = ref<EditorFolder[]>(editorDummyFolders.map((folder) => ({ ...folder, screenshots: [...folder.screenshots] })))
const selectedForManual = ref<SelectedForManual>(createEmptySelection(folders.value))
const selectedFolderId = ref(folders.value[0]?.id ?? -1)
const isLeftSidebarOpen = ref(true)

const folderModalRef = ref<ComponentRef<'ModalCaptureFolderForm'> | null>(null)
const selectPreviewModalRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)

const fallbackFolder: EditorFolder = {
  id: -1,
  title: '선택된 폴더 없음',
  path: '',
  description: '',
  screenshots: []
}

const currentFolder = computed(
  () => folders.value.find((folder) => folder.id === selectedFolderId.value) ?? fallbackFolder
)

const currentFolderCaptureImages = computed(() =>
  currentFolder.value.screenshots.map((screenshot) => ({
    id: screenshot.id,
    dataUrl: screenshot.image
  }))
)

const currentFolderSelectedIds = computed(() => selectedForManual.value[currentFolder.value.id] ?? [])

const selectedManualCount = computed(() =>
  Object.values(selectedForManual.value).reduce((sum, ids) => sum + ids.length, 0)
)

const isScreenshotSelected = (folderId: number, screenshotId: string): boolean =>
  selectedForManual.value[folderId]?.includes(screenshotId) ?? false

const getSelectedCount = (folderId: number): number => selectedForManual.value[folderId]?.length ?? 0

const toggleScreenshotSelection = (folderId: number, screenshotId: string): void => {
  const current = selectedForManual.value[folderId] ?? []
  selectedForManual.value = {
    ...selectedForManual.value,
    [folderId]: current.includes(screenshotId)
      ? current.filter((id) => id !== screenshotId)
      : [...current, screenshotId]
  }
}

const clearSelectedScreenshots = (): void => {
  selectedForManual.value = createEmptySelection(folders.value)
}

const openSelectPreviewModal = (imageId: string): void => {
  selectPreviewModalRef.value?.onOpen(imageId)
}

const toggleSelectionFromPreview = (screenshotId: string): void => {
  toggleScreenshotSelection(currentFolder.value.id, screenshotId)
}

const openFolderCreateModal = (): void => {
  folderModalRef.value?.onOpenCreate(folders.value.length + 1)
}

const openFolderEditModal = (folder: EditorFolder): void => {
  folderModalRef.value?.onOpenEdit({
    id: folder.id,
    title: folder.title,
    path: folder.path,
    description: folder.description
  })
}

const removeFolder = (folderId: number): void => {
  folders.value = folders.value.filter((folder) => folder.id !== folderId)
  const nextSelected = { ...selectedForManual.value }
  delete nextSelected[folderId]
  selectedForManual.value = nextSelected

  if (selectedFolderId.value === folderId) {
    selectedFolderId.value = folders.value[0]?.id ?? -1
  }
}

const saveFolderFromModal = (payload: {
  id: number | null
  title: string
  path: string
  description: string
}): void => {
  if (payload.id === null) {
    const id = Date.now()
    folders.value = [
      ...folders.value,
      {
        id,
        title: payload.title,
        path: payload.path,
        description: payload.description,
        screenshots: []
      }
    ]
    selectedForManual.value = {
      ...selectedForManual.value,
      [id]: []
    }
    selectedFolderId.value = id
    return
  }

  folders.value = folders.value.map((folder) =>
    folder.id === payload.id
      ? {
          ...folder,
          title: payload.title,
          path: payload.path,
          description: payload.description
        }
      : folder
  )
}

const selectFolder = (id: number): void => {
  selectedFolderId.value = id
}

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goCapture = async (): Promise<void> => {
  await router.push({ name: 'capture-index' })
}

const goWorkspace = async (): Promise<void> => {
  if (selectedManualCount.value === 0) return
  saveSelectedForManual(selectedForManual.value)
  await router.push({ name: 'editor-index', query: { step: 'workspace' } })
}
</script>
