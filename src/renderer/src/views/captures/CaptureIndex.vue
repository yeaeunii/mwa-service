<template>
  <div class="drawer drawer-end">
    <input id="drawerRight" v-model="isDrawerOpen" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
      <div class="flex h-[100vh] flex-col">
        <div class="flex items-center gap-3 border-b border-white/10 bg-slate-900 p-2">
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-none bg-slate-900 text-white transition-colors hover:bg-slate-900"
              @click="goHome"
            >
            <i-lucide-house class="text-lg" />
          </button>

          <div class="flex grow items-center gap-2">
            <div class="flex gap-1">
              <button :disabled="!canGoBack" class="btn btn-sm btn-ghost" @click="goBack">
                <i-lucide-chevron-left />
              </button>
              <button :disabled="!canGoForward" class="btn btn-sm btn-ghost" @click="goForward">
                <i-lucide-chevron-right />
              </button>
              <button class="btn btn-sm btn-ghost" :disabled="isLoading" @click="reload">
                <div v-if="isLoading" class="loading loading-spinner loading-sm"></div>
                <i-lucide-refresh-cw />
              </button>
            </div>
            <form class="flex flex-1 gap-2" @submit.prevent="navigate">
              <input
                v-model="urlInput"
                type="text"
                class="input input-sm input-bordered w-full font-mono text-sm"
                placeholder="https://example.com"
              />
            </form>
          </div>

            <div class="flex items-center gap-2 md:w-1/2 lg:w-[28rem]">
              <div
                class="flex h-8 grow items-center rounded-lg border border-white/30 bg-white/5 text-white"
              >
                <details class="dropdown dropdown-bottom" :open="isFolderDropdownOpen">
                  <summary
                    class="flex h-8 w-12 cursor-pointer items-center justify-center border-r border-white/20"
                    @click.prevent="isFolderDropdownOpen = !isFolderDropdownOpen"
                  >
                    <i-lucide-chevron-down class="text-sm" />
                  </summary>
                <ul
                  class="dropdown-content menu z-50 mt-2 w-64 rounded-box border border-white/10 bg-slate-800 p-2 shadow-xl"
                >
                  <li v-if="folderItems.length === 0" class="pointer-events-none opacity-60">
                    <span>폴더가 없습니다.</span>
                  </li>
                  <li v-for="folder in folderItems" :key="folder.id">
                    <button
                      type="button"
                      class="flex items-center justify-between text-white"
                      @click="onSelectFolder(folder.id)"
                    >
                      <span class="truncate">{{ folder.title }}</span>
                      <span class="badge badge-xs border-0 bg-white/10 text-slate-200">
                        {{ folder.images.length }}
                      </span>
                    </button>
                  </li>
                </ul>
              </details>
                <div class="flex min-w-0 flex-1 items-center justify-start px-3">
                  <span class="truncate text-xs font-semibold">
                    {{ selectedFolder?.title ?? '폴더를 선택하세요' }}
                  </span>
                </div>
                <button
                  type="button"
                  class="mr-2 flex h-6 min-w-10 items-center justify-center rounded-full px-2 text-xs font-bold"
                  :class="
                    selectedFolderImages.length > 0
                      ? 'bg-rose-500 text-white'
                    : 'bg-white/10 text-slate-300'
                "
                :disabled="selectedFolderId === null"
                @click="modalCaptureImagesRef?.onOpen()"
              >
                + {{ selectedFolderImages.length }}
              </button>
            </div>
              <button
                type="button"
                class="btn btn-sm shrink-0 border border-blue-900 bg-white px-3 text-xs text-blue-900 shadow-none hover:bg-blue-900 hover:text-white"
                :disabled="selectedFolderId === null"
                @click="goSelect"
              >
                문서 생성 시작하기
                <i-lucide-arrow-right class="text-sm" />
              </button>
          </div>
        </div>

        <div class="relative flex-1">
          <webview
            ref="webviewRef"
            :src="currentUrl"
            class="absolute inset-0 h-full w-full bg-white"
          ></webview>
          <div
            class="pointer-events-none absolute inset-0 bg-white transition-opacity duration-150"
            :class="isCaptureFlashVisible ? 'opacity-80' : 'opacity-0'"
          ></div>
          <label
            for="drawerRight"
            class="absolute top-1/2 z-40 flex h-16 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-xl bg-slate-900 text-slate-200 shadow-md transition-all duration-200 hover:bg-slate-800"
            :class="isDrawerOpen ? 'right-80' : 'right-0'"
          >
            <i-lucide-chevron-right v-if="isDrawerOpen" class="text-sm" />
            <i-lucide-chevron-left v-else class="text-sm" />
          </label>
        </div>

        <ModalCaptureImages
          ref="modalCaptureImagesRef"
          :captureImageItems="selectedFolderImages"
          :title="selectedFolder?.title ?? '선택된 폴더'"
          @onRemoveImage="onRemoveCaptureImage"
        />
      </div>
    </div>

    <div class="drawer-side pointer-events-none z-30 top-16 h-[calc(100vh-4rem)]">
      <div class="pointer-events-auto h-full">
        <PanelCaptureGroup
          :folderItems="folderItems"
          :selectedFolderId="selectedFolderId"
          @onCreateFolder="onCreateFolder"
          @onOpenCaptureModal="modalCaptureImagesRef?.onOpen()"
          @onRenameFolder="onRenameFolder"
          @onRemoveFolder="onRemoveFolder"
          @onSelectFolder="onSelectFolder"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { toFileImageSrc } from '@/utils/manualWorkspace'

interface WebviewElement extends HTMLElement {
  src: string
  goBack: () => void
  goForward: () => void
  reload: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  capturePage: () => Promise<{ toDataURL: () => string }>
  addEventListener: (event: string, listener: (e: unknown) => void) => void
}

interface CaptureFolder {
  id: string
  title: string
  description: string
  path: string
  images: import('@/types').CaptureImage[]
}

interface ProjectRecord {
  id: string
  name: string
  description: string
  progress: number
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
}

interface WorkspaceFolderResponse {
  id: string
  title: string
  description: string
  path: string
  area_type: 'capture' | 'document'
  sort_order: number
  screenshots: SavedCaptureRecord[]
}

interface SavedCaptureRecord {
  id: string
  folder_id: string
  file_name: string
  image_path: string
  image_src?: string
  source_url: string
  page_title: string
  sort_order: number
  is_selected: number
  created_at: string
}

const START_PAGE_URL = 'https://www.google.com'
const CAPTURE_SHORTCUT_KEY = 'CommandOrControl+Shift+S'

const webviewRef = ref<WebviewElement | null>(null)
const modalCaptureImagesRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)
const router = useRouter()
const route = useRoute()

const urlInput = ref(START_PAGE_URL)
const currentUrl = ref(START_PAGE_URL)
const isLoading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)
const isDrawerOpen = ref(false)
const isFolderDropdownOpen = ref(false)
const isCaptureFlashVisible = ref(false)
let captureFlashTimeout: ReturnType<typeof setTimeout> | null = null

const projectId = computed(() => String(route.query.projectId ?? ''))
const captureFolderId = computed(() => String(route.query.captureFolderId ?? ''))
const currentProject = ref<ProjectRecord | null>(null)
const folderItems = ref<CaptureFolder[]>([])
const selectedFolderId = ref<string | null>(String(route.query.captureFolderId ?? '') || null)

const selectedFolder = computed(() =>
  folderItems.value.find((item) => item.id === selectedFolderId.value) ?? null
)
const selectedFolderImages = computed(() => selectedFolder.value?.images ?? [])

const ensureSelectedFolder = (): void => {
  if (selectedFolderId.value && folderItems.value.some((item) => item.id === selectedFolderId.value)) {
    return
  }

  selectedFolderId.value = folderItems.value[0]?.id ?? null
}

const loadProjectFromDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  currentProject.value = (await window.api.invoke('project:get', {
    projectId: projectId.value
  })) as ProjectRecord | null
}

const loadWorkspaceFromDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  const response = (await window.api.invoke('workspace:get', {
    projectId: projectId.value
  })) as {
    folders: WorkspaceFolderResponse[]
  }

  folderItems.value = (response.folders ?? [])
    .filter((folder) => folder.area_type === 'capture')
    .map((folder) => ({
    id: folder.id,
    title: folder.title,
    description: folder.description,
    path: folder.path,
    images: folder.screenshots.map((row) => ({
      id: row.id,
      src: row.image_src ?? toFileImageSrc(row.image_path),
      filePath: row.image_path
    }))
  }))

  ensureSelectedFolder()
}

const syncFoldersToDatabase = async (): Promise<void> => {
  if (!projectId.value) return

  await window.api.invoke('capture:syncFolders', {
    projectId: projectId.value,
    projectName: currentProject.value?.name ?? projectId.value,
    projectDescription: currentProject.value?.description ?? '',
    sourceUrl: currentUrl.value,
    areaScope: 'capture',
    folders: folderItems.value.map((item, index) => ({
      id: item.id,
      title: item.title,
      areaType: 'capture',
      description: item.description,
      path: item.path,
      sortOrder: index
    }))
  })
}

const navigate = (): void => {
  let url = urlInput.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
    urlInput.value = url
  }
  currentUrl.value = url
}

const goBack = (): void => {
  webviewRef.value?.goBack()
}

const goForward = (): void => {
  webviewRef.value?.goForward()
}

const reload = (): void => {
  webviewRef.value?.reload()
}

const goHome = async (): Promise<void> => {
    await router.push({ name: 'home' })
  }

const goSelect = async (): Promise<void> => {
  await router.push({
    name: 'workspace-index',
    query: {
      projectId: projectId.value,
      captureFolderId: selectedFolderId.value 
    }
  })
}
  
  const onCaptureWebview = async (): Promise<void> => {
  const webview = webviewRef.value
  const activeFolderId = selectedFolderId.value
  if (!webview || activeFolderId === null) return

  if (captureFlashTimeout) {
    clearTimeout(captureFlashTimeout)
  }
  isCaptureFlashVisible.value = true
  captureFlashTimeout = setTimeout(() => {
    isCaptureFlashVisible.value = false
    captureFlashTimeout = null
  }, 140)

  const image = await webview.capturePage()
  const dataUrl = image.toDataURL()
  const activeFolder = folderItems.value.find((item) => item.id === activeFolderId)
  if (!activeFolder) return

  const result = (await window.api.invoke('capture:save', {
    projectId: projectId.value,
    projectName: currentProject.value?.name ?? projectId.value,
    projectDescription: currentProject.value?.description ?? '',
    folderId: activeFolder.id,
    folderTitle: activeFolder.title,
    sourceUrl: currentUrl.value,
    pageTitle: currentUrl.value,
    menuPath: activeFolder.path,
    screenDescription: activeFolder.description,
    functionalityDescription: '',
    writerName: '',
    dataUrl
  })) as {
    success: boolean
    capture?: {
      id: string
      filePath: string
      imageSrc: string
    }
  }

  const capture = result.capture
  if (!result.success || !capture) return

  folderItems.value = folderItems.value.map((item) =>
    item.id === activeFolderId
      ? {
          ...item,
          images: [
            ...item.images,
            {
              id: capture.id,
              src: capture.imageSrc,
              filePath: capture.filePath
            }
          ]
        }
      : item
  )
}

const onRemoveCaptureImage = async (id: string): Promise<void> => {
  const activeFolderId = selectedFolderId.value
  if (activeFolderId === null) return

  const targetImage = folderItems.value
    .find((item) => item.id === activeFolderId)
    ?.images.find((image) => image.id === id)

  if (targetImage?.filePath) {
    await window.api.invoke('capture:remove', {
      captureId: id,
      filePath: targetImage.filePath
    })
  }

  folderItems.value = folderItems.value.map((item) =>
    item.id === activeFolderId
      ? {
          ...item,
          images: item.images.filter((image) => image.id !== id)
        }
      : item
  )
}

const onCreateFolder = (): void => {
  const nextIndex = folderItems.value.length + 1
  const newFolder: CaptureFolder = {
    id: `folder-${Date.now()}`,
    title: `새 폴더 ${nextIndex}`,
    path: '',
    description: '',
    images: []
  }

  folderItems.value = [...folderItems.value, newFolder]
  selectedFolderId.value = newFolder.id
  void syncFoldersToDatabase()
}

const onRenameFolder = (payload: { id: string; title: string }): void => {
  folderItems.value = folderItems.value.map((item) =>
    item.id === payload.id
      ? {
          ...item,
          title: payload.title
        }
      : item
  )
  void syncFoldersToDatabase()
}

const onRemoveFolder = (id: string): void => {
  folderItems.value = folderItems.value.filter((item) => item.id !== id)

  if (selectedFolderId.value === id) {
    selectedFolderId.value = folderItems.value[0]?.id ?? null
  }

  void syncFoldersToDatabase()
}

const onSelectFolder = (id: string): void => {
  selectedFolderId.value = id
  isFolderDropdownOpen.value = false
}

const restoreLastUrl = async (): Promise<void> => {
  const folderId = captureFolderId.value || ''
  if (!folderId) return

  const result = (await window.api.invoke('capture:getLastUrl', {
    folderId
  })) as { url: string }

  if (!result?.url) return

  currentUrl.value = result.url
  urlInput.value = result.url
  // selectedFolderId.value = folderId
}

let webviewCaptureListener: (() => void) | null = null

onMounted(async () => {
  const webview = webviewRef.value
  if (!webview) return


  webview.addEventListener('did-start-loading', () => {
    isLoading.value = true
  })

  webview.addEventListener('did-stop-loading', () => {
    isLoading.value = false
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  })

  webview.addEventListener('did-navigate', (e: unknown) => {
    urlInput.value = (e as { url: string }).url
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  })

  webview.addEventListener('did-navigate-in-page', (e: unknown) => {
    urlInput.value = (e as { url: string }).url
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  })

  window.api.invoke('shortcut:register', CAPTURE_SHORTCUT_KEY, 'shortcut:captureWebview')
  webviewCaptureListener = window.api.on('shortcut:captureWebview', onCaptureWebview)
  await loadProjectFromDatabase()
  await loadWorkspaceFromDatabase()
  await restoreLastUrl()
  await syncFoldersToDatabase()
})

onUnmounted(() => {
  if (captureFlashTimeout) {
    clearTimeout(captureFlashTimeout)
    captureFlashTimeout = null
  }
  webviewCaptureListener?.()
  webviewCaptureListener = null
  window.api.invoke('shortcut:unregister', CAPTURE_SHORTCUT_KEY)
})
</script>
