<template>
  <div class="flex h-screen gap-3 overflow-hidden bg-slate-100 p-3 text-slate-950">
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white shadow-sm">
      <header
        class="flex h-13 items-center justify-between border-b border-slate-300 bg-slate-200 px-3"
      >
        <span class="min-w-0 truncate text-sm font-semibold text-slate-700">
          {{ videoName }}
        </span>
        <div class="flex items-center gap-1">
          <button
            v-if="videoSrc"
            type="button"
            class="btn h-8 btn-neutral gap-2"
            @click="openVideoPicker"
          >
            <i-lucide-folder-open class="text-sm" />
            동영상 변경
          </button>
          <div class="tooltip tooltip-bottom" data-tip="나가기">
            <button type="button" class="btn btn-ghost" @click="goBack">
              <i-lucide-square-arrow-right-exit class="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <section class="flex min-h-0 flex-1 flex-col bg-slate-50 p-2">
        <div
          class="relative min-h-0 flex-1 overflow-hidden rounded-md"
          :class="videoSrc ? 'bg-black' : 'border-2 border-dashed border-indigo-400 bg-indigo-50'"
        >
          <video
            v-if="videoSrc"
            ref="videoRef"
            :src="videoSrc"
            class="h-full w-full object-contain"
            preload="metadata"
            @error="onVideoError"
            @loadedmetadata="onVideoLoaded"
            @pause="isPlaying = false"
            @play="isPlaying = true"
            @timeupdate="syncVideoTime"
          />
          <video
            v-if="videoSrc"
            ref="previewVideoRef"
            :src="videoSrc"
            class="hidden"
            muted
            preload="metadata"
          />
          <canvas ref="previewCanvasRef" class="hidden" />
          <div
            v-if="isCaptureFlashing"
            class="pointer-events-none absolute inset-0 z-20 bg-white/80"
          />
          <div
            v-if="videoError"
            class="absolute bottom-4 left-4 right-4 rounded-md border border-error/30 bg-error/90 px-3 py-2 text-xs font-semibold text-error-content shadow"
          >
            {{ videoError }}
          </div>
          <div
            v-if="isPreparing"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm font-semibold text-white"
          >
            <span class="loading loading-spinner loading-md"></span>
            <span>동영상 미리보기를 준비하고 있습니다</span>
          </div>
          <div
            v-if="!videoSrc && !isPreparing"
            class="flex h-full flex-col items-center justify-center gap-5 text-center"
            @click="openVideoPicker"
            @dragover.prevent
            @drop.prevent="onDropVideo"
          >
            <i-lucide-upload class="h-12 w-12 text-indigo-500" />
            <div>
              <div class="text-2xl font-black text-slate-900">동영상을 여기에 놓아주세요</div>
              <div class="mt-4 text-lg font-medium text-slate-500">
                또는 클릭해서 파일을 선택하세요
              </div>
            </div>
          </div>
        </div>

        <div class="relative h-60 border-t border-slate-200 bg-white px-5 py-4">
          <div class="absolute left-5 top-12">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center text-[#18375f] disabled:text-slate-300"
              :disabled="!videoSrc"
              @click="togglePlayback"
            >
              <i-lucide-pause v-if="isPlaying" class="h-8 w-8 fill-current" />
              <i-lucide-play v-else class="h-10 w-10 fill-current" />
            </button>
          </div>

          <div class="absolute left-20 right-10 top-10">
            <div
              ref="timelineRef"
              class="relative mb-3"
              @pointermove="onTimelinePreviewMove"
              @pointerleave="hideTimelinePreview"
            >
              <div
                v-if="isTimelinePreviewVisible"
                class="pointer-events-none absolute -top-36 z-20 w-60 -translate-x-1/2 rounded-lg border border-white/20 bg-black p-1 shadow-xl"
                :style="{ left: `${timelinePreviewLeft}px` }"
              >
                <div class="aspect-video overflow-hidden rounded-md bg-slate-900">
                  <img
                    v-if="timelinePreviewSrc"
                    :src="timelinePreviewSrc"
                    alt="timeline preview"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="flex h-full items-center justify-center text-xs text-white/50">
                    미리보기 준비 중
                  </div>
                </div>
                <div class="px-1 py-1 text-center text-xs font-black text-white">
                  {{ formatTime(timelinePreviewTime) }}
                </div>
              </div>
              <div
                class="pointer-events-none absolute -top-7 rounded-md bg-neutral px-3 py-1 text-sm font-black text-white"
                :style="{ left: markerLeft }"
              >
                {{ formatTime(curTime) }}
              </div>
              <input
                v-model.number="seekTime"
                type="range"
                class="range range-xs w-full"
                min="0"
                :max="duration || 0"
                step="0.01"
                :disabled="!videoSrc"
                @input="seekPreview"
              />
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-bold text-info">{{ formatTime(curTime) }}</span>
              <span class="text-slate-400">/</span>
              <span class="font-normal text-slate-700">{{ formatTime(duration) }}</span>
            </div>
          </div>

          <div class="absolute left-1/2 top-22 z-10 -translate-x-1/2">
            <button
              type="button"
              class="btn h-28 w-28 rounded-full border border-info/20 bg-info/30 text-info shadow-md hover:bg-info/40 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100"
              :disabled="!videoSrc"
              @click="captureCurrentScene"
            >
              <div class="flex flex-col items-center gap-2">
                <i-lucide-camera class="h-9 w-9" />
                <span class="text-xs font-black">CAPTURE</span>
              </div>
            </button>
          </div>
        </div>
      </section>
    </main>

    <aside class="flex h-full w-100 shrink-0 flex-col overflow-hidden rounded-md bg-slate-50 p-3">
      <div class="mb-4 flex items-center gap-2">
        <div class="flex min-w-0 items-center gap-1.5">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100">
            <i-lucide-folder-kanban class="h-4 w-4 text-violet-600" />
          </div>
          <div class="min-w-0">
            <div class="truncate text-xs font-black text-slate-950">프로젝트</div>
            <div class="truncate text-[11px] font-semibold text-slate-400">
              {{ workspaceInfo?.project_name }}
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
              {{ workspaceInfo?.name }}
            </div>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto rounded-md bg-slate-100 p-3">
        <div class="grid grid-cols-2 gap-4">
          <div v-for="image in captureImages" :key="image.id" class="group">
            <div class="relative h-30 overflow-hidden rounded-md border border-gray-300 shadow-sm">
              <img :src="image.src" :alt="image.name" class="h-full w-full object-cover" />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <div class="flex gap-2">
                  <button type="button" class="btn btn-sm btn-circle" @click="onEditCapture(image)">
                    <i-lucide-pencil class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-circle"
                    @click="onDeleteCapture(image)"
                  >
                    <i-lucide-trash class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div class="mt-2 truncate text-center text-sm">
              {{ image.name }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <ModalCaptureName ref="modalCaptureNameRef" @on-confirm="onCaptureNameConfirm" />
    <ModalConfirm ref="modalConfirmRef" @on-confirm="onConfirmDeleteCapture">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ deletingCapture?.name }}</h3>
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
  updateWorkspaceVideo,
  type WorkspaceDetail
} from '@/database'
import type { CaptureImage } from '@/types'

// 라우트/컴포넌트 참조
const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId ?? ''))
const videoRef = ref<HTMLVideoElement | null>(null)
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const previewCanvasRef = ref<HTMLCanvasElement | null>(null)
const timelineRef = ref<HTMLDivElement | null>(null)
const modalCaptureNameRef = ref<ComponentRef<'ModalCaptureName'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
let videoCaptureListener: (() => void) | null = null
let captureFlashTimer: ReturnType<typeof setTimeout> | null = null
let timelinePreviewTimer: ReturnType<typeof setTimeout> | null = null
let timelinePreviewToken = 0

// 화면 상태
const workspaceInfo = ref<WorkspaceDetail | null>(null)
const captureImages = ref<CaptureImage[]>([])
const deletingCapture = ref<CaptureImage | null>(null)
const editingCaptureId = ref<number | null>(null)
const videoSrc = ref('')
const videoPath = ref('')
const videoName = ref('')
const videoError = ref('')
const isPreparing = ref(false)
const isPlaying = ref(false)
const curTime = ref(0)
const seekTime = ref(0)
const duration = ref(0)
const isCaptureFlashing = ref(false)
const isTimelinePreviewVisible = ref(false)
const timelinePreviewSrc = ref('')
const timelinePreviewTime = ref(0)
const timelinePreviewLeft = ref(0)

const markerLeft = computed(() => {
  if (!duration.value) return '0%'

  const ratio = Math.min(Math.max(curTime.value / duration.value, 0), 1)
  return `calc(${ratio * 100}% - 2.5rem)`
})

const getTimelineTimeByPointer = (
  event: PointerEvent
): { time: number; left: number; renderLeft: number } | null => {
  const timeline = timelineRef.value
  if (!timeline || !duration.value) return null

  const rect = timeline.getBoundingClientRect()
  if (rect.width <= 0) return null

  const left = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
  const ratio = left / rect.width
  const time = Math.min(Math.max(duration.value * ratio, 0), duration.value)
  const renderLeft = Math.min(Math.max(left, 120), Math.max(rect.width - 120, 120))

  return { time, left, renderLeft }
}

const drawTimelinePreviewFrame = (): void => {
  const video = previewVideoRef.value
  const canvas = previewCanvasRef.value
  if (!video || !canvas || !isTimelinePreviewVisible.value) return
  if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) return

  const width = 240
  const height = Math.max(1, Math.round(width * (video.videoHeight / video.videoWidth)))
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return

  try {
    context.drawImage(video, 0, 0, width, height)
    timelinePreviewSrc.value = canvas.toDataURL('image/jpeg', 0.72)
  } catch (error) {
    console.error('Failed to render timeline preview:', error)
  }
}

const requestTimelinePreviewFrame = (time: number): void => {
  const video = previewVideoRef.value
  if (!video) return

  const token = (timelinePreviewToken += 1)
  const clampedTime = Math.min(Math.max(time, 0), duration.value || time)

  const drawWhenReady = (): void => {
    if (token !== timelinePreviewToken) return
    drawTimelinePreviewFrame()
  }

  if (video.readyState >= 2 && Math.abs(video.currentTime - clampedTime) < 0.05) {
    drawWhenReady()
    return
  }

  video.addEventListener('seeked', drawWhenReady, { once: true })
  video.currentTime = clampedTime
}

const onTimelinePreviewMove = (event: PointerEvent): void => {
  if (!videoSrc.value) return

  const preview = getTimelineTimeByPointer(event)
  if (!preview) return

  isTimelinePreviewVisible.value = true
  timelinePreviewTime.value = preview.time
  timelinePreviewLeft.value = preview.renderLeft

  if (timelinePreviewTimer) return

  timelinePreviewTimer = setTimeout(() => {
    timelinePreviewTimer = null
    requestTimelinePreviewFrame(timelinePreviewTime.value)
  }, 100)
}

const hideTimelinePreview = (): void => {
  isTimelinePreviewVisible.value = false
  if (timelinePreviewTimer) {
    clearTimeout(timelinePreviewTimer)
    timelinePreviewTimer = null
  }
}

// 워크스페이스 정보를 불러옴
const loadWorkspaceInfo = async (): Promise<void> => {
  if (!workspaceId.value) return

  workspaceInfo.value = await getWorkspaceDetail(workspaceId.value)
  const storedVideoPath = workspaceInfo.value?.video_path ?? ''
  if (!storedVideoPath) return

  videoPath.value = storedVideoPath
  videoSrc.value = toAppImageUrl(storedVideoPath)
  videoName.value = workspaceInfo.value?.video_origin_name || getFileName(storedVideoPath)
}

// 동영상 캡쳐 목록을 불러옴
const loadCaptureList = async (): Promise<void> => {
  if (!workspaceId.value) return

  const list = await getCaptureList({
    workspaceId: Number(workspaceId.value),
    sourceType: 'video'
  })

  captureImages.value = list.map((item) => ({
    id: item.id,
    name: item.name,
    src: item.img_path ? toAppImageUrl(item.img_path) : '',
    imgPath: item.img_path ?? undefined
  }))
}

// 워크스페이스 상세 화면으로 돌아감
const goBack = (): void => {
  if (!workspaceId.value) return
  void router.push({ name: 'workspace-detail', params: { id: workspaceId.value } })
}

interface OpenFileResult {
  canceled: boolean
  filePaths: string[]
}

// 로컬 동영상 파일을 선택함
const openVideoPicker = async (): Promise<void> => {
  const result = (await window.api.invoke('dialog:openFile', {
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'wmv', 'm4v'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })) as OpenFileResult

  if (result.canceled || !result.filePaths[0]) return
  await loadVideoFile(result.filePaths[0])
}

// 로컬 동영상 파일 drag&drop
const onDropVideo = async (event: DragEvent): Promise<void> => {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  const filePath = window.api.getPathForFile(file)
  if (!filePath) return

  await loadVideoFile(filePath)
}

// ffmpeg로 미리보기용 mp4를 생성하고 화면에 연결함
const loadVideoFile = async (filePath: string): Promise<void> => {
  videoPath.value = filePath
  videoName.value = getFileName(filePath)
  videoError.value = ''
  isPreparing.value = true
  videoSrc.value = ''
  curTime.value = 0
  seekTime.value = 0
  duration.value = 0
  hideTimelinePreview()
  timelinePreviewSrc.value = ''

  const result = (await window.api.invoke('ffmpeg:createPreview', {
    videoPath: filePath,
    workspaceId: workspaceId.value
  })) as { previewPath: string | null; error?: string }

  isPreparing.value = false

  if (!result.previewPath) {
    videoError.value = result.error ?? '동영상 미리보기를 준비하지 못했습니다.'
    return
  }

  videoPath.value = result.previewPath
  videoSrc.value = toAppImageUrl(result.previewPath)
  await updateWorkspaceVideo({
    id: workspaceId.value,
    videoPath: result.previewPath,
    videoOriginName: videoName.value
  })
}

// 미리보기 영상 메타데이터를 초기화함
const onVideoLoaded = (): void => {
  const video = videoRef.value
  if (!video) return

  duration.value = Number.isFinite(video.duration) ? video.duration : 0
  curTime.value = video.currentTime
  seekTime.value = video.currentTime
  videoError.value = ''
}

// 미리보기 재생 실패 메시지를 표시함
const onVideoError = (): void => {
  videoError.value =
    '이 동영상은 미리보기 재생이 어렵습니다. ffmpeg가 설치되어 있으면 정밀 캡쳐로 프레임을 추출할 수 있습니다.'
}

// 재생 중 현재 시간을 동기화함
const syncVideoTime = (): void => {
  const video = videoRef.value
  if (!video) return

  curTime.value = video.currentTime
  seekTime.value = video.currentTime
}

const waitForSeek = (): Promise<void> =>
  new Promise((resolve) => {
    const video = videoRef.value
    if (!video) {
      resolve()
      return
    }

    const onSeeked = (): void => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }

    video.addEventListener('seeked', onSeeked)
  })

// 지정 시간으로 미리보기를 이동함
const seekVideoTo = async (second: number): Promise<void> => {
  const video = videoRef.value
  if (!video) return

  const nextSecond = Math.min(Math.max(second, 0), duration.value || second)
  if (Math.abs(video.currentTime - nextSecond) < 0.01) return

  const seeked = waitForSeek()
  video.currentTime = nextSecond
  await seeked
  curTime.value = video.currentTime
  seekTime.value = video.currentTime
}

// 타임라인 슬라이더 이동을 반영함
const seekPreview = (): void => {
  void seekVideoTo(seekTime.value)
}

// 현재 위치에서 지정 초만큼 이동함
const seekBySeconds = (deltaSecond: number): void => {
  void seekVideoTo(curTime.value + deltaSecond)
}

// 재생/일시정지를 전환함
const togglePlayback = async (): Promise<void> => {
  const video = videoRef.value
  if (!video) return

  if (video.paused) {
    await video.play()
    return
  }

  video.pause()
}

// 비디오 플레이어 단축키를 처리함
const onVideoShortcut = (event: KeyboardEvent): void => {
  if (!videoSrc.value) return

  const target = event.target as HTMLElement | null
  const isEditableTarget =
    target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

  if (isEditableTarget) return

  const key = event.key.toLowerCase()

  if (event.key === VIDEO_PLAYER_SHORTCUTS.PLAY_TOGGLE) {
    event.preventDefault()
    void togglePlayback()
    return
  }

  if (key === VIDEO_PLAYER_SHORTCUTS.NEXT_FRAME) {
    event.preventDefault()
    seekBySeconds(1)
    return
  }

  if (key === VIDEO_PLAYER_SHORTCUTS.PREV_FRAME) {
    event.preventDefault()
    seekBySeconds(-1)
  }
}

// 현재 장면을 캡쳐함
const captureCurrentScene = async (): Promise<void> => {
  seekTime.value = curTime.value
  await saveFrame()
}

// 전역 비디오 캡쳐 단축키를 처리함
const onVideoCaptureShortcut = (): void => {
  if (!videoSrc.value) return
  void captureCurrentScene()
}

// 캡쳐 완료 피드백을 짧게 표시함
const showCaptureFlash = (): void => {
  if (captureFlashTimer) {
    clearTimeout(captureFlashTimer)
  }

  isCaptureFlashing.value = true
  captureFlashTimer = setTimeout(() => {
    isCaptureFlashing.value = false
    captureFlashTimer = null
  }, 120)
}

// 캡쳐 이름 수정 모달을 엶
const onEditCapture = (image: CaptureImage): void => {
  editingCaptureId.value = image.id
  modalCaptureNameRef.value?.onOpen({
    initialName: image.name,
    title: '캡쳐 이미지명을 변경하세요',
    confirmText: '저장'
  })
}

// 캡쳐 삭제 확인 모달을 엶
const onDeleteCapture = (image: CaptureImage): void => {
  deletingCapture.value = image
  modalConfirmRef.value?.onOpen()
}

// 캡쳐 이미지를 삭제함
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

// 캡쳐 이름 변경을 저장함
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
}

// ffmpeg로 원본 영상 프레임을 저장함
const saveFrame = async (): Promise<void> => {
  const captureName = makeName()
  const result = (await window.api.invoke('ffmpeg:extractFrame', {
    videoPath: videoPath.value,
    second: seekTime.value
  })) as { dataUrl: string | null; error?: string }

  if (!result.dataUrl) {
    videoError.value = result.error ?? 'ffmpeg 프레임 추출에 실패했습니다.'
    return
  }

  const saved = await createCaptureWithImage({
    workspaceId: String(workspaceId.value),
    name: captureName,
    dataUrl: result.dataUrl,
    currentUrl: keepUrl(),
    sourceType: 'video'
  })
  if (!saved) return

  captureImages.value.unshift({
    id: saved.id,
    name: captureName,
    src: result.dataUrl,
    imgPath: saved.imgPath
  })
  showCaptureFlash()
}

// 현재 시점 기준 캡쳐 이름을 만듦
const makeName = (): string => formatTime(curTime.value)

// 웹 캡쳐 시작 URL이 깨지지 않도록 기존 http URL만 보존함
const keepUrl = (): string => {
  const latestUrl = workspaceInfo.value?.latest_src_url ?? ''

  return /^https?:\/\//i.test(latestUrl) ? latestUrl : ''
}

// 초를 HH:MM:SS로 표시함
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '00:00:00'

  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const restSeconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

// appimg 프로토콜 URL로 변환함
const toAppImageUrl = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '')

  return `appimg:///${encodeURI(normalizedPath)}`
}

// 경로에서 파일명만 추출함
const getFileName = (filePath: string): string =>
  filePath.replace(/\\/g, '/').split('/').pop() ?? ''

onMounted(async () => {
  await loadWorkspaceInfo()
  await loadCaptureList()
  window.addEventListener('keydown', onVideoShortcut)
  window.api.invoke(
    'shortcut:register',
    CAPTURE_SHORTCUTS.VIDEO_CAPTURE,
    SHORTCUT_CHANNELS.CAPTURE_VIDEO
  )
  videoCaptureListener = window.api.on(SHORTCUT_CHANNELS.CAPTURE_VIDEO, onVideoCaptureShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onVideoShortcut)
  videoCaptureListener?.()
  videoCaptureListener = null
  if (captureFlashTimer) {
    clearTimeout(captureFlashTimer)
    captureFlashTimer = null
  }
  hideTimelinePreview()
  window.api.invoke('shortcut:unregister', CAPTURE_SHORTCUTS.VIDEO_CAPTURE)
  if (videoSrc.value.startsWith('blob:')) URL.revokeObjectURL(videoSrc.value)
})
</script>
