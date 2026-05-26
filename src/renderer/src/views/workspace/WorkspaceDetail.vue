<template>
  <div class="flex h-screen flex-col bg-base-200">
    <header
      class="navbar relative z-[1100] shrink-0 border-b border-base-content/10 bg-base-100 px-4"
    >
      <div class="flex flex-1 items-center gap-3">
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost btn-sm btn-circle" @click="goBackToProject">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="dropdown dropdown-bottom">
            <button
              tabindex="0"
              type="button"
              class="flex h-auto min-h-0 items-center gap-3 rounded-md px-1 py-1 normal-case transition hover:bg-base-200/60"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <i-lucide-briefcase class="h-4 w-4 text-primary" />
              </div>
              <div class="min-w-0 text-left">
                <div class="text-sm font-bold leading-tight">워크스페이스</div>
                <div class="max-w-44 truncate text-xs leading-tight text-base-content/45">
                  {{ workspaceName || '현재 워크스페이스' }}
                </div>
              </div>
              <span class="flex h-5 w-5 items-center justify-center">
                <i-lucide-chevron-down class="h-3.5 w-3.5 text-base-content/35" />
              </span>
            </button>
            <ul
              tabindex="-1"
              class="dropdown-content menu z-[1200] mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-1 shadow-xl"
            >
              <li v-if="workspaceList.length === 0">
                <span class="text-sm text-base-content/50">워크스페이스가 없습니다.</span>
              </li>
              <li v-for="workspace in workspaceList" :key="workspace.id">
                <button
                  type="button"
                  class="rounded-lg"
                  :class="Number(workspaceId) === workspace.id ? 'bg-primary/10 text-primary' : ''"
                  @click="goWorkspace(workspace.id, $event)"
                >
                  <div
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15"
                  >
                    <i-lucide-briefcase class="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div class="min-w-0 flex-1 text-left">
                    <div class="truncate text-sm font-semibold">{{ workspace.name }}</div>
                    <div class="text-xs text-base-content/45">워크스페이스</div>
                  </div>
                  <span
                    v-if="Number(workspaceId) === workspace.id"
                    class="badge badge-primary badge-xs"
                  >
                    현재
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 gap-5 overflow-hidden bg-base-200 px-3 pt-4 text-[#111827]">
      <aside
        class="flex w-[20%] shrink-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100/70 shadow-sm"
      >
        <div class="flex h-15 items-center justify-between border-b border-[#ece8eb] px-7">
          <div class="flex min-w-0 items-center gap-2">
            <h2 class="text-xl font-black leading-none tracking-tight">스크린샷</h2>
            <span
              class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-black leading-none text-white"
            >
              {{ screenshots.length }}
            </span>
          </div>
          <div class="dropdown dropdown-end">
            <button
              type="button"
              tabindex="0"
              class="tooltip tooltip-bottom flex h-8 w-8 items-center justify-center rounded-md bg-base text-white shadow-sm transition hover:bg-white"
              data-tip="캡쳐 메뉴"
            >
              <i-lucide-list class="h-4 w-4 text-black" />
            </button>
            <ul
              tabindex="0"
              class="menu dropdown-content z-30 mt-2 w-44 rounded-lg border border-base-300 bg-base-100 p-1 shadow-xl"
            >
              <li>
                <button type="button" class="gap-2 text-xs font-semibold" @click="openPicker">
                  <i-lucide-image-plus class="h-4 w-4" />
                  이미지 불러오기
                </button>
              </li>
              <li>
                <router-link
                  :to="{ name: 'capture-index', params: { workspaceId } }"
                  class="gap-2 text-xs font-semibold"
                >
                  <i-lucide-camera class="h-4 w-4" />
                  웹 화면 캡쳐
                </router-link>
              </li>
              <li>
                <router-link
                  :to="{ name: 'video-capture-index', params: { workspaceId } }"
                  class="gap-2 text-xs font-semibold"
                >
                  <i-lucide-video class="h-4 w-4" />
                  동영상 캡쳐
                </router-link>
              </li>
            </ul>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              @change="importImages"
            />
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col px-5 py-3">
          <label class="input input-sm mx-auto h-8 w-[288px] rounded-md bg-white shadow-sm">
            <i-lucide-search class="h-3.5 w-3.5 text-slate-500" />
            <input v-model="shotQuery" type="search" placeholder="스크린샷 검색..." />
          </label>

          <div
            ref="gridContainerRef"
            class="relative mt-3 min-h-0 flex-1 overflow-y-auto select-none"
            @mousedown="onMouseDown"
          >
            <div class="grid grid-cols-[repeat(2,140px)] justify-center gap-x-2 gap-y-3">
              <div
                v-for="shot in shotList"
                :key="shot.id"
                :data-shot-id="shot.id"
                class="group w-full max-w-[150px] cursor-pointer rounded-lg p-1.5 transition-colors"
                :class="[
                  selectedIds.has(shot.id)
                    ? 'bg-primary/10 ring-2 ring-primary/40 ring-inset'
                    : 'hover:bg-base-200'
                ]"
                :draggable="selectedIds.has(shot.id)"
                @click.stop="onClickItem(shot.id, $event)"
                @contextmenu.prevent.stop="openShotContextMenu($event, shot)"
                @dragstart="onDragStart(shot.id, $event)"
                @dragend="onDragEnd"
              >
                <div
                  class="relative overflow-hidden rounded-lg border border-base-content/20 bg-base-100 shadow-sm"
                  :class="selectedIds.has(shot.id) ? 'border-primary/60' : ''"
                >
                  <img
                    :src="shot.src"
                    alt="screenshot"
                    class="pointer-events-none h-20 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div
                    class="absolute inset-0 flex items-center justify-center rounded-lg transition-colors"
                    :class="
                      selectedIds.has(shot.id)
                        ? 'bg-primary/10'
                        : 'bg-black/0 group-hover:bg-black/25'
                    "
                  >
                    <button
                      type="button"
                      class="btn btn-circle btn-xs border-none bg-white/90 text-base-content opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                      @click.stop="openShotModal(shot.id)"
                    >
                      <i-lucide-eye class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <input
                  v-if="editingShotId === shot.id"
                  v-model="editingShotName"
                  type="text"
                  class="input input-primary input-xs mt-1.5 h-6 w-full px-1 text-center text-xs font-medium"
                  @click.stop
                  @mousedown.stop
                  @blur="confirmEditShotName"
                  @keydown.enter.prevent="confirmEditShotName"
                  @keydown.esc.prevent="cancelEditShotName"
                />
                <div
                  v-else
                  class="mt-1.5 truncate px-0.5 text-center text-xs font-medium leading-tight"
                  :class="selectedIds.has(shot.id) ? 'text-primary' : 'text-base-content/70'"
                >
                  {{ shot.name }}
                </div>
              </div>
            </div>

            <div
              v-if="isDragging"
              class="pointer-events-none absolute z-20 border-2 border-primary/60 bg-primary/10"
              :style="selectionStyle"
            />
          </div>
        </div>
      </aside>

      <main
        class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-base-200 px-3 transition-colors duration-150"
        :class="isOverDropZone ? 'bg-primary/5' : ''"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div
          v-if="isOverDropZone"
          class="pointer-events-none absolute inset-x-6 bottom-6 top-24 z-30 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5"
        >
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <i-lucide-file-plus class="h-7 w-7 text-primary" />
          </div>
          <span class="text-sm font-bold text-primary">여기에 놓아서 문서를 생성하세요</span>
          <span v-if="draggingCount > 0" class="text-xs text-primary/70">
            {{ draggingCount }}개의 스크린샷
          </span>
        </div>

        <div class="pb-6 pt-3">
          <div
            class="flex flex-wrap items-start justify-between gap-4 border-b border-base-content/10 pb-3"
          >
            <div class="min-w-0">
              <h1 class="truncate text-2xl font-black leading-tight tracking-tight">매뉴얼 문서</h1>
            </div>
            <button
              type="button"
              class="btn btn-sm h-8 min-h-0 rounded-md border-0 bg-black px-5 text-xs font-black text-white hover:bg-neutral-800"
              @click="toggleEditMode"
            >
              <i-lucide-pencil class="h-4 w-4" />
              {{ isEditMode ? '완료' : '편집 모드' }}
            </button>
          </div>

          <div v-if="!isEditMode" class="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div
              class="flex h-8 items-center gap-1 rounded-md bg-[#e8e5e8] p-1 text-[11px] font-black text-slate-500"
            >
              <button
                type="button"
                class="h-6 rounded px-2.5 transition-colors"
                :class="docFilter === 'all' ? 'bg-white text-black shadow-sm' : 'hover:text-black'"
                @click="docFilter = 'all'"
              >
                전체
                <span class="tabular-nums">{{ docTotal }}</span>
              </button>
              <button
                type="button"
                class="h-6 rounded px-2.5 transition-colors"
                :class="
                  docFilter === 'doing' ? 'bg-white text-black shadow-sm' : 'hover:text-black'
                "
                @click="docFilter = 'doing'"
              >
                작업중
                <span class="tabular-nums">{{ doingCount }}</span>
              </button>
              <button
                type="button"
                class="h-6 rounded px-2.5 transition-colors"
                :class="docFilter === 'done' ? 'bg-white text-black shadow-sm' : 'hover:text-black'"
                @click="docFilter = 'done'"
              >
                작업완료
                <span class="tabular-nums">{{ doneCount }}</span>
              </button>
            </div>

            <label class="input input-sm h-8 w-72 rounded-md border-[#d8d7dd] bg-white shadow-sm">
              <i-lucide-search class="h-3.5 w-3.5 text-slate-500" />
              <input v-model="docQuery" type="search" placeholder="문서 검색..." />
            </label>
          </div>
        </div>

        <div v-if="isEditMode" class="flex items-center justify-end pb-3">
          <button
            type="button"
            class="btn btn-sm h-8 min-h-0 rounded-md border-[#d8d7dd] bg-white"
            @click="toggleAllDocs"
          >
            {{ allDocsSelected ? '전체 해제' : '전체 선택' }}
          </button>
        </div>

        <div class="relative flex-1 overflow-y-auto pb-8">
          <div
            v-show="docList.length > 0"
            ref="docGridRef"
            class="grid grid-cols-[repeat(auto-fill,280px)] justify-start gap-3"
          >
            <component
              :is="isEditMode ? 'div' : 'router-link'"
              v-for="(doc, index) in docList"
              :key="doc.id"
              :to="!isEditMode ? `/workspace/${workspaceId}/documents/${doc.id}` : undefined"
              class="doc-card group overflow-hidden rounded-lg border border-[#d8d7dd] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:shadow-md"
              :class="[
                isEditMode ? 'cursor-move' : 'cursor-pointer',
                docIds.has(doc.id) ? 'border-2 border-primary shadow-lg shadow-primary/20' : ''
              ]"
              @click="clickDocCard(doc.id, $event)"
              @contextmenu="openDocMenu(doc, $event)"
            >
              <figure class="relative overflow-hidden bg-slate-100">
                <div
                  class="absolute left-2 top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded bg-black px-1.5 text-[10px] font-black tabular-nums text-white shadow-sm"
                >
                  {{ index + 1 }}
                </div>
                <img
                  :src="doc.thumbnail"
                  alt="thumbnail"
                  class="h-[170px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-0 transition-colors duration-150"
                  :class="
                    docIds.has(doc.id)
                      ? 'bg-primary/20'
                      : 'bg-gradient-to-t from-black/25 to-transparent'
                  "
                />
              </figure>
              <div class="min-w-0 space-y-1.5 px-3 py-2">
                <div class="flex min-w-0 items-center justify-between gap-2">
                  <h3 class="min-w-0 flex-1 truncate text-sm font-black leading-tight text-black">
                    {{ getDocTitle(doc) }}
                  </h3>
                  <div
                    class="badge badge-xs shrink-0 border-0 font-black"
                    :class="docStatusClass(doc)"
                  >
                    {{ docStatusText(doc) }}
                  </div>
                </div>
                <p class="truncate text-xs leading-relaxed text-slate-500">
                  {{ getDocDescription(doc) }}
                </p>
              </div>
              <div class="flex items-center justify-between border-t border-[#d8d7dd] px-3 py-2">
                <div class="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <i-lucide-clock class="h-3 w-3" />
                  {{ getDocUpdatedAtText(doc) }}
                </div>
                <div
                  class="rounded border px-2 py-1 text-[10px] font-black"
                  :class="
                    doc.functionCount > 0
                      ? 'border-primary/10 bg-primary/10 text-primary'
                      : 'border-[#d8d7dd] bg-[#f1f1f4] text-slate-600'
                  "
                >
                  {{ doc.functionCount }} {{ doc.functionCount <= 1 ? 'Step' : 'Steps' }}
                </div>
              </div>
            </component>
          </div>

          <div
            v-if="docList.length === 0"
            class="flex h-full flex-col items-center justify-center gap-3 text-slate-400"
          >
            <i-lucide-file-x class="h-12 w-12" />
            <span class="text-sm font-medium">
              {{
                docQuery || docFilter !== 'all'
                  ? '조건에 맞는 문서가 없습니다'
                  : '스크린샷을 드래그하여 문서를 생성하세요'
              }}
            </span>
          </div>
        </div>
      </main>
    </div>

    <ModalCaptureImages
      ref="shotModalRef"
      :capture-image-items="screenshots"
      :selected-image-ids="selectedShotIds"
      title="캡쳐 이미지"
      @on-toggle-select-image="toggleShot"
      @on-rename-image="renameShot"
      @on-remove-image="removeShot"
    />
    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="confirmDeleteDocs">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">선택한 문서 {{ deleteDocIds.length }}개를</h3>
          <p class="text-sm text-gray-500">정말 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>
    <ModalConfirm ref="shotDeleteConfirmRef" ok-text="삭제" @on-confirm="confirmDeleteShot">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ deletingShot?.name }}</h3>
          <p class="text-sm text-gray-500">스크린샷을 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>

    <ModalBase
      ref="actionModalRef"
      :title="docAction === 'copy' ? '문서 복사' : '문서 이동'"
      width="w-[28rem]"
      :close-on-backdrop="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-base-content/60">
          선택한 문서 {{ docIds.size }}개를
          {{ docAction === 'copy' ? '복사할' : '이동할' }} 워크스페이스를 선택하세요.
        </p>

        <div class="form-control relative w-full">
          <div class="label">
            <span class="label-text text-xs text-base-content/60">대상 워크스페이스</span>
          </div>
          <button
            type="button"
            class="select select-bordered flex w-full items-center justify-between text-left"
            :disabled="targetWorkspaces.length === 0"
            @click="targetWorkspaceMenuOpen = !targetWorkspaceMenuOpen"
          >
            <span :class="targetWorkspaceId == null ? 'text-base-content/40' : ''">
              {{ targetWorkspaceLabel }}
            </span>
          </button>
          <ul
            v-if="targetWorkspaceMenuOpen && targetWorkspaces.length > 0"
            class="menu absolute left-0 top-full z-[1200] mt-1 max-h-48 w-full min-w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
          >
            <li v-for="workspace in targetWorkspaces" :key="workspace.id">
              <button
                type="button"
                class="rounded-md text-sm"
                :class="targetWorkspaceId === workspace.id ? 'bg-primary/10 text-primary' : ''"
                @click="chooseTargetWorkspace(workspace.id)"
              >
                {{ workspace.name }}
              </button>
            </li>
          </ul>
          <div v-if="targetWorkspaces.length === 0" class="label">
            <span class="label-text-alt text-error">
              이동하거나 복사할 다른 워크스페이스가 없습니다.
            </span>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="isActioning" @click="close">
            취소
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="targetWorkspaceId == null || docIds.size === 0 || isActioning"
            @click="confirmDocAction(close)"
          >
            {{ docAction === 'copy' ? '복사' : '이동' }}
          </button>
        </div>
      </template>
    </ModalBase>

    <div v-if="actionMsg" class="toast toast-end toast-bottom z-[1000]">
      <div class="alert border border-primary/20 bg-base-100 shadow-xl">
        <i-lucide-check-circle class="h-5 w-5 text-primary" />
        <span class="text-sm">{{ actionMsg }}</span>
        <button type="button" class="btn btn-primary btn-xs" @click="goActionWorkspace">
          보기
        </button>
        <button type="button" class="btn btn-ghost btn-xs" @click="clearActionMsg">닫기</button>
      </div>
    </div>

    <div
      v-if="docMenu.visible"
      class="fixed z-[1000] w-48 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl"
      :style="{ left: `${docMenu.x}px`, top: `${docMenu.y}px` }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <div class="px-3 py-2 text-xs font-semibold text-base-content/50">
        {{ docIds.size }}개 선택됨
      </div>
      <div class="flex flex-col gap-1">
        <!-- Order in this block controls menu order -->
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start"
          @click="runDocAction('copy')"
        >
          <i-lucide-copy class="h-4 w-4 opacity-60" />
          복사
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start"
          @click="runDocAction('move')"
        >
          <i-lucide-folder-input class="h-4 w-4 opacity-60" />
          이동
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start text-error hover:bg-error/10"
          @click="runDocDelete"
        >
          <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
          삭제
        </button>
      </div>
    </div>

    <div
      v-if="shotMenu.visible"
      class="fixed z-[1000] w-40 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-xl"
      :style="{ left: `${shotMenu.x}px`, top: `${shotMenu.y}px` }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start"
          @click="editContextShot"
        >
          <i-lucide-pencil class="h-4 w-4 opacity-60" />
          수정
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start text-error hover:bg-error/10"
          @click="deleteContextShot"
        >
          <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
          삭제
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
import { useContextMenu } from '@renderer/composables/useContextMenu'
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
  updateCaptureName,
  updateDocSortOrders
} from '@/database'

const route = useRoute()
const router = useRouter()

const workspaceId = computed(() => route.params.id)
const workspaceName = ref('')
const projectId = ref<number | null>(null)
const workspaceList = ref<Workspace[]>([])
const shotQuery = ref('')
const docQuery = ref('')
const docFilter = ref<'all' | 'doing' | 'done'>('all')

const fileInputRef = ref<HTMLInputElement | null>(null)

// --- Screenshot Data ---

interface Screenshot {
  id: number
  name: string
  src: string
  imgPath?: string
}

const screenshots = ref<Screenshot[]>([])
const shotModalRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)
const shotDeleteConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const {
  contextMenu: shotMenu,
  selectedItem: selectedShotMenuItem,
  openContextMenu: openShotMenu,
  closeContextMenu: closeShotMenu
} = useContextMenu<Screenshot>()
const deletingShot = ref<Screenshot | null>(null)
const editingShotId = ref<number | null>(null)
const editingShotName = ref('')

const readFileUrl = (file: File): Promise<string> =>
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

const loadShots = async (): Promise<void> => {
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

const loadWorkspace = async (): Promise<void> => {
  const detail = await getWorkspaceDetail(String(workspaceId.value))
  workspaceName.value = detail?.name ?? ''
  projectId.value = detail?.project_id ?? null
  await loadWorkspaceList()
}

const goBackToProject = (): void => {
  if (projectId.value == null) {
    void router.push({ name: 'home' })
    return
  }

  void router.push({ name: 'projects-index', params: { id: projectId.value } })
}

const loadWorkspaceList = async (): Promise<void> => {
  if (projectId.value == null) {
    workspaceList.value = []
    return
  }

  workspaceList.value = await getWorkspaces({
    project_id: projectId.value,
    limit: 100,
    offset: 0
  })
}

const goWorkspace = async (nextId: number, event?: MouseEvent): Promise<void> => {
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
  if (event?.currentTarget instanceof HTMLElement) event.currentTarget.blur()
  if (nextId === Number(workspaceId.value)) return

  await router.push({ name: 'workspace-detail', params: { id: nextId } })
}

const openShotModal = (imageId: number): void => {
  shotModalRef.value?.onOpen(imageId)
}

const openShotContextMenu = (event: MouseEvent, shot: Screenshot): void => {
  openShotMenu(event, shot)
}

const editContextShot = (): void => {
  const shot = selectedShotMenuItem.value
  closeShotMenu()
  if (!shot) return

  editingShotId.value = shot.id
  editingShotName.value = shot.name
}

const deleteContextShot = (): void => {
  const shot = selectedShotMenuItem.value
  closeShotMenu()
  if (!shot) return

  deletingShot.value = shot
  shotDeleteConfirmRef.value?.onOpen()
}

const confirmDeleteShot = (): void => {
  const shot = deletingShot.value
  deletingShot.value = null
  if (!shot) return

  void removeShot(shot.id)
}

const cancelEditShotName = (): void => {
  editingShotId.value = null
  editingShotName.value = ''
}

const confirmEditShotName = async (): Promise<void> => {
  const id = editingShotId.value
  if (id === null) return

  const name = editingShotName.value.trim()
  const target = screenshots.value.find((item) => item.id === id)
  cancelEditShotName()
  if (!target || !name || name === target.name) return

  await renameShot({ id, name })
}

const openPicker = (): void => {
  fileInputRef.value?.click()
}

const importImages = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (!files.length || !workspaceId.value) return

  for (const file of files) {
    const dataUrl = await readFileUrl(file)
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

const toggleShot = (imageId: number): void => {
  const nextSelectedIds = new Set(selectedIds.value)

  if (nextSelectedIds.has(imageId)) {
    nextSelectedIds.delete(imageId)
  } else {
    nextSelectedIds.add(imageId)
  }

  selectedIds.value = nextSelectedIds
}

const removeShot = async (imageId: number): Promise<void> => {
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

const renameShot = async ({ id, name }: { id: number; name: string }): Promise<void> => {
  const nextName = name.trim()
  if (!nextName) return

  await updateCaptureName({
    id,
    name: nextName
  })

  screenshots.value = screenshots.value.map((item) =>
    item.id === id ? { ...item, name: nextName } : item
  )
  await loadShots()
}

// --- Drag Select ---

const gridContainerRef = ref<HTMLElement | null>(null)
const shotIds = computed(() => shotList.value.map((s) => s.id))

const { selectedIds, isDragging, selectionStyle, onMouseDown, onClickItem, cancelDrag } =
  useDragSelect({
    containerRef: gridContainerRef,
    dataAttr: 'shot-id',
    itemIds: shotIds,
    toggleOnClick: true
  })

const selectedShotIds = computed(() => Array.from(selectedIds.value))

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

const EMPTY_DOC_TITLE = '제목 없는 문서'
const EMPTY_DOC_DESCRIPTION = '문서 설명을 아직 작성하지 않았습니다.'
const ONE_MINUTE_MS = 60 * 1000
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const documents = ref<Document[]>([])
const nowTime = ref(Date.now())
let relativeTimeTimer: ReturnType<typeof setInterval> | null = null
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const actionModalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const {
  contextMenu: docMenu,
  openContextMenu: openMenu,
  closeContextMenu: closeMenu
} = useContextMenu<Document>()
const deleteDocIds = ref<number[]>([])
const isEditMode = ref(false)
const docIds = ref<Set<number>>(new Set())
const docGridRef = ref<HTMLElement | null>(null)
const docAction = ref<'copy' | 'move'>('copy')
const actionWorkspaces = ref<Workspace[]>([])
const targetWorkspaceId = ref<number | null>(null)
const targetWorkspaceMenuOpen = ref(false)
const isActioning = ref(false)
const actionMsg = ref('')
const actionWorkspaceId = ref<number | null>(null)

const targetWorkspaces = computed(() =>
  actionWorkspaces.value.filter((workspace) => workspace.id !== Number(workspaceId.value))
)

const targetWorkspaceLabel = computed(() => {
  const selectedWorkspace = targetWorkspaces.value.find(
    (workspace) => workspace.id === targetWorkspaceId.value
  )
  if (selectedWorkspace) return selectedWorkspace.name
  if (targetWorkspaces.value.length === 0) return '이동하거나 복사할 다른 워크스페이스가 없습니다.'
  return '워크스페이스 선택'
})

const getDocTitle = (doc: Document): string => doc.title.trim() || EMPTY_DOC_TITLE

const getDocDescription = (doc: Document): string => doc.description.trim() || EMPTY_DOC_DESCRIPTION

const getDocUpdatedAtText = (doc: Document): string => {
  if (!doc.updatedTime) return doc.updatedAt

  const diff = nowTime.value - doc.updatedTime
  if (diff >= 0 && diff < ONE_DAY_MS) {
    if (diff < ONE_MINUTE_MS) return '방금 전'
    if (diff < ONE_HOUR_MS) return `${Math.floor(diff / ONE_MINUTE_MS)}분 전`
    return `${Math.floor(diff / ONE_HOUR_MS)}시간 전`
  }

  return doc.updatedAt
}

const updateRelativeNow = (): void => {
  nowTime.value = Date.now()
}

const fmtDocDate = (dateText: string): string => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText

  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const docTime = (dateText: string): number => {
  const time = new Date(dateText).getTime()
  return Number.isNaN(time) ? 0 : time
}

const countFuncs = (contentJson: string | null | undefined): number => {
  if (!contentJson) return 0

  try {
    const parsed = JSON.parse(contentJson)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

const isDoneDoc = (doc: Document): boolean => doc.status === '작업완료'

const docStatusText = (doc: Document): string => (isDoneDoc(doc) ? '작업완료' : '작업중')

const docStatusClass = (doc: Document): string =>
  isDoneDoc(doc)
    ? 'border-success/20 bg-success/10 text-success'
    : 'border-info/20 bg-info/10 text-info'

const docTotal = computed(() => documents.value.length)
const doneCount = computed(() => documents.value.filter(isDoneDoc).length)
const doingCount = computed(() => docTotal.value - doneCount.value)

const loadDocs = async (): Promise<void> => {
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
      updatedAt: fmtDocDate(doc.updated_at),
      updatedTime: docTime(doc.updated_at),
      functionCount: countFuncs(doc.content_json),
      sortOrder: doc.sort_order
    }
  })
  updateRelativeNow()
}

const toggleEditMode = (): void => {
  isEditMode.value = !isEditMode.value
  docIds.value = new Set()
  deleteDocIds.value = []
  closeMenu()
}

const toggleDoc = (docId: number): void => {
  const next = new Set(docIds.value)
  if (next.has(docId)) {
    next.delete(docId)
  } else {
    next.add(docId)
  }
  docIds.value = next
}

const clickDocCard = (docId: number, event: Event): void => {
  if (!isEditMode.value) return
  event.preventDefault()
  event.stopPropagation()
  toggleDoc(docId)
}

const openDocMenu = (doc: Document, event: MouseEvent): void => {
  if (!isEditMode.value) return
  event.preventDefault()
  event.stopPropagation()

  if (!docIds.value.has(doc.id)) {
    docIds.value = new Set([doc.id])
  }

  openMenu(event, doc)
}

const allDocsSelected = computed(() => {
  if (docList.value.length === 0) return false
  return docList.value.every((doc) => docIds.value.has(doc.id))
})

const toggleAllDocs = (): void => {
  if (allDocsSelected.value) {
    docIds.value = new Set()
    return
  }
  docIds.value = new Set(docList.value.map((doc) => doc.id))
}

const saveDocOrder = async (): Promise<void> => {
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

const openDeleteConfirm = (): void => {
  const idsToDelete = Array.from(docIds.value)
  if (idsToDelete.length === 0) return
  deleteDocIds.value = idsToDelete
  modalConfirmRef.value?.onOpen()
}

const runDocAction = (action: 'copy' | 'move'): void => {
  closeMenu()
  void openDocAction(action)
}

const runDocDelete = (): void => {
  closeMenu()
  openDeleteConfirm()
}

const openDocAction = async (action: 'copy' | 'move'): Promise<void> => {
  if (docIds.value.size === 0 || projectId.value == null) return

  docAction.value = action
  targetWorkspaceId.value = null
  targetWorkspaceMenuOpen.value = false
  actionWorkspaces.value = await getWorkspaces({
    project_id: projectId.value,
    limit: 100,
    offset: 0
  })
  actionModalRef.value?.onOpen()
}

const chooseTargetWorkspace = (workspaceId: number): void => {
  targetWorkspaceId.value = workspaceId
  targetWorkspaceMenuOpen.value = false
}

const confirmDocAction = async (close: () => void): Promise<void> => {
  if (targetWorkspaceId.value == null || docIds.value.size === 0) return

  const ids = Array.from(docIds.value)
  const action = docAction.value
  const nextWorkspaceId = targetWorkspaceId.value
  isActioning.value = true

  try {
    const params = {
      docIds: ids,
      workspaceId: nextWorkspaceId
    }
    const success = action === 'copy' ? await copyDocs(params) : await moveDocs(params)
    if (!success) return

    if (action === 'move') {
      const movedIdSet = new Set(ids)
      documents.value = documents.value.filter((doc) => !movedIdSet.has(doc.id))
      await saveDocOrder()
    }

    docIds.value = new Set()
    actionWorkspaceId.value = nextWorkspaceId
    actionMsg.value = `문서 ${ids.length}개를 ${action === 'copy' ? '복사' : '이동'}했습니다.`
    close()
  } finally {
    isActioning.value = false
  }
}

const clearActionMsg = (): void => {
  actionMsg.value = ''
  actionWorkspaceId.value = null
}

const goActionWorkspace = async (): Promise<void> => {
  const nextWorkspaceId = actionWorkspaceId.value
  if (nextWorkspaceId == null) return

  clearActionMsg()
  await router.push({ name: 'workspace-detail', params: { id: nextWorkspaceId } })
}

const confirmDeleteDocs = async (): Promise<void> => {
  if (deleteDocIds.value.length === 0) return

  const deletingIdSet = new Set(deleteDocIds.value)
  await Promise.all(deleteDocIds.value.map((id) => deleteDoc(id)))
  documents.value = documents.value.filter((doc) => !deletingIdSet.has(doc.id))
  docIds.value = new Set(Array.from(docIds.value).filter((id) => !deletingIdSet.has(id)))
  deleteDocIds.value = []
  await saveDocOrder()
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
    void createDocsFromShots(droppedIds)
  }
})

const createDocsFromShots = async (droppedIds: number[]): Promise<void> => {
  const droppedShots = droppedIds
    .map((id) => screenshots.value.find((s) => s.id === id))
    .filter(Boolean) as Screenshot[]

  const pad = (n: number): string => String(n).padStart(2, '0')
  const now = new Date()
  const dateStr = `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  for (const [index, shot] of droppedShots.entries()) {
    const description = `${shot.name}에 대한 화면 설명입니다.`
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

const shotList = computed(() => {
  const keyword = shotQuery.value.trim().toLowerCase()
  if (!keyword) return screenshots.value

  return screenshots.value.filter((item) =>
    String(item.name ?? '')
      .toLowerCase()
      .includes(keyword)
  )
})

const docList = computed(() => {
  if (isEditMode.value) return documents.value

  const keyword = docQuery.value.trim().toLowerCase()
  const byStatus = documents.value.filter((doc) => {
    if (docFilter.value === 'done') return isDoneDoc(doc)
    if (docFilter.value === 'doing') return !isDoneDoc(doc)
    return true
  })

  const filtered = keyword
    ? byStatus.filter((doc) =>
        [doc.title, doc.description, doc.status].some((text) =>
          String(text ?? '')
            .toLowerCase()
            .includes(keyword)
        )
      )
    : byStatus

  return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder)
})

const docDraggable = useDraggable(docGridRef, documents, {
  animation: 150,
  draggable: '.doc-card',
  disabled: !isEditMode.value,
  customUpdate: (event) => {
    const { oldIndex, newIndex } = event
    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      oldIndex === newIndex ||
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return
    }

    const nextDocuments = [...documents.value]
    const [movedDoc] = nextDocuments.splice(oldIndex, 1)
    if (!movedDoc) return

    nextDocuments.splice(newIndex, 0, movedDoc)
    documents.value = nextDocuments
    void saveDocOrder()
  }
})

watch(isEditMode, (enabled) => {
  docDraggable.option('disabled', !enabled)
})

watch(shotQuery, () => {
  selectedIds.value = new Set()
})

watch(docQuery, () => {
  docIds.value = new Set()
})

watch(docFilter, () => {
  docIds.value = new Set()
})

const resetState = (): void => {
  workspaceName.value = ''
  projectId.value = null
  workspaceList.value = []
  docFilter.value = 'all'
  screenshots.value = []
  documents.value = []
  selectedIds.value = new Set()
  docIds.value = new Set()
  deleteDocIds.value = []
  actionWorkspaces.value = []
  targetWorkspaceId.value = null
  targetWorkspaceMenuOpen.value = false
}

const loadPage = (): void => {
  void loadWorkspace()
  void loadShots()
  void loadDocs()
}

watch(workspaceId, () => {
  resetState()
  loadPage()
})

onMounted(() => {
  console.log('workspaceId:', workspaceId.value)
  updateRelativeNow()
  relativeTimeTimer = setInterval(updateRelativeNow, 60_000)
  loadPage()
})

onUnmounted(() => {
  if (!relativeTimeTimer) return

  clearInterval(relativeTimeTimer)
  relativeTimeTimer = null
})
</script>
