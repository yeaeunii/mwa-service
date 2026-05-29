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
          v-if="webviewSrc"
          ref="webviewRef"
          :src="webviewSrc"
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
      <div class="mb-4 flex items-center gap-2">
        <div class="flex min-w-0 items-center gap-1.5">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100">
            <i-lucide-folder-kanban class="h-4 w-4 text-violet-600" />
          </div>
          <div class="min-w-0">
            <div class="truncate text-xs font-black text-slate-950">프로젝트</div>
            <div class="truncate text-[11px] font-semibold text-slate-400">
              {{ workspaceInfo?.project_name}}
            </div>
          </div>
        </div>
        <i-lucide-chevron-right class="h-4 w-4 shrink-0 text-slate-300" />
        <div class="flex min-w-0 items-center gap-1.5">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100">
            <i-lucide-briefcase class="h-4 w-4 text-violet-600" />
          </div>
          <div class="min-w-0">
            <div class="truncate text-xs font-black text-slate-950">워크스페이스</div>
            <div class="truncate text-[11px] font-semibold text-slate-400">
              {{ workspaceInfo?.name}}
            </div>
          </div>
        </div>
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
                  <button
                    type="button"
                    class="btn btn-sm btn-circle"
                    @click="onDeleteCapture(image)"
                  >
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
}

interface WebviewNavigationEvent {
  url?: string
  isMainFrame?: boolean
}

const START_PAGE_URL = 'https://www.google.com'

const webviewRef = ref<WebviewElement | null>(null)
const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId ?? ''))

// 화면 상태
const workspaceInfo = ref<WorkspaceDetail | null>(null)
const urlInput = ref('')
const webviewSrc = ref('')
const currentUrl = ref('')
const isLoading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)
const isCaptureFlashVisible = ref(false)

// 캡쳐 목록/모달 상태
const captureImages = ref<CaptureImage[]>([])
const editingCaptureId = ref<number | null>(null)
const deletingCapture = ref<CaptureImage | null>(null)

let captureFlashTimeout: ReturnType<typeof setTimeout> | null = null
let webviewCaptureListener: (() => void) | null = null

// 워크스페이스 정보와 최초 접속 URL 불러옴
const loadWorkspaceInfo = async (): Promise<void> => {
  if (!workspaceId.value) return

  workspaceInfo.value = await getWorkspaceDetail(workspaceId.value)

  const initialUrl = workspaceInfo.value?.latest_src_url || START_PAGE_URL
  // const latestUrl = workspaceInfo.value?.latest_src_url ?? ''
  // const initialUrl = /^https?:\/\//i.test(latestUrl) ? latestUrl : START_PAGE_URL
  urlInput.value = initialUrl
  currentUrl.value = initialUrl
  webviewSrc.value = initialUrl
}

// 주소 입력창에서 이동할 때만 webview src 변경
const navigate = (): void => {
  let url = urlInput.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
    urlInput.value = url
  }
  currentUrl.value = url
  webviewSrc.value = url
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

// 현재 webview 화면을 이미지 data URL로 캡쳐
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

// webview 로딩 상태와 현재 URL 표시만 동기화
const initWebview = (): void => {
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

  const syncCurrentUrl = (e: Event): void => {
    const event = e as WebviewNavigationEvent
    if (event.isMainFrame === false || !event.url) return

    urlInput.value = event.url
    currentUrl.value = event.url
    canGoBack.value = webview.canGoBack()
    canGoForward.value = webview.canGoForward()
  }

  webview.addEventListener('did-navigate', syncCurrentUrl)
  webview.addEventListener('did-navigate-in-page', syncCurrentUrl)
}

// 단축키 입력 시 캡쳐 이름 입력 모달 열기
const onCaptureWebview = async (): Promise<void> => {
  const webview = webviewRef.value
  if (!webview) return
  editingCaptureId.value = null
  modalCaptureNameRef.value?.onOpen()
}

// 로컬 저장 이미지 경로를 appimg URL로 변환
const toFileSrc = (imgPath: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  return `appimg:///${normalizedPath}`
}

// 저장된 캡쳐 이미지 목록 조회
const loadCaptureList = async (): Promise<void> => {
  if (!workspaceId.value) return

  const list = await getCaptureList({
    workspaceId: Number(workspaceId.value),
    sourceType: 'web'
  })

  captureImages.value = list.map((item) => ({
    id: item.id,
    name: item.name,
    src: item.img_path ? toFileSrc(item.img_path) : '',
    imgPath: item.img_path ?? undefined
  }))
}

// 캡쳐 이미지 이름 수정 모달 열기
const onEditCapture = (image: CaptureImage): void => {
  editingCaptureId.value = image.id
  modalCaptureNameRef.value?.onOpen({
    initialName: image.name,
    title: '캡쳐 이미지명을 변경하세요',
    confirmText: '저장'
  })
}

// 캡쳐 이미지 삭제 확인 모달 열기
const onDeleteCapture = (image: CaptureImage): void => {
  deletingCapture.value = image
  modalConfirmRef.value?.onOpen()
}

// 캡쳐 이미지 DB row와 로컬 파일 삭제
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

// 캡쳐 이미지 이름 저장 또는 신규 캡쳐 저장 처리
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
    currentUrl: currentUrl.value,
    sourceType: 'web'
  })
  if (!saved) return

  captureImages.value.unshift({
    id: saved.id,
    name: nextName,
    src: imageDataURL,
    imgPath: saved.imgPath
  })
}

// 화면 진입 시 webview와 캡쳐 단축키 초기화
onMounted(async () => {
  await loadWorkspaceInfo()
  await nextTick()
  initWebview()
  await loadCaptureList()
  window.api.invoke(
    'shortcut:register',
    CAPTURE_SHORTCUTS.WEB_CAPTURE,
    SHORTCUT_CHANNELS.CAPTURE_WEBVIEW
  )
  webviewCaptureListener = window.api.on(SHORTCUT_CHANNELS.CAPTURE_WEBVIEW, onCaptureWebview)
})

// 화면 이탈 시 타이머와 단축키 리스너 정리
onUnmounted(() => {
  if (captureFlashTimeout) {
    clearTimeout(captureFlashTimeout)
    captureFlashTimeout = null
  }
  webviewCaptureListener?.()
  webviewCaptureListener = null
  window.api.invoke('shortcut:unregister', CAPTURE_SHORTCUTS.WEB_CAPTURE)
})
</script>
