<template>
  <div class="flex h-screen flex-col bg-base-200">
    <!-- Navbar -->
    <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
      <div class="mx-auto flex w-full max-w-[1920px] items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="router.push('/projects/1')">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <i-lucide-briefcase class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-base font-bold leading-tight">{{ workspaceName || '워크스페이스' }}</div>
              <div class="text-xs text-base-content/50">워크스페이스</div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="selectedIds.size > 0" class="text-xs font-medium text-primary">
            {{ selectedIds.size }}개 선택됨
          </span>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="mx-auto flex w-full max-w-[1920px] flex-1 overflow-hidden">
      <!-- Screenshot Panel -->
      <aside class="flex w-72 shrink-0 flex-col border-r border-base-content/10 bg-base-100">
        <div class="flex items-center justify-between border-b border-base-content/5 px-4 py-3">
          <div class="flex items-center gap-2">
            <i-lucide-image class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">스크린샷</span>
            <span class="badge badge-sm badge-ghost">{{ screenshots.length }}</span>
          </div>
          <router-link
            :to="{ name: 'capture-index', params: { workspaceId } }"
            class="btn btn-primary btn-sm gap-1.5"
          >
            <i-lucide-camera class="h-4 w-4" />
            캡쳐
          </router-link>
        </div>
        <div class="px-3 py-2">
          <label class="input input-sm w-full">
            <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
            <input type="search" placeholder="검색..." />
          </label>
        </div>
        <div
          ref="gridContainerRef"
          class="relative flex-1 overflow-y-auto px-2 pb-2 select-none"
          @mousedown="onMouseDown"
        >
          <div class="grid grid-cols-2 gap-1.5">
            <div
              v-for="shot in screenshots"
              :key="shot.id"
              :data-shot-id="shot.id"
              class="group cursor-pointer rounded-lg p-1.5 transition-colors"
              :class="[
                selectedIds.has(shot.id)
                  ? 'bg-primary/10 ring-2 ring-primary/40 ring-inset'
                  : 'hover:bg-primary/5'
              ]"
              :draggable="selectedIds.has(shot.id)"
              @click.stop="onClickItem(shot.id, $event)"
              @dragstart="onDragStart(shot.id, $event)"
              @dragend="onDragEnd"
            >
              <div class="relative overflow-hidden rounded-md">
                <button
                  type="button"
                  class="btn btn-xs btn-circle absolute right-1.5 top-1.5 z-20 border-primary shadow-sm"
                  :class="
                    selectedIds.has(shot.id)
                      ? 'btn-primary text-white'
                      : 'bg-white/95 text-primary hover:bg-primary/10'
                  "
                  @click.stop="onToggleSelectCaptureImage(shot.id)"
                >
                  <i-lucide-check class="h-3.5 w-3.5" />
                </button>
                <img
                  :src="shot.src"
                  alt="screenshot"
                  class="pointer-events-none h-20 w-full rounded-md border object-cover transition-transform duration-200 group-hover:scale-105"
                  :class="selectedIds.has(shot.id) ? 'border-primary/40' : 'border-slate-200'"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center rounded-md transition-colors"
                  :class="
                    selectedIds.has(shot.id)
                      ? 'bg-primary/10'
                      : 'bg-black/0 group-hover:bg-black/30'
                  "
                >
                  <button
                    type="button"
                    class="btn btn-xs btn-circle border-none bg-white/90 text-base-content opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                    @click.stop="openCaptureImageModal(shot.id)"
                  >
                    <i-lucide-eye class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                class="mt-1.5 truncate px-0.5 text-center text-xs font-medium"
                :class="selectedIds.has(shot.id) ? 'text-primary' : 'text-base-content/70'"
              >
                {{ shot.name }}
              </div>
            </div>
          </div>

          <!-- Drag Selection Rectangle -->
          <div
            v-if="isDragging"
            class="pointer-events-none absolute z-20 border-2 border-primary/60 bg-primary/10"
            :style="selectionStyle"
          />
        </div>
      </aside>

      <!-- Manual Document Section -->
      <main
        class="flex flex-1 flex-col overflow-hidden transition-colors duration-150"
        :class="isOverDropZone ? 'bg-primary/5' : ''"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div
          class="flex items-center justify-between border-b border-base-content/5 bg-base-100 px-6 py-3"
        >
          <div class="flex items-center gap-2">
            <i-lucide-file-text class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">메뉴얼 문서</span>
            <span class="badge badge-sm badge-ghost">{{ documents.length }}</span>
          </div>
          <label class="input input-sm w-64">
            <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
            <input type="search" placeholder="문서 검색..." />
          </label>
        </div>

        <div class="relative flex-1 overflow-y-auto p-6">
          <!-- Drop Zone Overlay -->
          <div
            v-if="isOverDropZone"
            class="pointer-events-none absolute inset-6 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5"
          >
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <i-lucide-file-plus class="h-7 w-7 text-primary" />
            </div>
            <span class="text-sm font-bold text-primary"> 여기에 놓아서 문서를 생성하세요 </span>
            <span v-if="draggingCount > 0" class="text-xs text-primary/60">
              {{ draggingCount }}개의 스크린샷
            </span>
          </div>

          <div
            v-if="documents.length === 0"
            class="flex h-full flex-col items-center justify-center gap-3 text-base-content/30"
          >
            <i-lucide-file-x class="h-12 w-12" />
            <span class="text-sm font-medium">스크린샷을 드래그하여 문서를 생성하세요</span>
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <router-link
              v-for="doc in documents"
              :key="doc.id"
              :to="`/workspace/${workspaceId}/documents`"
              class="group block overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div class="relative overflow-hidden">
                <img
                  :src="doc.thumbnail"
                  alt="thumbnail"
                  class="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div
                  v-if="doc.screenshotCount > 1"
                  class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm"
                >
                  <i-lucide-layers class="h-3 w-3" />
                  {{ doc.screenshotCount }}
                </div>
                <button
                  type="button"
                  class="btn btn-xs btn-circle absolute right-2 top-2 z-20 border-none bg-white/90 text-error opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                  @click.prevent.stop="openDeleteDocConfirm(doc)"
                >
                  <i-lucide-trash class="h-3.5 w-3.5" />
                </button>
              </div>
              <div class="px-3 pt-3">
                <div class="mb-2 flex items-center justify-between">
                  <div class="font-bold leading-tight line-clamp-1">{{ doc.title }}</div>
                  <div class="badge badge-soft badge-sm shrink-0">{{ doc.status }}</div>
                </div>
                <p class="mb-3 h-10 text-xs leading-relaxed text-base-content/50 line-clamp-2">
                  {{ doc.description }}
                </p>
              </div>
              <div class="flex items-center justify-between border-t border-base-content/5 p-3">
                <div class="flex items-center gap-1 text-xs text-base-content/40">
                  <i-lucide-clock class="h-3 w-3" />
                  {{ doc.createdAt }}
                </div>
                <div class="flex items-center gap-1 text-xs text-base-content/40">
                  <i-lucide-list-checks class="h-3 w-3" />
                  {{ doc.screenshotCount }} steps
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </main>
    </div>

    <WorkspaceModalCaptureImages
      ref="modalCaptureImagesRef"
      :capture-image-items="screenshots"
      :selected-image-ids="selectedImageIds"
      title="캡쳐 이미지"
      @on-toggle-select-image="onToggleSelectCaptureImage"
      @on-remove-image="onRemoveCaptureImage"
    />
    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="onConfirmDeleteDoc">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ deletingDoc?.title }}</h3>
          <p class="text-sm text-gray-500">문서를 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>

    <!-- Custom Drag Ghost (hidden, used for setDragImage) -->
    <div
      ref="dragGhostRef"
      class="pointer-events-none fixed -left-[9999px] -top-[9999px] z-[9999] flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white shadow-xl"
    >
      <i-lucide-image class="h-4 w-4" />
      <span>{{ draggingCount }}개 스크린샷</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDragSelect } from '@renderer/composables/useDragSelect'
import { useDragSource, useDropZone } from '@renderer/composables/useCrossDrag'
import {
  createDoc,
  deleteCapture,
  deleteDoc,
  getCaptureList,
  getDocList,
  getWorkspaceDetail
} from '@/database'
import WorkspaceModalCaptureImages from './components/ModalCaptureImages.vue'

const route = useRoute()
const workspaceId = computed(() => route.params.id)
const workspaceName = ref('')




const router = useRouter()

// --- Screenshot Data ---

interface Screenshot {
  id: number
  name: string
  src: string
  imgPath?: string
}

const screenshots = ref<Screenshot[]>([])
const modalCaptureImagesRef = ref<InstanceType<typeof WorkspaceModalCaptureImages> | null>(null)

const toFileSrc = (imgPath: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  return `appimg:///${normalizedPath}`
}

const loadCaptureList = async (): Promise<void> => {
  const list = await getCaptureList({
    workspaceId: Number(workspaceId.value)
  })

  screenshots.value = list.map((item) => ({
    id: item.id,
    name: item.name,
    src: item.img_path ? toFileSrc(item.img_path) : '',
    imgPath: item.img_path ?? undefined
  }))
}

const loadWorkspaceDetail = async (): Promise<void> => {
  const detail = await getWorkspaceDetail(String(workspaceId.value))
  workspaceName.value = detail?.name ?? ''
}

const openCaptureImageModal = (imageId: number): void => {
  modalCaptureImagesRef.value?.onOpen(imageId)
}

const onToggleSelectCaptureImage = (imageId: number): void => {
  const nextSelectedIds = new Set(selectedIds.value)

  if (nextSelectedIds.has(imageId)) {
    nextSelectedIds.delete(imageId)
  } else {
    nextSelectedIds.add(imageId)
  }

  selectedIds.value = nextSelectedIds
}

const onRemoveCaptureImage = async (imageId: number): Promise<void> => {
  const target = screenshots.value.find((item) => item.id === imageId)
  if (!target) return

  await deleteCapture({
    id: target.id,
    imgPath: target.imgPath ?? null
  })

  screenshots.value = screenshots.value.filter((item) => item.id !== imageId)
  selectedIds.value.delete(imageId)
  selectedIds.value = new Set(selectedIds.value)
}

// --- Drag Select ---

const gridContainerRef = ref<HTMLElement | null>(null)
const screenshotIds = computed(() => screenshots.value.map((s) => s.id))

const { selectedIds, isDragging, selectionStyle, onMouseDown, onClickItem, cancelDrag } =
  useDragSelect({
    containerRef: gridContainerRef,
    dataAttr: 'shot-id',
    itemIds: screenshotIds
  })

const selectedImageIds = computed(() => Array.from(selectedIds.value))

// --- Document Data ---

interface Document {
  id: number
  title: string
  description: string
  thumbnail: string
  status: string
  createdAt: string
  screenshotCount: number
  screenshotIds: number[]
}

let nextDocId = 1
const documents = ref<Document[]>([])
const deletingDoc = ref<Document | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)

const formatDocCreatedAt = (dateText: string): string => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText

  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getDocCaptureId = (docMetaJson: string): number | null => {
  try {
    const meta = JSON.parse(docMetaJson || '{}') as { captureId?: unknown }
    const captureId = Number(meta.captureId)
    return Number.isFinite(captureId) ? captureId : null
  } catch {
    return null
  }
}

const loadDocList = async (): Promise<void> => {
  const list = await getDocList({
    workspaceId: Number(workspaceId.value)
  })

  documents.value = list.map((doc) => {
    const captureId = getDocCaptureId(doc.doc_meta_json)

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      thumbnail: doc.orgn_img_path ? toFileSrc(doc.orgn_img_path) : '',
      status: doc.status,
      createdAt: formatDocCreatedAt(doc.created_at),
      screenshotCount: captureId === null ? 0 : 1,
      screenshotIds: captureId === null ? [] : [captureId]
    }
  })
}

const openDeleteDocConfirm = (doc: Document): void => {
  deletingDoc.value = doc
  modalConfirmRef.value?.onOpen()
}

const onConfirmDeleteDoc = async (): Promise<void> => {
  const target = deletingDoc.value
  if (!target) return

  await deleteDoc(target.id)
  documents.value = documents.value.filter((doc) => doc.id !== target.id)
  deletingDoc.value = null
}

// --- Cross-Panel Drag & Drop ---

const dragGhostRef = ref<HTMLElement | null>(null)

const { draggingCount, onDragStart, onDragEnd } = useDragSource({
  selectedIds,
  ghostRef: dragGhostRef,
  cancelDragSelect: cancelDrag
})

const { isOverDropZone, onDragOver, onDragLeave, onDrop } = useDropZone<number>({
  onDropItems: (droppedIds) => {
    void createDocsFromDroppedShots(droppedIds)
  }
})

const createDocsFromDroppedShots = async (droppedIds: number[]): Promise<void> => {
  const droppedShots = droppedIds
    .map((id) => screenshots.value.find((s) => s.id === id))
    .filter(Boolean) as Screenshot[]

  const pad = (n: number): string => String(n).padStart(2, '0')
  const now = new Date()
  const dateStr = `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  for (const [index, shot] of droppedShots.entries()) {
    const description = `${shot.name}에 대한 매뉴얼 문서입니다.`
    const docId = await createDoc({
      workspaceId: Number(workspaceId.value),
      title: shot.name,
      description,
      status: '작업대기',
      orgnImgPath: shot.imgPath ?? '',
      drawImgPath: '',
      sortOrder: documents.value.length + index + 1,
      docMetaJson: JSON.stringify({
        captureId: shot.id,
        captureName: shot.name
      }),
      contentJson: '[]',
      annotationJson: '[]'
    })

    if (docId === null) continue

    documents.value.push({
      id: docId,
      title: shot.name,
      description,
      thumbnail: shot.src,
      status: '작업대기',
      createdAt: dateStr,
      screenshotCount: 1,
      screenshotIds: [shot.id]
    })
  }

  selectedIds.value = new Set()
}





onMounted(() => {
  console.log('workspaceId:', workspaceId.value)
  void loadWorkspaceDetail()
  void loadCaptureList()
  void loadDocList()
})
</script>
