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
          ref="webviewRef"
          :src="currentUrl"
          class="absolute inset-0 h-full w-full bg-white"
        ></webview>
        <div
          class="pointer-events-none absolute inset-0 bg-white transition-opacity duration-150"
          :class="isCaptureFlashVisible ? 'opacity-80' : 'opacity-0'"
        ></div>
      </div>
      <!-- Webview -->
    </div>
    <div class="w-100 bg-base-100 flex-shrink-0 p-3 flex flex-col">
      <div class="breadcrumbs mb-3">
        <ul>
          <li>
            <a>
              <i-lucide-layout-dashboard />
              Project명
            </a>
          </li>
          <li>
            <a>
              <i-lucide-folder />
              Workspace명
            </a>
          </li>
        </ul>
      </div>
      <div class="overflow-y-auto w-full p-3 bg-slate-50 rounded-md flex-1">
        <div class="grid grid-cols-2 gap-4">
          <div v-for="image in captureImages" :key="image.id" class="group">
            <div class="overflow-hidden border border-gray-300 rounded-md shadow-sm h-30 relative">
              <img :src="image.src" :alt="image.name" class="object-cover w-full h-full" />
              <div
                class="absolute bottom-0 left-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-circle">
                    <i-lucide-pencil />
                  </button>
                  <button class="btn btn-sm btn-circle">
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
    <ModalCaptureName ref="modalCaptureNameRef" @onConfirm="onCaptureWebviewConfirm" />
  </div>
</template>

<script setup lang="ts">
const modalCaptureNameRef = ref<ComponentRef<'ModalCaptureName'> | null>(null)

interface WebviewElement extends HTMLElement {
  src: string
  goBack: () => void
  goForward: () => void
  reload: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  capturePage: () => Promise<{ toDataURL: () => string }>
  executeJavaScript: (code: string) => Promise<unknown>
  addEventListener: (event: string, listener: (e: unknown) => void) => void
  openDevTools: () => void
}

const START_PAGE_URL = 'https://www.google.com'
const CAPTURE_SHORTCUT_KEY = 'CommandOrControl+Shift+S'

const webviewRef = ref<WebviewElement | null>(null)
const router = useRouter()

const urlInput = ref(START_PAGE_URL)
const currentUrl = ref(START_PAGE_URL)
const isLoading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)
const isCaptureFlashVisible = ref(false)
let captureFlashTimeout: ReturnType<typeof setTimeout> | null = null

const captureImages = ref<CaptureImage[]>([])

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
}

const onCaptureWebview = async (): Promise<void> => {
  const webview = webviewRef.value
  if (!webview) return
  modalCaptureNameRef.value?.onOpen()
}

const onCaptureWebviewConfirm = async (name: string): Promise<void> => {
  console.log('onCaptureWebviewConfirm')
  const imageDataURL = await getCaptureImageDataURL()
  if (!imageDataURL) return
  captureImages.value.push({
    id: captureImages.value.length + 1,
    name,
    src: imageDataURL
  })
}

onMounted(async () => {
  initWebview()
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
