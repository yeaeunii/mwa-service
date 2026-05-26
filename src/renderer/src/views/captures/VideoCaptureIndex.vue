<template>
  <div class="flex h-screen overflow-hidden bg-slate-200 text-slate-950">
    <aside class="flex w-[22rem] shrink-0 flex-col border-r border-base-content/10 bg-base-100 p-3">
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
              {{ workspaceInfo?.name || 'Workspace명' }}
            </a>
          </li>
        </ul>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <div>
          <h2 class="text-base font-black">동영상 캡쳐 목록</h2>
          <p class="text-xs text-base-content/50">{{ captureImages.length }}개</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm btn-square" @click="router.back()">
          <i-lucide-x class="h-4 w-4" />
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto rounded-md bg-slate-50 p-3">
        <div
          v-if="captureImages.length === 0"
          class="flex h-40 items-center justify-center rounded-md border border-dashed border-base-300 text-sm text-base-content/45"
        >
          캡쳐 이미지가 없습니다
        </div>

        <div v-else class="grid grid-cols-2 gap-4">
          <div v-for="image in captureImages" :key="image.id" class="group">
            <div class="relative h-28 overflow-hidden rounded-md border border-gray-300 shadow-sm">
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

    <main class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex items-center justify-between border-b border-base-content/10 bg-slate-200 p-2"
      >
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-sm btn-primary gap-2" @click="openVideoPicker">
            <i-lucide-folder-open class="h-4 w-4" />
            동영상 불러오기
          </button>
          <input
            ref="videoInputRef"
            type="file"
            class="hidden"
            accept="video/*"
            @change="loadVideoFile"
          />
          <span class="max-w-md truncate text-sm font-semibold text-base-content/70">
            {{ videoFileName || '동영상을 선택하세요' }}
          </span>
        </div>

        <div class="join">
          <button
            type="button"
            class="btn join-item btn-sm"
            :class="captureMode === 'live' ? 'btn-neutral' : 'btn-ghost'"
            @click="captureMode = 'live'"
          >
            재생 캡쳐
          </button>
          <button
            type="button"
            class="btn join-item btn-sm"
            :class="captureMode === 'precise' ? 'btn-neutral' : 'btn-ghost'"
            @click="captureMode = 'precise'"
          >
            정밀 캡쳐
          </button>
        </div>
      </header>

      <section class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div class="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-black">
          <video
            v-if="videoSrc"
            ref="videoRef"
            :src="videoSrc"
            class="h-full w-full object-contain"
            controls
            @loadedmetadata="onVideoLoaded"
            @timeupdate="syncVideoTime"
          />
          <div
            v-else
            class="flex h-full items-center justify-center text-sm font-semibold text-white/60"
          >
            동영상을 불러오면 이 영역에서 재생됩니다
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
          <div v-if="captureMode === 'live'" class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold">재생 중 현재 장면 캡쳐</h3>
              <p class="mt-1 text-xs text-base-content/55">
                동영상이 재생 중이어도 현재 보이는 프레임을 바로 저장합니다.
              </p>
            </div>
            <button
              type="button"
              class="btn btn-neutral btn-sm gap-2"
              :disabled="!videoSrc"
              @click="openCaptureNameModal"
            >
              <i-lucide-camera class="h-4 w-4" />
              현재 장면 캡쳐
            </button>
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-bold">시간을 지정해 프레임 캡쳐</h3>
                <p class="mt-1 text-xs text-base-content/55">
                  원하는 시간으로 이동한 뒤 멈춰 있는 프레임을 저장합니다.
                </p>
              </div>
              <button
                type="button"
                class="btn btn-neutral btn-sm gap-2"
                :disabled="!videoSrc"
                @click="capturePreciseFrame"
              >
                <i-lucide-scan-line class="h-4 w-4" />
                지정 시간 캡쳐
              </button>
            </div>
            <div class="grid grid-cols-[1fr_112px_92px] items-center gap-3">
              <input
                v-model.number="preciseSecond"
                type="range"
                class="range range-sm"
                min="0"
                :max="duration || 0"
                step="0.1"
                :disabled="!videoSrc"
                @input="seekPreview"
              />
              <input
                v-model.number="preciseSecond"
                type="number"
                class="input input-sm input-bordered"
                min="0"
                :max="duration || 0"
                step="0.1"
                :disabled="!videoSrc"
                @change="seekPreview"
              />
              <span class="text-right text-xs font-semibold text-base-content/60">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <canvas ref="canvasRef" class="hidden"></canvas>

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
  type WorkspaceDetail
} from '@/database'
import type { CaptureImage } from '@/types'

const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId ?? ''))

const videoInputRef = ref<HTMLInputElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const modalCaptureNameRef = ref<ComponentRef<'ModalCaptureName'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)

const workspaceInfo = ref<WorkspaceDetail | null>(null)
const captureImages = ref<CaptureImage[]>([])
const deletingCapture = ref<CaptureImage | null>(null)
const editingCaptureId = ref<number | null>(null)
const videoSrc = ref('')
const videoFileName = ref('')
const captureMode = ref<'live' | 'precise'>('live')
const currentTime = ref(0)
const preciseSecond = ref(0)
const duration = ref(0)

const toFileSrc = (imgPath: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  return `appimg:///${normalizedPath}`
}

const loadWorkspaceInfo = async (): Promise<void> => {
  if (!workspaceId.value) return

  workspaceInfo.value = await getWorkspaceDetail(workspaceId.value)
}

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

const openVideoPicker = (): void => {
  videoInputRef.value?.click()
}

const loadVideoFile = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const [file] = target.files ?? []
  if (!file) return

  if (videoSrc.value) URL.revokeObjectURL(videoSrc.value)

  videoFileName.value = file.name
  videoSrc.value = URL.createObjectURL(file)
  currentTime.value = 0
  preciseSecond.value = 0
  duration.value = 0
  target.value = ''
}

const onVideoLoaded = (): void => {
  const video = videoRef.value
  if (!video) return

  duration.value = Number.isFinite(video.duration) ? video.duration : 0
  currentTime.value = video.currentTime
  preciseSecond.value = video.currentTime
}

const syncVideoTime = (): void => {
  const video = videoRef.value
  if (!video) return

  currentTime.value = video.currentTime
  if (captureMode.value === 'live') {
    preciseSecond.value = video.currentTime
  }
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

const seekVideoTo = async (second: number): Promise<void> => {
  const video = videoRef.value
  if (!video) return

  const nextSecond = Math.min(Math.max(second, 0), duration.value || second)
  if (Math.abs(video.currentTime - nextSecond) < 0.01) return

  const seeked = waitForSeek()
  video.currentTime = nextSecond
  await seeked
  currentTime.value = video.currentTime
  preciseSecond.value = video.currentTime
}

const seekPreview = (): void => {
  void seekVideoTo(preciseSecond.value)
}

const getCaptureImageDataURL = (): string | null => {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

const openCaptureNameModal = (): void => {
  if (!videoSrc.value) return

  editingCaptureId.value = null
  modalCaptureNameRef.value?.onOpen({
    initialName: `${videoFileName.value || '동영상'} ${formatTime(currentTime.value)}`,
    title: '캡쳐 이미지명을 입력하세요',
    confirmText: '저장'
  })
}

const capturePreciseFrame = async (): Promise<void> => {
  if (!videoSrc.value) return

  const video = videoRef.value
  video?.pause()
  await seekVideoTo(preciseSecond.value)
  openCaptureNameModal()
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

  const imageDataURL = getCaptureImageDataURL()
  if (!imageDataURL) return

  const saved = await createCaptureWithImage({
    workspaceId: String(workspaceId.value),
    name: nextName,
    dataUrl: imageDataURL,
    currentUrl: `video:${videoFileName.value}`
  })
  if (!saved) return

  captureImages.value.unshift({
    id: saved.id,
    name: nextName,
    src: imageDataURL,
    imgPath: saved.imgPath
  })
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '00:00'

  const totalSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const restSeconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

onMounted(async () => {
  await loadWorkspaceInfo()
  await loadCaptureList()
})

onUnmounted(() => {
  if (videoSrc.value) URL.revokeObjectURL(videoSrc.value)
})
</script>
