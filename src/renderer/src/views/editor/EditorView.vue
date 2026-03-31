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
          <span class="text-blue-300">상세 보기</span>
        </div>
      </div>
    </div>

    <div class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 text-lg font-bold text-white">문서 폴더 목록</div>
        <div class="flex-1 space-y-2 overflow-y-auto">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="overflow-hidden rounded-xl border transition-colors"
            :class="folder.id === selectedFolderId ? 'border-blue-400/60 bg-slate-800' : 'border-white/10 bg-slate-900'"
          >
            <div class="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                @click="selectFolder(folder.id)"
              >
                <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
                <div class="text-xs text-slate-400">{{ folder.screenshots.length }}개 화면</div>
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
                  @click="selectScreenshot(folder.id, screenshot.id)"
                >
                  <div class="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-800">
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
            <i-lucide-arrow-left class="text-sm" />
            작업 목록으로
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

      <main class="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        <div class="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between">
          <div>
            <div class="text-xl font-bold text-white">3단계. 작업 화면 상세 보기</div>
            <div class="mt-1 text-sm text-slate-400">
              작업 목록 카드 하나를 상세하게 보면서 내용을 수정할 수 있습니다. 화면 캡쳐를 누르면 사진 편집 화면으로 이동합니다.
            </div>
          </div>
          <div class="rounded-xl border border-blue-400/30 bg-blue-900/20 px-3 py-2 text-sm text-blue-200">
            {{ currentPageLabel }} / 0{{ currentFolder.screenshots.length }} 화면
          </div>
        </div>

        <div
          v-if="!isWorkspaceLoaded"
          class="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          화면 정보를 불러오는 중입니다.
        </div>

        <div
          v-else-if="currentFolder.screenshots.length === 0"
          class="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          편집할 화면이 없습니다.
        </div>

        <div v-else class="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!hasPreviousScreenshot"
              @click="goToPreviousScreenshot"
            >
              <i-lucide-chevron-left class="text-base" />
            </button>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!hasNextScreenshot"
              @click="goToNextScreenshot"
            >
              <i-lucide-chevron-right class="text-base" />
            </button>
          </div>

          <DocumentDetailCard
            mode="editor"
            :screenshot="currentScreenshot ?? fallbackScreenshot"
            :folder-title="currentFolder.title"
            :folder-path="currentFolder.path"
            :folder-description="currentFolder.description"
            :format-card-date="formatCardDate"
            :page-label="currentPageLabel"
            :editor-page-title="draftPageTitle"
            :editor-writer-name="draftWriterName"
            :editor-path="draftPath"
            :editor-description="draftDescription"
            :editor-functionality-items="parsedFunctionalityItems"
            :has-pending-changes="hasPendingChanges"
            @update:pageTitle="draftPageTitle = $event"
            @update:writerName="draftWriterName = $event"
            @update:path="draftPath = $event"
            @update:description="draftDescription = $event"
            @update:functionalityItem="updateFunctionalityItem($event.number, $event.text)"
            @edit-image="currentScreenshot && openImageEditor(currentScreenshot.id)"
            @save="saveDetailChanges"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  type WorkspaceFolder,
  toFileImageSrc
} from '@/utils/manualWorkspace'
import DocumentDetailCard from '@/views/document/components/DocumentDetailCard.vue'

const router = useRouter()
const route = useRoute()

interface WorkspaceResponse {
  project: {
    id: string
    name: string
    description: string
  } | null
  folders: Array<{
    id: string
    title: string
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
const currentProject = ref<{ id: string; name: string; description: string } | null>(null)
const folders = ref<WorkspaceFolder[]>([])
const selectedFolderId = ref(String(route.query.documentFolderId ?? '') || null)
const selectedScreenshotId = ref(String(route.query.screenshotId ?? ''))
const isLeftSidebarOpen = ref(true)
const isWorkspaceLoaded = ref(false)
const expandedFolderIds = ref<string[]>([])
const draftPageTitle = ref('')
const draftPageNo = ref('1')
const draftPath = ref('')
const draftDescription = ref('')
const draftFunctionalityDescription = ref('')
const draftWriterName = ref('')

const formatCardDate = new Date().toISOString().slice(0, 10)
const cardAuthor = '담당자'

const fallbackFolder: WorkspaceFolder = {
  id: '',
  title: '선택된 폴더 없음',
  screenshots: []
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

  currentProject.value = response.project
  folders.value = mapWorkspaceFolders(response)
  ensureCurrentSelection()
  ensureExpandedFolder()
  isWorkspaceLoaded.value = true
}

const currentFolder = computed(
  () => folders.value.find((folder) => folder.id === selectedFolderId.value) ?? folders.value[0] ?? fallbackFolder
)
const currentScreenshot = computed(
  () =>
    currentFolder.value.screenshots.find((shot) => shot.id === selectedScreenshotId.value) ??
    currentFolder.value.screenshots[0] ??
    null
)
const selectedScreenshotIndex = computed(() =>
  Math.max(
    currentFolder.value.screenshots.findIndex((shot) => shot.id === currentScreenshot.value?.id) + 1,
    1
  )
)
const currentScreenshotArrayIndex = computed(() =>
  currentFolder.value.screenshots.findIndex((shot) => shot.id === currentScreenshot.value?.id)
)
const currentPageLabel = computed(() =>
  String(currentScreenshot.value?.pageNo ?? selectedScreenshotIndex.value).padStart(2, '0')
)
const hasPreviousScreenshot = computed(() => currentScreenshotArrayIndex.value > 0)
const hasNextScreenshot = computed(
  () =>
    currentScreenshotArrayIndex.value >= 0 &&
    currentScreenshotArrayIndex.value < currentFolder.value.screenshots.length - 1
)
const parsedFunctionalityItems = computed(() =>
  draftFunctionalityDescription.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const matched = line.match(/^(\d+)\.\s*(.*)$/)
      return {
        number: Number(matched?.[1] ?? index + 1),
        text: matched?.[2] ?? line
      }
    })
)

const syncSelectionFromRoute = (): void => {
  selectedFolderId.value = String(route.query.documentFolderId ?? '') || null
  selectedScreenshotId.value = String(route.query.screenshotId ?? '')
}

const updateFunctionalityItem = (number: number, text: string): void => {
  const items = parsedFunctionalityItems.value.map((item) =>
    item.number === number
      ? {
          ...item,
          text
        }
      : item
  )

  draftFunctionalityDescription.value = items.map((item) => `${item.number}. ${item.text}`).join('\n')
}

const hasPendingChanges = computed(
  () =>
    draftPageTitle.value !== (currentScreenshot.value?.pageTitle ?? currentFolder.value.title) ||
    draftPageNo.value !== String(currentScreenshot.value?.pageNo ?? selectedScreenshotIndex.value) ||
    draftPath.value !== (currentScreenshot.value?.menuPath ?? '') ||
    draftDescription.value !== (currentScreenshot.value?.screenDescription ?? '') ||
    draftFunctionalityDescription.value !==
      (currentScreenshot.value?.functionalityDescription ?? '') ||
    draftWriterName.value !== (currentScreenshot.value?.writerName ?? '')
)

const ensureCurrentSelection = (): void => {
  if (selectedScreenshotId.value) {
    const matchedFolder = folders.value.find((folder) =>
      folder.screenshots.some((shot) => shot.id === selectedScreenshotId.value)
    )

    if (matchedFolder) {
      selectedFolderId.value = matchedFolder.id
      return
    }
  }

  const nextFolder =
    folders.value.find((folder) => folder.id === selectedFolderId.value) ?? folders.value[0] ?? null

  selectedFolderId.value = nextFolder?.id ?? null
  selectedScreenshotId.value =
    nextFolder?.screenshots.find((shot) => shot.id === selectedScreenshotId.value)?.id ??
      nextFolder?.screenshots[0]?.id ??
      ''
}

const ensureExpandedFolder = (): void => {
  const currentId = selectedFolderId.value
  if (!currentId) return
  if (!expandedFolderIds.value.includes(currentId)) {
    expandedFolderIds.value = [...expandedFolderIds.value, currentId]
  }
}

const getAnnotationPreviewLines = (screenshotId: string): string[] => {
  const screenshot = currentFolder.value.screenshots.find((shot) => shot.id === screenshotId)
  if (!screenshot) {
    return ['등록된 기능 설명이 없습니다.']
  }

  const lines = screenshot.annotations
    .filter((annotation) => annotation.toolType !== 'box')
    .sort((left, right) => left.number - right.number)
    .map((annotation) => annotation.description.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return ['등록된 기능 설명이 없습니다.']
  }

  return lines.slice(0, 3)
}

const selectFolder = (id: string): void => {
  selectedFolderId.value = id
  selectedScreenshotId.value =
    folders.value.find((folder) => folder.id === id)?.screenshots[0]?.id ?? ''
  ensureExpandedFolder()
}

const selectScreenshot = (folderId: string, screenshotId: string): void => {
  selectedFolderId.value = folderId
  selectedScreenshotId.value = screenshotId
  ensureExpandedFolder()
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

const saveDetailChanges = async (): Promise<void> => {
  if (!currentScreenshot.value) return

  folders.value = folders.value.map((folder) =>
    folder.id === currentFolder.value.id
      ? {
          ...folder,
          screenshots: folder.screenshots.map((shot) =>
            shot.id === currentScreenshot.value?.id
              ? {
                  ...shot,
                  pageTitle: draftPageTitle.value,
                  pageNo: Number(draftPageNo.value || selectedScreenshotIndex.value),
                  menuPath: draftPath.value,
                  screenDescription: draftDescription.value,
                  functionalityDescription: draftFunctionalityDescription.value,
                  writerName: draftWriterName.value
                }
              : shot
          )
        }
      : folder
  )

  await window.api.invoke('capture:updateMeta', {
    captureId: currentScreenshot.value.id,
    pageTitle: draftPageTitle.value,
    menuPath: draftPath.value,
    screenDescription: draftDescription.value,
    functionalityDescription: draftFunctionalityDescription.value,
    writerName: draftWriterName.value,
    pageNo: Number(draftPageNo.value || selectedScreenshotIndex.value)
  })
}

const goWorkspace = async (): Promise<void> => {
  await router.push({
    name: 'workspace-index',
    query: {
      projectId: projectId.value,
      documentFolderId: selectedFolderId.value || undefined,
      captureFolderId: captureFolderId.value || undefined
    }
  })
}

const openImageEditor = async (screenshotId: string): Promise<void> => {
  await router.push({
    name: 'image-editor-index',
    query: {
      projectId: projectId.value,
      documentFolderId: currentFolder.value.id,
      screenshotId,
      captureFolderId: captureFolderId.value || undefined
    }
  })
}

const goToPreviousScreenshot = (): void => {
  if (!hasPreviousScreenshot.value) return
  const previous = currentFolder.value.screenshots[currentScreenshotArrayIndex.value - 1]
  if (!previous) return
  selectedScreenshotId.value = previous.id
}

const goToNextScreenshot = (): void => {
  if (!hasNextScreenshot.value) return
  const next = currentFolder.value.screenshots[currentScreenshotArrayIndex.value + 1]
  if (!next) return
  selectedScreenshotId.value = next.id
}

onMounted(() => {
  syncSelectionFromRoute()
  void loadWorkspaceFromDatabase()
})

watch(
  () => route.fullPath,
  () => {
    syncSelectionFromRoute()
    void loadWorkspaceFromDatabase()
  }
)

watch(
  () => currentScreenshot.value?.id,
  () => {
    draftPageTitle.value = currentScreenshot.value?.pageTitle ?? currentFolder.value.title
    draftPageNo.value = String(currentScreenshot.value?.pageNo ?? selectedScreenshotIndex.value)
    draftPath.value = currentScreenshot.value?.menuPath ?? ''
    draftDescription.value = currentScreenshot.value?.screenDescription ?? ''
    draftFunctionalityDescription.value = currentScreenshot.value?.functionalityDescription ?? ''
    draftWriterName.value = currentScreenshot.value?.writerName ?? ''
  },
  { immediate: true }
)
</script>
