<template>
  <div class="flex gap-1 bg-slate-200">
    <div class="flex h-[100vh] flex-col flex-1">
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 border-b border-base-content/10 bg-slate-200 shadow-md p-2"
      >
        <div class="flex grow items-center gap-2">
          <div class="flex gap-1">
            <div class="tooltip tooltip-bottom" data-tip="뒤로 가기">
              <button
                :disabled="!canGoBack"
                class="btn btn-sm btn-ghost border-none shadow-none rounded-full hover:text-neutral"
                @click="goBack"
              >
                <i-lucide-chevron-left class="text-lg" />
              </button>
            </div>
            <div class="tooltip tooltip-bottom" data-tip="앞으로 가기">
              <button
                :disabled="!canGoForward"
                class="btn btn-sm btn-ghost border-none shadow-none rounded-full hover:text-neutral"
                @click="goForward"
              >
                <i-lucide-chevron-right class="text-lg" />
              </button>
            </div>
            <div class="tooltip tooltip-bottom" data-tip="새로고침">
              <button class="btn btn-sm btn-ghost" :disabled="isLoading" @click="reload">
                <div v-if="isLoading" class="loading loading-spinner loading-sm"></div>
                <i-lucide-refresh-cw />
              </button>
            </div>
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
        <div class="tooltip tooltip-bottom" data-tip="나가기">
          <button type="button" class="btn btn-ghost" @click="router.back()">
            <i-lucide-square-arrow-right-exit class="text-lg" />
          </button>
        </div>
      </div>
      <!-- Toolbar -->

      <!-- Webview -->
      <div class="relative flex-1">
        <webview
          v-if="currentUrl"
          ref="webviewRef"
          :src="currentUrl"
          allowpopups
          class="absolute inset-0 h-full w-full bg-white"
        ></webview>
        <div
          class="pointer-events-none absolute inset-0 bg-white transition-opacity duration-150"
          :class="isCaptureFlashVisible ? 'opacity-80' : 'opacity-0'"
        ></div>
      </div>
      <!-- Webview -->
    </div>
    <div class="w-100 h-[100vh] bg-base-100 flex-shrink-0 p-3 flex flex-col overflow-hidden">
      <div class="breadcrumbs mb-3">
        <ul>
          <li>
            <a>
              <i-lucide-layout-dashboard />
              {{ workspaceInfo?.project_name || 'Project명' }}
            </a>
          </li>
          <li>
            <a>
              <i-lucide-folder />
              {{ workspaceInfo?.name || 'Workspace명'  }}
            </a>
          </li>
        </ul>
      </div>
      <div class="overflow-y-auto w-full p-3 bg-slate-50 rounded-md flex-1">
            <!-- 캡쳐 이미지 목록 -->
        <div class="grid grid-cols-2 gap-4">
          <div v-for="image in captureImages" :key="image.id" class="group">
            <div class="overflow-hidden border border-gray-300 rounded-md shadow-sm h-30 relative">
              <img :src="image.src" :alt="image.name" class="object-cover w-full h-full" />
              <div
                class="absolute bottom-0 left-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                <div class="flex gap-2">
                  <button type="button" class="btn btn-sm btn-circle" @click="onEditCapture(image)">
                    <i-lucide-pencil />
                  </button>
                  <button type="button" class="btn btn-sm btn-circle" @click="onDeleteCapture(image)">
                    <i-lucide-trash />
                  </button>
                </div>
              </div>
            </div>
            <div class="text-sm text-center mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
              {{ image.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <ModalCaptureName ref="modalCaptureNameRef" @onConfirm="onCaptureNameConfirm" />
    <ModalConfirm ref="modalConfirmRef" @on-confirm="onConfirmDeleteCapture">
      <template #message>
        <div class="text-center">
          <h3 class="text-lg font-bold mb-2">{{ deletingCapture?.name }}</h3>
          <p class="text-sm text-gray-500">캡쳐 이미지를 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>
  </div>
</template>

<script setup lang="ts">
import {
  createCaptureWithImage,
  deleteCapture,
  getCaptureList,
  getWorkspaceDetail,
  updateCaptureName,
  type WorkspaceDetail
} from '@/database'

const modalCaptureNameRef = ref<ComponentRef<'ModalCaptureName'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)

interface WebviewElement extends HTMLElement {
  src: string
  goBack: () => void
  goForward: () => void
  reload: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  capturePage: () => Promise<{ toDataURL: () => string }>
  executeJavaScript: (code: string) => Promise<unknown>
  addEventListener: (event: string, listener: (e: WebviewNavigationEvent) => void) => void

  openDevTools: () => void
}

interface WebviewNavigationEvent {
  url?: string
  isMainFrame?: boolean
}

const START_PAGE_URL = 'https://www.google.com'
const CAPTURE_SHORTCUT_KEY = 'CommandOrControl+Shift+S'

const webviewRef = ref<WebviewElement | null>(null)
const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId ?? ''))
const workspaceInfo = ref<WorkspaceDetail | null>(null)

const loadWorkspaceInfo = async (): Promise<void> => {
  if (!workspaceId.value) return

  workspaceInfo.value = await getWorkspaceDetail(workspaceId.value)

  const initialUrl = workspaceInfo.value?.latest_src_url || START_PAGE_URL
  urlInput.value = initialUrl
  currentUrl.value = initialUrl
}



const urlInput = ref('')
const currentUrl = ref('')
const isLoading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)
const isCaptureFlashVisible = ref(false)
let captureFlashTimeout: ReturnType<typeof setTimeout> | null = null

const captureImages = ref<CaptureImage[]>([])
const editingCaptureId = ref<number | null>(null)
const deletingCapture = ref<CaptureImage | null>(null)


const navigate = (): void => {
  let url = urlInput.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
    urlInput.value = url
  }
  currentUrl.value = url
}

const navigateWebviewTo = (url: string): void => {
  urlInput.value = url
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

const getCaptureImageDataURL = async (): Promise<string | null> => {
  if (captureFlashTimeout) {
    clearTimeout(captureFlashTimeout)
  }
  isCaptureFlashVisible.value = true
  captureFlashTimeout = setTimeout(() => {
    isCaptureFlashVisible.value = false
    captureFlashTimeout = null
  }, 140)

  const image = await webviewRef.value?.capturePage()
  return image?.toDataURL() ?? null
}

let webviewCaptureListener: (() => void) | null = null

const initWebview = (): void => {
  const webview = webviewRef.value
  if (!webview) return

  webview.addEventListener('dom-ready', async () => {
    // webview.openDevTools()
    // const script = `
    // (function() {
    //   let theme= window.matchMedia('(prefers-color-scheme: dark)').matches;
    //   console.log('theme', theme);
    // })()
    // `
    // const result = await webview.executeJavaScript(script)
    // console.log('result', result)
  })

  webview.addEventListener('did-start-loading', () => {
    isLoading.value = true
  })

  webview.addEventListener('did-stop-loading', () => {
    isLoading.value = false
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  })

  const syncCurrentUrl = (e: WebviewNavigationEvent): void => {
    if (e.isMainFrame === false || !e.url) return

    navigateWebviewTo(e.url)
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  }

  webview.addEventListener('did-navigate', syncCurrentUrl)

  webview.addEventListener('did-navigate-in-page', syncCurrentUrl)
}

const onCaptureWebview = async (): Promise<void> => {
  const webview = webviewRef.value
  if (!webview) return
  editingCaptureId.value = null
  modalCaptureNameRef.value?.onOpen()
}

const toFileSrc = (imgPath: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  return `appimg:///${normalizedPath}`
}

//켑쳐 이미지 조회
const loadCaptureList = async (): Promise<void> => {
  if (!workspaceId.value) return

  const list = await getCaptureList({
    workspaceId: Number(workspaceId.value)
  })

  captureImages.value = list.map((item) => ({
    id: item.id,
    name: item.name,
    src: item.img_path ? toFileSrc(item.img_path) : '',
    imgPath: item.img_path ?? undefined
  }))
}


const onEditCapture = (image: CaptureImage): void => {
  editingCaptureId.value = image.id
  modalCaptureNameRef.value?.onOpen({
    initialName: image.name,
    title: '캡쳐 이미지명을 변경하세요',
    confirmText: '저장'
  })
}

const onDeleteCapture = (image: CaptureImage): void => {
  deletingCapture.value = image
  modalConfirmRef.value?.onOpen()
}

const onConfirmDeleteCapture = async (): Promise<void> => {
  const target = deletingCapture.value
  if (!target) return

  await deleteCapture({
    id: target.id,
    imgPath: target.imgPath ?? null
  })

  captureImages.value = captureImages.value.filter((item) => item.id !== target.id)
  deletingCapture.value = null
}

// 캡쳐 이미지 저장/수정
const onCaptureNameConfirm = async (name: string): Promise<void> => {
  const nextName = name.trim()
  if (!nextName) return

  if (editingCaptureId.value !== null) {
    const captureId = editingCaptureId.value
    await updateCaptureName({
      id: captureId,
      name: nextName
    })

    captureImages.value = captureImages.value.map((item) =>
      item.id === captureId ? { ...item, name: nextName } : item
    )
    editingCaptureId.value = null
    return
  }

  const imageDataURL = await getCaptureImageDataURL()
  if (!imageDataURL) return

  const saved = await createCaptureWithImage({
    workspaceId: String(workspaceId.value),
    name: nextName,
    dataUrl: imageDataURL,
    currentUrl: currentUrl.value
  })
  if (!saved) return


  captureImages.value.unshift({
    id: saved.id,
    name: nextName,
    src: imageDataURL,
    imgPath: saved.imgPath
  })
  
}

onMounted(async () => {
  // console.log('workspaceId:', workspaceId.value)
  await loadWorkspaceInfo()
  await nextTick()
  initWebview()
  await loadCaptureList()
  window.api.invoke('shortcut:register', CAPTURE_SHORTCUT_KEY, 'shortcut:captureWebview')
  webviewCaptureListener = window.api.on('shortcut:captureWebview', onCaptureWebview)
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
