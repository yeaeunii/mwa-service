<template>
  <div class="flex h-screen flex-col bg-base-200">
    <!-- Navbar -->
    <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
      <div class="mx-auto flex w-full max-w-[1920px] items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="goBackToProject">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <i-lucide-briefcase class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-base font-bold leading-tight">
                {{ workspaceName || '워크스페이스' }}
              </div>
              <div class="text-xs text-base-content/50">워크스페이스</div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-sm gap-1.5"
            :class="isEditMode ? 'btn-primary' : 'btn-active'"
            @click="toggleEditMode"
          >
            <i-lucide-pencil class="h-4 w-4" />
            {{ isEditMode ? '완료' : '편집모드' }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="mx-auto flex w-full max-w-[1920px] flex-1 overflow-hidden">
      <!-- Screenshot Panel -->
      <aside class="flex w-72 shrink-0 flex-col border-r border-base-content/10 bg-base-100">
        <div class="border-b border-base-content/5 px-3 py-3">
          <div class="mb-3 flex items-center gap-2 px-1">
            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <i-lucide-image class="h-4 w-4 text-primary" />
            </div>
            <span class="text-sm font-semibold">스크린샷</span>
            <span class="badge badge-sm badge-ghost">{{ screenshots.length }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="tooltip tooltip-neutral tooltip-bottom btn btn-sm gap-1.5"
              data-tip="이미지 불러오기"
              @click="openLocalImagePicker"
            >
              <i-lucide-upload class="h-4 w-4" />
            </button>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              @change="onChangeLocalImages"
            />

            <router-link
              :to="{ name: 'capture-index', params: { workspaceId } }"
              class="tooltip tooltip-neutral tooltip-bottom btn btn-sm gap-1.5 border-primary/20 bg-primary/30 text-active hover:bg-primary/50"
              data-tip="웹 화면 캡쳐"
            >
              <i-lucide-camera class="h-4 w-4" />
            </router-link>
          </div>
        </div>

        <div class="border-b border-base-content/5 px-3 py-2">
          <label class="input input-sm w-full">
            <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
            <input v-model="screenshotSearchKeyword" type="search" placeholder="검색..." />
          </label>
        </div>

        <div
          ref="gridContainerRef"
          class="relative flex-1 overflow-y-auto px-2 pb-2 select-none"
          @mousedown="onMouseDown"
        >
          <div class="grid grid-cols-2 gap-1.5">
            <div
              v-for="shot in filteredScreenshots"
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
        class="relative flex flex-1 flex-col overflow-hidden transition-colors duration-150"
        :class="isOverDropZone ? 'bg-primary/5' : ''"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
      >
        <!-- Drop Zone Overlay -->
        <div
          v-if="isOverDropZone"
          class="pointer-events-none absolute inset-x-6 bottom-6 top-20 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5"
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
          class="flex items-center justify-between border-b border-base-content/5 bg-base-100 px-6 py-3"
        >
          <div class="flex items-center gap-2">
            <i-lucide-file-text class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">메뉴얼 문서</span>
            <span class="badge badge-sm badge-ghost">{{ documents.length }}</span>
          </div>
          <div v-if="!isEditMode" class="flex items-center gap-2">
            <label class="input input-sm w-64">
              <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
              <input v-model="documentSearchKeyword" type="search" placeholder="문서 검색..." />
            </label>
            <select v-model="documentSortMode" class="select select-sm w-36">
              <option value="custom">사용자 지정순</option>
              <option value="latest">최신순</option>
              <option value="functionCount">기능개수순</option>
            </select>
          </div>
        </div>

        <div
          v-if="isEditMode"
          class="flex items-center justify-between border-b border-base-content/5 bg-base-100 px-6 py-2"
        >
          <div class="flex items-center gap-2 text-sm">
            <span class="badge badge-primary badge-outline"
              >{{ selectedDocumentIds.size }}개 선택</span
            >
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-sm border-primary/20"
              @click="toggleSelectAllDocuments"
            >
              {{ isAllDocumentsSelected ? '전체 해제' : '전체 선택' }}
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="
                selectedDocumentIds.size > 0
                  ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                  : ''
              "
              :disabled="selectedDocumentIds.size === 0"
              @click="openDocAction('copy')"
            >
              <i-lucide-copy class="h-3.5 w-3.5" />
              복사
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="
                selectedDocumentIds.size > 0
                  ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                  : ''
              "
              :disabled="selectedDocumentIds.size === 0"
              @click="openDocAction('move')"
            >
              <i-lucide-folder-input class="h-3.5 w-3.5" />
              이동
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="
                selectedDocumentIds.size > 0
                  ? 'border-error/20 bg-error/30 text-error hover:bg-error/50'
                  : ''
              "
              :disabled="selectedDocumentIds.size === 0"
              @click="openDeleteSelectedConfirm"
            >
              선택 삭제
            </button>
          </div>
        </div>

        <div class="relative flex-1 overflow-y-auto p-6">
          <div
            v-if="filteredDocuments.length === 0"
            class="flex h-full flex-col items-center justify-center gap-3 text-base-content/30"
          >
            <i-lucide-file-x class="h-12 w-12" />
            <span class="text-sm font-medium">
              {{
                documentSearchKeyword
                  ? '검색 결과가 없습니다'
                  : '스크린샷을 드래그하여 문서를 생성하세요'
              }}
            </span>
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            @dragover.prevent="onDocumentGridDragOver"
            @drop.prevent="onDocumentGridDrop"
          >
            <component
              :is="isEditMode ? 'div' : 'router-link'"
              v-for="(doc, index) in filteredDocuments"
              :key="doc.id"
              :to="!isEditMode ? `/workspace/${workspaceId}/documents/${doc.id}` : undefined"
              class="group block overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              :class="[
                isEditMode ? 'cursor-move' : 'cursor-pointer',
                selectedDocumentIds.has(doc.id)
                  ? 'border-2 border-primary shadow-lg shadow-primary/20'
                  : '',
                dragOverDocumentId === doc.id ? 'border-primary' : ''
              ]"
              :draggable="isEditMode"
              @click="onClickDocumentCard(doc.id, $event)"
              @dragstart="onDocumentDragStart(doc.id, $event)"
              @dragover.prevent="onDocumentDragOver(doc.id)"
              @drop.prevent="onDocumentDrop(doc.id)"
              @dragend="onDocumentDragEnd"
            >
              <div class="relative overflow-hidden">
                <div
                  class="absolute left-3 top-3 z-20 flex h-8 min-w-8 items-center justify-center rounded-full px-2 shadow-md ring-2 ring-white/90 backdrop-blur"
                  :class="selectedDocumentIds.has(doc.id) ? 'bg-primary/20' : 'bg-primary/20'"
                >
                  <span class="text-xs font-black tabular-nums">{{ index + 1 }}</span>
                </div>
                <img
                  :src="doc.thumbnail"
                  alt="thumbnail"
                  class="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 transition-colors duration-150"
                  :class="
                    selectedDocumentIds.has(doc.id)
                      ? 'bg-black/35'
                      : 'bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100'
                  "
                />
                <button
                  v-if="isEditMode"
                  type="button"
                  class="btn btn-xs btn-circle absolute right-5 top-2 z-20 border-primary shadow-sm"
                  :class="
                    selectedDocumentIds.has(doc.id)
                      ? 'btn-primary text-white'
                      : 'bg-white/95 text-primary hover:bg-primary/10'
                  "
                  @click.stop="toggleDocumentSelection(doc.id)"
                >
                  <i-lucide-check class="h-3.5 w-3.5" />
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
                  {{ doc.updatedAt }}
                </div>
                <div class="badge badge-ghost badge-sm">기능 {{ doc.functionCount }}개</div>
              </div>
            </component>
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
          <h3 class="mb-2 text-lg font-bold">
            선택한 문서 {{ pendingDeleteDocumentIds.length }}개를
          </h3>
          <p class="text-sm text-gray-500">정말 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>

    <ModalBase
      ref="modalDocActionRef"
      :title="docAction === 'copy' ? '문서 복사' : '문서 이동'"
      width="w-[28rem]"
      :close-on-backdrop="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-base-content/60">
          선택한 문서 {{ selectedDocumentIds.size }}개를
          {{ docAction === 'copy' ? '복사할' : '이동할' }} 워크스페이스를 선택하세요.
        </p>

        <div class="form-control w-full">
          <div class="label">
            <span class="label-text">대상 워크스페이스</span>
          </div>
          <button
            ref="targetWorkspaceButtonRef"
            type="button"
            class="select select-bordered flex w-full items-center justify-between text-left"
            :disabled="targetWorkspaces.length === 0"
            @click="toggleWorkspaceMenu"
          >
            <span :class="targetWorkspaceId == null ? 'text-base-content/40' : ''">
              {{ targetWorkspaceName || '워크스페이스 선택' }}
            </span>
            <i-lucide-chevron-down class="h-4 w-4 opacity-60" />
          </button>
        </div>

        <div
          v-if="targetWorkspaces.length === 0"
          class="rounded-lg bg-base-200 px-3 py-2 text-sm text-base-content/60"
        >
          이동하거나 복사할 다른 워크스페이스가 없습니다.
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="isDocActioning"
            @click="close"
          >
            취소
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="
              targetWorkspaceId == null || selectedDocumentIds.size === 0 || isDocActioning
            "
            @click="onConfirmDocAction(close)"
          >
            {{ docAction === 'copy' ? '복사' : '이동' }}
          </button>
        </div>
      </template>
    </ModalBase>

    <div
      v-if="isWorkspaceMenuOpen"
      class="fixed z-[1000] max-h-48 overflow-y-auto rounded-lg border border-base-content/10 bg-base-100 p-1 shadow-xl"
      :style="workspaceMenuStyle"
    >
      <button
        v-for="workspace in targetWorkspaces"
        :key="workspace.id"
        type="button"
        class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-base-200"
        :class="targetWorkspaceId === workspace.id ? 'bg-primary/10 text-primary' : ''"
        @click="selectTargetWorkspace(workspace.id)"
      >
        {{ workspace.name }}
      </button>
    </div>

    <div v-if="docActionMessage" class="toast toast-end toast-bottom z-[1000]">
      <div class="alert border border-primary/20 bg-base-100 shadow-xl">
        <i-lucide-check-circle class="h-5 w-5 text-primary" />
        <span class="text-sm">{{ docActionMessage }}</span>
        <button type="button" class="btn btn-primary btn-xs" @click="goToActionWorkspace">
          보기
        </button>
        <button type="button" class="btn btn-ghost btn-xs" @click="clearDocActionMessage">
          닫기
        </button>
      </div>
    </div>

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
import type { Workspace } from '@database/dto'
import {
  copyDocs,
  createDoc,
  createCaptureWithImage,
  deleteCapture,
  deleteDoc,
  getCaptureList,
  getDocList,
  getWorkspaces,
  getWorkspaceDetail,
  moveDocs,
  updateDocSortOrders
} from '@/database'
import WorkspaceModalCaptureImages from './components/ModalCaptureImages.vue'

const route = useRoute()
const router = useRouter()

const workspaceId = computed(() => route.params.id)
const workspaceName = ref('')
const projectId = ref<number | null>(null)
const screenshotSearchKeyword = ref('')
const documentSearchKeyword = ref('')
const documentSortMode = ref<'custom' | 'latest' | 'functionCount'>('custom')

const fileInputRef = ref<HTMLInputElement | null>(null)

// --- Screenshot Data ---

interface Screenshot {
  id: number
  name: string
  src: string
  imgPath?: string
}

const screenshots = ref<Screenshot[]>([])
const modalCaptureImagesRef = ref<InstanceType<typeof WorkspaceModalCaptureImages> | null>(null)

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
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
  projectId.value = detail?.project_id ?? null
}

const goBackToProject = (): void => {
  if (projectId.value == null) {
    void router.push({ name: 'home' })
    return
  }

  void router.push({ name: 'projects-index', params: { id: projectId.value } })
}

const openCaptureImageModal = (imageId: number): void => {
  modalCaptureImagesRef.value?.onOpen(imageId)
}

const openLocalImagePicker = (): void => {
  fileInputRef.value?.click()
}

const onChangeLocalImages = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (!files.length || !workspaceId.value) return

  for (const file of files) {
    const dataUrl = await readFileAsDataUrl(file)
    const name = file.name.replace(/\.[^.]+$/, '') || file.name
    const saved = await createCaptureWithImage({
      workspaceId: String(workspaceId.value),
      name,
      dataUrl,
      currentUrl: ''
    })

    if (!saved) continue

    screenshots.value.unshift({
      id: saved.id,
      name,
      src: toFileSrc(saved.imgPath, `${Date.now()}`),
      imgPath: saved.imgPath
    })
  }
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
const screenshotIds = computed(() => filteredScreenshots.value.map((s) => s.id))

const { selectedIds, isDragging, selectionStyle, onMouseDown, onClickItem, cancelDrag } =
  useDragSelect({
    containerRef: gridContainerRef,
    dataAttr: 'shot-id',
    itemIds: screenshotIds,
    toggleOnClick: true
  })

const selectedImageIds = computed(() => Array.from(selectedIds.value))

// --- Document Data ---

interface Document {
  id: number
  title: string
  description: string
  thumbnail: string
  status: string
  updatedAt: string
  updatedTime: number
  functionCount: number
  sortOrder: number
}

const documents = ref<Document[]>([])
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const modalDocActionRef = ref<ComponentRef<'ModalBase'> | null>(null)
const pendingDeleteDocumentIds = ref<number[]>([])
const isEditMode = ref(false)
const selectedDocumentIds = ref<Set<number>>(new Set())
const draggingDocumentId = ref<number | null>(null)
const dragOverDocumentId = ref<number | null>(null)
const docAction = ref<'copy' | 'move'>('copy')
const transferWorkspaces = ref<Workspace[]>([])
const targetWorkspaceId = ref<number | null>(null)
const isDocActioning = ref(false)
const isWorkspaceMenuOpen = ref(false)
const targetWorkspaceButtonRef = ref<HTMLElement | null>(null)
const workspaceMenuStyle = ref<Record<string, string>>({})
const docActionMessage = ref('')
const docActionWorkspaceId = ref<number | null>(null)

const targetWorkspaces = computed(() =>
  transferWorkspaces.value.filter((workspace) => workspace.id !== Number(workspaceId.value))
)

const targetWorkspaceName = computed(
  () =>
    targetWorkspaces.value.find((workspace) => workspace.id === targetWorkspaceId.value)?.name ?? ''
)

const formatDocDate = (dateText: string): string => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText

  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getDocTime = (dateText: string): number => {
  const time = new Date(dateText).getTime()
  return Number.isNaN(time) ? 0 : time
}

const getFunctionCount = (contentJson: string | null | undefined): number => {
  if (!contentJson) return 0

  try {
    const parsed = JSON.parse(contentJson)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

const loadDocList = async (): Promise<void> => {
  const list = await getDocList({
    workspaceId: Number(workspaceId.value)
  })

  documents.value = list.map((doc) => {
    const thumbnailPath = doc.draw_img_path || doc.orgn_img_path
    const thumbnailVersion = doc.draw_img_path ? `${doc.updated_at}-${Date.now()}` : doc.updated_at

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      thumbnail: thumbnailPath ? toFileSrc(thumbnailPath, thumbnailVersion) : '',
      status: doc.status,
      updatedAt: formatDocDate(doc.updated_at),
      updatedTime: getDocTime(doc.updated_at),
      functionCount: getFunctionCount(doc.content_json),
      sortOrder: doc.sort_order
    }
  })
}

const toggleEditMode = (): void => {
  isEditMode.value = !isEditMode.value
  selectedDocumentIds.value = new Set()
  pendingDeleteDocumentIds.value = []
  draggingDocumentId.value = null
  dragOverDocumentId.value = null
}

const toggleDocumentSelection = (docId: number): void => {
  const next = new Set(selectedDocumentIds.value)
  if (next.has(docId)) {
    next.delete(docId)
  } else {
    next.add(docId)
  }
  selectedDocumentIds.value = next
}

const onClickDocumentCard = (docId: number, event: Event): void => {
  if (!isEditMode.value) return
  event.preventDefault()
  event.stopPropagation()
  toggleDocumentSelection(docId)
}

const isAllDocumentsSelected = computed(() => {
  if (filteredDocuments.value.length === 0) return false
  return filteredDocuments.value.every((doc) => selectedDocumentIds.value.has(doc.id))
})

const toggleSelectAllDocuments = (): void => {
  if (isAllDocumentsSelected.value) {
    selectedDocumentIds.value = new Set()
    return
  }
  selectedDocumentIds.value = new Set(filteredDocuments.value.map((doc) => doc.id))
}

const persistDocumentSortOrders = async (): Promise<void> => {
  documents.value = documents.value.map((doc, index) => ({
    ...doc,
    sortOrder: index + 1
  }))

  await updateDocSortOrders(
    documents.value.map((doc) => ({
      id: doc.id,
      sortOrder: doc.sortOrder
    }))
  )
}

const reorderDocumentList = (draggedId: number, targetId?: number): void => {
  const currentList = [...documents.value]
  const fromIndex = currentList.findIndex((doc) => doc.id === draggedId)
  if (fromIndex < 0) return

  const [draggedDoc] = currentList.splice(fromIndex, 1)
  if (!draggedDoc) return

  if (targetId == null) {
    currentList.push(draggedDoc)
  } else {
    const toIndex = currentList.findIndex((doc) => doc.id === targetId)
    if (toIndex < 0) {
      currentList.push(draggedDoc)
    } else {
      currentList.splice(toIndex, 0, draggedDoc)
    }
  }

  documents.value = currentList
}

const onDocumentDragStart = (docId: number, event: DragEvent): void => {
  if (!isEditMode.value) return
  draggingDocumentId.value = docId
  event.dataTransfer?.setData('text/plain', String(docId))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

const onDocumentDragOver = (docId: number): void => {
  if (!isEditMode.value) return
  dragOverDocumentId.value = docId
}

const onDocumentDrop = (targetDocId: number): void => {
  if (!isEditMode.value) return
  const draggedId = draggingDocumentId.value
  dragOverDocumentId.value = null
  if (draggedId == null || draggedId === targetDocId) return
  reorderDocumentList(draggedId, targetDocId)
  void persistDocumentSortOrders()
}

const onDocumentGridDragOver = (): void => {
  if (!isEditMode.value) return
}

const onDocumentGridDrop = (): void => {
  if (!isEditMode.value) return
  const draggedId = draggingDocumentId.value
  dragOverDocumentId.value = null
  if (draggedId == null) return
  reorderDocumentList(draggedId)
  void persistDocumentSortOrders()
}

const onDocumentDragEnd = (): void => {
  draggingDocumentId.value = null
  dragOverDocumentId.value = null
}

const openDeleteSelectedConfirm = (): void => {
  const idsToDelete = Array.from(selectedDocumentIds.value)
  if (idsToDelete.length === 0) return
  pendingDeleteDocumentIds.value = idsToDelete
  modalConfirmRef.value?.onOpen()
}

const openDocAction = async (action: 'copy' | 'move'): Promise<void> => {
  if (selectedDocumentIds.value.size === 0 || projectId.value == null) return

  docAction.value = action
  targetWorkspaceId.value = null
  isWorkspaceMenuOpen.value = false
  transferWorkspaces.value = await getWorkspaces({
    project_id: projectId.value,
    limit: 100,
    offset: 0
  })
  modalDocActionRef.value?.onOpen()
}

const setWorkspaceMenuStyle = (): void => {
  const button = targetWorkspaceButtonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()
  workspaceMenuStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${rect.width}px`
  }
}

const toggleWorkspaceMenu = async (): Promise<void> => {
  if (targetWorkspaces.value.length === 0) return

  isWorkspaceMenuOpen.value = !isWorkspaceMenuOpen.value
  if (!isWorkspaceMenuOpen.value) return

  await nextTick()
  setWorkspaceMenuStyle()
}

const selectTargetWorkspace = (workspaceId: number): void => {
  targetWorkspaceId.value = workspaceId
  isWorkspaceMenuOpen.value = false
}

const onConfirmDocAction = async (close: () => void): Promise<void> => {
  if (targetWorkspaceId.value == null || selectedDocumentIds.value.size === 0) return

  const docIds = Array.from(selectedDocumentIds.value)
  const action = docAction.value
  const nextWorkspaceId = targetWorkspaceId.value
  isDocActioning.value = true

  try {
    const params = {
      docIds,
      workspaceId: nextWorkspaceId
    }
    const success = action === 'copy' ? await copyDocs(params) : await moveDocs(params)
    if (!success) return

    if (action === 'move') {
      const movedIdSet = new Set(docIds)
      documents.value = documents.value.filter((doc) => !movedIdSet.has(doc.id))
      await persistDocumentSortOrders()
    }

    selectedDocumentIds.value = new Set()
    docActionWorkspaceId.value = nextWorkspaceId
    docActionMessage.value = `문서 ${docIds.length}개를 ${action === 'copy' ? '복사' : '이동'}했습니다.`
    close()
  } finally {
    isDocActioning.value = false
  }
}

const clearDocActionMessage = (): void => {
  docActionMessage.value = ''
  docActionWorkspaceId.value = null
}

const goToActionWorkspace = async (): Promise<void> => {
  const nextWorkspaceId = docActionWorkspaceId.value
  if (nextWorkspaceId == null) return

  clearDocActionMessage()
  await router.push({ name: 'workspace-detail', params: { id: nextWorkspaceId } })
}

const onConfirmDeleteDoc = async (): Promise<void> => {
  if (pendingDeleteDocumentIds.value.length === 0) return

  const deletingIdSet = new Set(pendingDeleteDocumentIds.value)
  await Promise.all(pendingDeleteDocumentIds.value.map((id) => deleteDoc(id)))
  documents.value = documents.value.filter((doc) => !deletingIdSet.has(doc.id))
  selectedDocumentIds.value = new Set(
    Array.from(selectedDocumentIds.value).filter((id) => !deletingIdSet.has(id))
  )
  pendingDeleteDocumentIds.value = []
  await persistDocumentSortOrders()
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
    const sortOrder = documents.value.length + index + 1
    const createdDoc = await createDoc({
      workspaceId: Number(workspaceId.value),
      title: shot.name,
      description,
      status: '작업대기',
      orgnImgPath: shot.imgPath ?? '',
      drawImgPath: '',
      sortOrder,
      docMetaJson: JSON.stringify({
        writer: '담당자',
        entry_path: ''
      }),
      contentJson: '[]',
      annotationJson: '[]'
    })

    if (createdDoc === null) continue

    documents.value.push({
      id: createdDoc.id,
      title: shot.name,
      description,
      thumbnail: createdDoc.orgnImgPath ? toFileSrc(createdDoc.orgnImgPath) : shot.src,
      status: '작업대기',
      updatedAt: dateStr,
      updatedTime: now.getTime(),
      functionCount: 0,
      sortOrder
    })
  }

  selectedIds.value = new Set()
}

// --- serch ---

const filteredScreenshots = computed(() => {
  const keyword = screenshotSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return screenshots.value

  return screenshots.value.filter((item) =>
    String(item.name ?? '')
      .toLowerCase()
      .includes(keyword)
  )
})

const filteredDocuments = computed(() => {
  if (isEditMode.value) return documents.value

  const keyword = documentSearchKeyword.value.trim().toLowerCase()
  const filtered = keyword
    ? documents.value.filter((doc) =>
        [doc.title, doc.description, doc.status].some((text) =>
          String(text ?? '')
            .toLowerCase()
            .includes(keyword)
        )
      )
    : documents.value

  return [...filtered].sort((a, b) => {
    if (documentSortMode.value === 'custom') {
      return a.sortOrder - b.sortOrder
    }

    if (documentSortMode.value === 'functionCount') {
      return b.functionCount - a.functionCount || b.updatedTime - a.updatedTime
    }

    return b.updatedTime - a.updatedTime
  })
})

watch(screenshotSearchKeyword, () => {
  selectedIds.value = new Set()
})

watch(documentSearchKeyword, () => {
  selectedDocumentIds.value = new Set()
})

const resetWorkspaceState = (): void => {
  workspaceName.value = ''
  projectId.value = null
  screenshots.value = []
  documents.value = []
  selectedIds.value = new Set()
  selectedDocumentIds.value = new Set()
  pendingDeleteDocumentIds.value = []
  draggingDocumentId.value = null
  dragOverDocumentId.value = null
  transferWorkspaces.value = []
  targetWorkspaceId.value = null
  isWorkspaceMenuOpen.value = false
}

const loadPage = (): void => {
  void loadWorkspaceDetail()
  void loadCaptureList()
  void loadDocList()
}

watch(workspaceId, () => {
  resetWorkspaceState()
  loadPage()
})

onMounted(() => {
  console.log('workspaceId:', workspaceId.value)
  loadPage()
})
</script>
