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
          <span class="text-blue-300">선택 목록</span>
        </div>
      </div>
    </div>

    <!-- 2단계 화면은 선택된 폴더 목록과 작업 목록 영역으로 구성된다. -->
    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="text-sm font-semibold text-slate-300">문서 폴더 목록</div>
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
                  {{ folder.screenshots.length }}
                </div>
              </div>
              <div class="text-xs text-slate-400">{{ folder.screenshots.length }}개 화면</div>
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

        <div class="mt-auto border-t border-white/10 pt-4 space-y-2">
          <button
            type="button"
            class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
            @click="goCapture"
          >
            <i-lucide-folder-plus class="text-sm" />
            캡처 화면으로
          </button>
          <!-- <button
            type="button"
            class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
            @click="goSelectStep"
          >
            <i-lucide-arrow-left class="text-sm" />
            선택 화면으로
          </button> -->
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

      <!-- 선택된 캡처만 보여주며, 순서 변경과 편집 진입을 담당한다. -->
      <main class="min-w-0 flex-1 overflow-y-auto p-6">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <div class="text-xl font-bold text-white">2단계. 선택된 캡쳐 작업 목록</div>
            <div class="mt-1 text-sm text-slate-400">
              편집할 화면을 클릭하면 3단계 편집 화면으로 이동합니다.
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center rounded-2xl bg-[#ece9e4] p-1 shadow-sm">
              <button
                type="button"
                class="flex h-14 w-14 items-center justify-center rounded-xl transition-colors"
                :class="viewMode === 'grid' ? 'bg-[#dcd6ff] text-[#6a63d9]' : 'text-slate-500 hover:bg-[#dfdbd4]'"
                @click="viewMode = 'grid'"
              >
                <i-lucide-layout-grid class="text-xl" />
              </button>
              <button
                type="button"
                class="flex h-14 w-14 items-center justify-center rounded-xl transition-colors"
                :class="viewMode === 'spread' ? 'bg-[#dcd6ff] text-[#6a63d9]' : 'text-slate-500 hover:bg-[#dfdbd4]'"
                @click="viewMode = 'spread'"
              >
                <i-lucide-book-open class="text-xl" />
              </button>
            </div>
            <button
              type="button"
              class="btn border-0 bg-[#6f63dd] px-4 text-white shadow-none hover:bg-[#5e54c6] disabled:bg-slate-700 disabled:text-slate-400"
              :disabled="selectedFolderId === null"
              @click="openImportModal"
            >
              <i-lucide-image-plus class="text-sm" />
              캡쳐 이미지 불러오기
            </button>
          </div>
        </div>

        <div
          v-if="currentFolder.screenshots.length === 0"
          class="rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          선택된 캡쳐가 없습니다.
        </div>

        <div
          v-else
          class="grid gap-4"
          :class="
            viewMode === 'grid'
              ? 'grid-cols-[repeat(auto-fill,minmax(220px,248px))] justify-start'
              : 'grid-cols-1 2xl:grid-cols-2'
          "
        >
          <DocumentDetailCard
            v-for="(screenshot, index) in currentFolder.screenshots"
            :key="screenshot.id"
            mode="preview"
            :screenshot="screenshot"
            :index="index"
            :folder-title="currentFolder.title"
            :folder-path="currentFolder.path"
            :folder-description="currentFolder.description"
            :format-card-date="formatCardDate"
            :card-author="cardAuthor"
            :view-mode="viewMode"
            :drag-over="workspaceDragOverIndex === index"
            @dragstart="onWorkspaceDragStart(index)"
            @dragover="onWorkspaceDragOver(index)"
            @drop="onWorkspaceDrop(index)"
            @dragend="onWorkspaceDragEnd"
            @remove="removeScreenshot(screenshot.id)"
            @open="openEditorWithScreenshot(screenshot.id)"
          />
        </div>
      </main>
    </div>

    <div
      v-if="isImportModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-10"
      @click.self="closeImportModal"
    >
      <div class="flex h-full max-h-[780px] w-full max-w-[1180px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#12151d] shadow-2xl">
        <div class="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div class="text-lg font-black text-white">캡쳐 이미지 불러오기</div>
            <div class="mt-1 text-sm text-slate-400">
              폴더를 고른 뒤 오른쪽에서 가져올 이미지를 체크 버튼으로 선택할 수 있습니다.
            </div>
          </div>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            @click="closeImportModal"
          >
            <i-lucide-x class="text-base" />
          </button>
        </div>

        <div class="min-h-0 flex flex-1 overflow-hidden">
          <aside class="w-72 shrink-0 border-r border-white/10 bg-[#171a23] p-4">
            <div class="mb-3 text-sm font-semibold text-slate-300">캡처 폴더</div>
            <div class="space-y-2 overflow-y-auto">
              <button
                v-for="folder in captureSourceFolders"
                :key="folder.id"
                type="button"
                class="flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors"
                :class="
                  folder.id === focusedImportFolderId
                    ? 'border-blue-400/60 bg-slate-800'
                    : 'border-white/10 bg-slate-900 hover:border-white/20'
                "
                @click="focusImportFolder(folder.id)"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
                  <div class="mt-1 text-xs text-slate-400">{{ folder.screenshots.length }}개 이미지</div>
                </div>
              </button>
            </div>
          </aside>

          <section class="min-h-0 flex-1 overflow-y-auto p-5">
            <div
              v-if="captureSourceFolders.length === 0"
              class="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center text-slate-400"
            >
              가져올 수 있는 캡처 폴더가 없습니다.
            </div>

            <div
              v-else-if="focusedImportFolder.screenshots.length === 0"
              class="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center text-slate-400"
            >
              이 캡처 폴더에는 이미지가 없습니다.
            </div>

            <div v-else>
              <div class="mb-4">
                <div class="text-base font-bold text-white">{{ focusedImportFolder.title }}</div>
                <div class="mt-1 text-sm text-slate-400">
                  {{ focusedImportFolder.screenshots.length }}개 이미지
                </div>
              </div>

              <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                <div
                  v-for="screenshot in focusedImportFolder.screenshots"
                  :key="screenshot.id"
                  class="relative overflow-hidden rounded-2xl border bg-slate-900 text-left transition-colors"
                  :class="
                    pendingImportIds.includes(screenshot.id)
                      ? 'border-blue-400'
                      : 'border-white/10 hover:border-white/30'
                  "
                  role="button"
                  tabindex="0"
                  @click="openImportPreviewModal(focusedImportFolder.id, screenshot.id)"
                  @keydown.enter.prevent="openImportPreviewModal(focusedImportFolder.id, screenshot.id)"
                  @keydown.space.prevent="openImportPreviewModal(focusedImportFolder.id, screenshot.id)"
                >
                  <button
                    type="button"
                    class="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
                    @click.stop="openImportPreviewModal(focusedImportFolder.id, screenshot.id)"
                  >
                    <i-lucide-expand class="text-xs" />
                  </button>
                  <button
                    type="button"
                    class="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs"
                    :class="
                      pendingImportIds.includes(screenshot.id)
                        ? 'border-blue-300 bg-blue-500 text-white'
                        : 'border-white/40 bg-slate-900/80 text-slate-200'
                    "
                    @click.stop="toggleImportImage(screenshot.id)"
                  >
                    <i-lucide-check class="text-xs" />
                  </button>
                  <div class="h-40 overflow-hidden bg-slate-950">
                    <img :src="screenshot.image" alt="" class="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <div class="text-sm font-semibold text-slate-300">
            {{ selectedImportFolderCount }}개 폴더 / {{ pendingImportIds.length }}개 이미지 선택됨
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn border-white/10 bg-slate-800 text-slate-200 shadow-none hover:bg-slate-700"
              @click="closeImportModal"
            >
              취소
            </button>
            <button
              type="button"
              class="btn border-0 bg-[#6f63dd] text-white shadow-none hover:bg-[#5e54c6] disabled:bg-slate-700 disabled:text-slate-400"
              :disabled="pendingImportIds.length === 0 || !selectedFolderId"
              @click="importSelectedCaptures"
            >
              현재 문서 폴더로 가져오기
            </button>
          </div>
        </div>
      </div>
    </div>

    <ModalCaptureImages
      ref="importPreviewModalRef"
      :captureImageItems="focusedImportFolderCaptureImages"
      :title="focusedImportFolder.title"
      readonly
    />
    <ModalCaptureFolderForm
      ref="folderModalRef"
      :existingFolders="folders.map((folder) => ({ id: folder.id, title: folder.title }))"
      @onSave="saveFolderFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {type WorkspaceFolder,toFileImageSrc} from '@/utils/manualWorkspace'
import DocumentDetailCard from './components/DocumentDetailCard.vue'

const router = useRouter()
const route = useRoute()

interface ProjectRecord {
  id: string
  name: string
  description: string
}

interface WorkspaceResponse {
  project?: ProjectRecord | null
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

const projectId = computed(() => String(route.query.projectId ?? ''))
const captureFolderId = computed(() => String(route.query.captureFolderId ?? ''))
const currentProject = ref<ProjectRecord | null>(null)
const folders = ref<WorkspaceFolder[]>([])
const captureSourceFolders = ref<WorkspaceFolder[]>([])
const selectedFolderId = ref<string | null>(
  String(route.query.documentFolderId ?? '') || null
)
const isLeftSidebarOpen = ref(true)
const workspaceDragFromIndex = ref<number | null>(null)
const workspaceDragOverIndex = ref<number | null>(null)
const isImportModalOpen = ref(false)
const focusedImportFolderId = ref<string | null>(null)
const pendingImportIds = ref<string[]>([])
const importPreviewModalRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)
const folderModalRef = ref<ComponentRef<'ModalCaptureFolderForm'> | null>(null)
const viewMode = ref<'grid' | 'spread'>('grid')

const fallbackFolder: WorkspaceFolder = {
  id: '',
  title: '선택된 폴더 없음',
  path: '',
  description: '',
  screenshots: []
}

const mapWorkspaceFolders = (response: WorkspaceResponse, areaType: 'capture' | 'document'): WorkspaceFolder[] =>
  response.folders
    .filter((folder) => folder.area_type === areaType)
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
      menuPath: screenshot.menu_path,
      screenDescription: screenshot.screen_description,
      functionalityDescription: screenshot.functionality_description,
      writerName: screenshot.writer_name,
      pageNo: screenshot.page_no,
      pageTitle: screenshot.page_title,
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

const loadWorkspaceFromDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  const response = (await window.api.invoke('workspace:get', {
    projectId: projectId.value
  })) as WorkspaceResponse

  currentProject.value = response.project ?? null
  folders.value = mapWorkspaceFolders(response, 'document')
  captureSourceFolders.value = mapWorkspaceFolders(response, 'capture')
  ensureCurrentSelection()
  ensureFocusedImportFolder()
}

const currentFolder = computed(
  () => folders.value.find((folder) => folder.id === selectedFolderId.value) ?? folders.value[0] ?? fallbackFolder
)
const focusedImportFolder = computed(
  () => captureSourceFolders.value.find((folder) => folder.id === focusedImportFolderId.value) ?? fallbackFolder
)
const focusedImportFolderCaptureImages = computed(() =>
  focusedImportFolder.value.screenshots.map((screenshot) => ({
    id: screenshot.id,
    src: screenshot.image
  }))
)
const selectedManualCount = computed(() =>
  folders.value.reduce((sum, folder) => sum + folder.screenshots.length, 0)
)
const selectedImportFolderCount = computed(
  () =>
    captureSourceFolders.value.filter((folder) =>
      folder.screenshots.some((screenshot) => pendingImportIds.value.includes(screenshot.id))
    ).length
)

const ensureCurrentSelection = (): void => {
  if (selectedFolderId.value && folders.value.some((folder) => folder.id === selectedFolderId.value)) {
    return
  }

  selectedFolderId.value = folders.value[0]?.id ?? null
}

const ensureFocusedImportFolder = (): void => {
  if (
    focusedImportFolderId.value &&
    captureSourceFolders.value.some((folder) => folder.id === focusedImportFolderId.value)
  ) {
    return
  }

  focusedImportFolderId.value = captureSourceFolders.value[0]?.id ?? null
}

// 현재 폴더의 screenshots 배열만 부분 갱신하기 위한 유틸이다.
const patchCurrentFolder = (updater: (folder: WorkspaceFolder) => WorkspaceFolder): void => {
  folders.value = folders.value.map((folder) =>
    folder.id === currentFolder.value.id ? updater(folder) : folder
  )
}

// 드래그 시작/오버/종료/드롭으로 2단계 목록 순서 변경을 처리한다.
const onWorkspaceDragStart = (index: number): void => {
  workspaceDragFromIndex.value = index
  workspaceDragOverIndex.value = index
}

const onWorkspaceDragOver = (index: number): void => {
  workspaceDragOverIndex.value = index
}

const onWorkspaceDragEnd = (): void => {
  workspaceDragFromIndex.value = null
  workspaceDragOverIndex.value = null
}

const onWorkspaceDrop = (dropIndex: number): void => {
  const fromIndex = workspaceDragFromIndex.value
  if (fromIndex === null || fromIndex === dropIndex) {
    onWorkspaceDragEnd()
    return
  }

  const sourceId = currentFolder.value.screenshots[fromIndex]?.id
  const targetId = currentFolder.value.screenshots[dropIndex]?.id
  if (!sourceId || !targetId) {
    onWorkspaceDragEnd()
    return
  }

  patchCurrentFolder((folder) => {
    const screenshots = [...folder.screenshots]
    const sourceIndex = screenshots.findIndex((shot) => shot.id === sourceId)
    const targetIndex = screenshots.findIndex((shot) => shot.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return folder

    const [moved] = screenshots.splice(sourceIndex, 1)
    screenshots.splice(targetIndex, 0, moved)

    return {
      ...folder,
      screenshots
    }
  })

  void window.api.invoke('workspace:updateCaptureOrder', {
    folderId: currentFolder.value.id,
    orderedCaptureIds: currentFolder.value.screenshots.map((shot) => shot.id)
  })
  onWorkspaceDragEnd()
}

const formatCardDate = new Date().toISOString().slice(0, 10)
const cardAuthor = '담당자'

const syncFoldersToDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  await window.api.invoke('capture:syncFolders', {
    projectId: projectId.value,
    projectName: currentProject.value?.name ?? projectId.value,
    projectDescription: currentProject.value?.description ?? '',
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

const openFolderCreateModal = (): void => {
  folderModalRef.value?.onOpenCreate(folders.value.length + 1)
}

const openFolderEditModal = (folder: WorkspaceFolder): void => {
  folderModalRef.value?.onOpenEdit({
    id: folder.id,
    title: folder.title,
    path: folder.path,
    description: folder.description
  })
}

const saveFolderFromModal = (payload: {
  id: string | null
  title: string
  path: string
  description: string
}): void => {
  if (payload.id === null) {
    const id = `folder-${Date.now()}`
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
    selectedFolderId.value = id
    void syncFoldersToDatabase()
    return
  }

  folders.value = folders.value.map((folder) =>
    folder.id === payload.id
      ? {
          ...folder,
          title: payload.title,
          path: payload.path,
          description: payload.description,
          screenshots: folder.screenshots.map((screenshot) => ({
            ...screenshot,
            menuPath: payload.path,
            screenDescription: payload.description
          }))
        }
      : folder
  )

  void (async () => {
    await syncFoldersToDatabase()

    const targetFolder = folders.value.find((folder) => folder.id === payload.id)
    if (!targetFolder) return

    await Promise.all(
      targetFolder.screenshots.map((screenshot) =>
        window.api.invoke('capture:updateMeta', {
          captureId: screenshot.id,
          pageTitle: screenshot.pageTitle ?? targetFolder.title,
          menuPath: payload.path,
          screenDescription: payload.description,
          functionalityDescription: screenshot.functionalityDescription ?? '',
          writerName: screenshot.writerName ?? '',
          pageNo: screenshot.pageNo ?? 1
        })
      )
    )
  })()
}

const removeFolder = (folderId: string): void => {
  folders.value = folders.value.filter((folder) => folder.id !== folderId)
  ensureCurrentSelection()
  void syncFoldersToDatabase()
}

const openImportModal = (): void => {
  ensureFocusedImportFolder()
  pendingImportIds.value = []
  isImportModalOpen.value = true
}

const closeImportModal = (): void => {
  isImportModalOpen.value = false
  pendingImportIds.value = []
}

const focusImportFolder = (folderId: string): void => {
  focusedImportFolderId.value = folderId
}

const openImportPreviewModal = (folderId: string, imageId: string): void => {
  focusedImportFolderId.value = folderId
  importPreviewModalRef.value?.onOpen(imageId)
}

const toggleImportImage = (captureId: string): void => {
  pendingImportIds.value = pendingImportIds.value.includes(captureId)
    ? pendingImportIds.value.filter((id) => id !== captureId)
    : [...pendingImportIds.value, captureId]
}

const importSelectedCaptures = async (): Promise<void> => {
  if (!projectId.value || !selectedFolderId.value || pendingImportIds.value.length === 0) return

  const currentDocumentFolderId = selectedFolderId.value
  const currentDocumentFolder = folders.value.find((folder) => folder.id === currentDocumentFolderId)

  await syncFoldersToDatabase()

  const importedRows = (await window.api.invoke('capture:importToFolder', {
    projectId: projectId.value,
    targetFolderId: currentDocumentFolderId,
    projectName: currentProject.value?.name ?? projectId.value,
    folderTitle: currentDocumentFolder?.title ?? 'document-folder',
    folderPath: currentDocumentFolder?.path ?? '',
    folderDescription: currentDocumentFolder?.description ?? '',
    captureIds: [...pendingImportIds.value]
  })) as Array<{
    id: string
    image_path: string
    image_src?: string
  }>

  if (importedRows.length === 0) {
    closeImportModal()
    return
  }

  closeImportModal()
  await loadWorkspaceFromDatabase()
  selectedFolderId.value = currentDocumentFolderId
  await nextTick()
}

const removeScreenshot = async (screenshotId: string): Promise<void> => {
  const targetScreenshot = currentFolder.value.screenshots.find((shot) => shot.id === screenshotId)
  if (!targetScreenshot?.filePath) return

  await window.api.invoke('capture:remove', {
    captureId: screenshotId,
    filePath: targetScreenshot.filePath
  })

  patchCurrentFolder((folder) => ({
    ...folder,
    screenshots: folder.screenshots.filter((shot) => shot.id !== screenshotId)
  }))
}

// 좌측 폴더 목록 선택과 화면 이동 함수
const selectFolder = (id: string): void => {
  selectedFolderId.value = id
}

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goCapture = async (): Promise<void> => {

  await router.push({
    name: 'capture-index',
    query: { projectId: projectId.value,
             captureFolderId: captureFolderId.value
     }
  })
}


const openEditorWithScreenshot = async (screenshotId: string): Promise<void> => {
  await router.push({
    name: 'editor-index',
    query: {
      projectId: projectId.value,
      documentFolderId: currentFolder.value.id,
      screenshotId,
      captureFolderId: captureFolderId.value || undefined
    }
  })
}

onMounted(() => {
  void loadWorkspaceFromDatabase()
})
</script>
