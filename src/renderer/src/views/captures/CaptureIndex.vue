<template>
  <div class="drawer drawer-end">
    <input id="drawerRight" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
      <div class="flex flex-col h-[100vh]">
        <!-- URL Bar -->
        <div class="flex items-center gap-2 p-2 bg-base-100 border-b border-base-300">
          <div class="flex grow">
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
            <form class="flex-1 flex gap-2" @submit.prevent="navigate">
              <input
                v-model="urlInput"
                type="text"
                class="input input-sm input-bordered w-full font-mono text-sm"
                placeholder="https://example.com"
              />
            </form>
          </div>
          <div class="flex gap-2 md:w-1/2 lg:w-1/3">
            <button class="btn btn-sm btn-primary grow" @click="modalCaptureImagesRef?.onOpen()">
              <div class="flex gap-2 items-center w-full">
                <div class="flex grow text-left gap-2 items-center">
                  <i-lucide-chevron-down />
                  공지사항 메뉴얼
                </div>
                <div
                  class="badge badge-sm w-10"
                  :class="captureImageItems.length > 0 ? 'badge-secondary' : 'bg-gray-300'"
                >
                  + {{ captureImageItems.length }}
                </div>
              </div>
            </button>
            <label for="drawerRight" class="btn btn-sm">
              <i-lucide-menu />
            </label>
          </div>
        </div>

        <!-- Webview Container -->
        <div class="flex-1 relative">
          <webview
            ref="webviewRef"
            :src="currentUrl"
            class="absolute inset-0 w-full h-full bg-white"
          ></webview>
          <div
            class="pointer-events-none absolute inset-0 bg-white transition-opacity duration-150"
            :class="isCaptureFlashVisible ? 'opacity-80' : 'opacity-0'"
          ></div>
        </div>
        <ModalCaptureImages
          ref="modalCaptureImagesRef"
          :captureImageItems="captureImageItems"
          @onRemoveImage="onRemoveCaptureImage"
        />
      </div>
    </div>
    <div class="drawer-side">
      <label for="drawerRight" aria-label="close sidebar" class="drawer-overlay"></label>
      <PanelCaptureGroup />
    </div>
  </div>
</template>

<script setup lang="ts">
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

const START_PAGE_URL = 'https://www.google.com'

const webviewRef = ref<WebviewElement | null>(null)
const urlInput = ref(START_PAGE_URL)
const currentUrl = ref(START_PAGE_URL)
const isLoading = ref(false)
const canGoBack = ref(false)
const canGoForward = ref(false)

const CAPTURE_SHORTCUT_KEY = 'CommandOrControl+Shift+S'
const captureImageItems = ref<import('@/types').CaptureImage[]>([])
const modalCaptureImagesRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)
const isCaptureFlashVisible = ref(false)
let captureFlashTimeout: ReturnType<typeof setTimeout> | null = null

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

const onCaptureWebview = async (): Promise<void> => {
  const webview = webviewRef.value
  if (!webview) return

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
  captureImageItems.value.push({
    id: new Date().getTime().toString(),
    dataUrl: dataUrl
  })
}

const onRemoveCaptureImage = (id: string): void => {
  captureImageItems.value = captureImageItems.value.filter((item) => item.id !== id)
}

let webviewCaptureListener: (() => void) | null = null

onMounted(() => {
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

  //단축키 및 이벤트 수신자 등록
  window.api.invoke('shortcut:register', CAPTURE_SHORTCUT_KEY, 'shortcut:captureWebview')

  // 단축키 이벤트 수신자 및 캡처 이벤트 핸들러 등록
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
