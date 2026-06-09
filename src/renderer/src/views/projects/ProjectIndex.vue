<template>
  <div class="flex h-screen flex-col bg-base-200">
    <!-- Hero Banner -->
    <div class="relative shrink-0">
      <img
        v-if="projectThumbnail"
        class="h-48 w-full object-cover"
        :src="projectThumbnail"
        alt="project banner"
        loading="lazy"
      />
      <DefaultThumbnail
        v-else
        :id="Number(route.params.id)"
        :label="curProject?.name"
        class="h-48 w-full"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />

      <!-- Top Bar -->
      <div class="absolute inset-x-0 top-0 z-10">
        <div class="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <button
            class="inline-flex items-center gap-1.5 bg-transparent px-1 py-1 text-sm font-bold text-white/75 transition-colors hover:text-white"
            @click="router.push('/')"
          >
            <i-lucide-arrow-left class="h-4 w-4" />
            프로젝트 목록
          </button>
          <div class="dropdown dropdown-end">
            <div
              tabindex="0"
              role="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/80 transition hover:text-white hover:shadow-md hover:shadow-black/25"
            >
              <i-lucide-more-vertical class="h-4 w-4" />
            </div>
            <ul
              tabindex="-1"
              class="dropdown-content menu z-10 w-48 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-lg"
            >
              <li>
                <a v-blur class="rounded-lg text-sm" @click="onEditProject">
                  <i-lucide-pencil class="h-4 w-4 opacity-60" />
                  프로젝트 수정
                </a>
              </li>
              <li>
                <a v-blur class="rounded-lg text-sm text-error" @click="onDeleteProject">
                  <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
                  프로젝트 삭제
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Project Info -->
      <div class="absolute inset-x-0 bottom-0 z-10 pb-5">
        <div class="mx-auto max-w-[1200px] px-4 text-center">
          <h1 v-if="projectThumbnail" class="mb-1.5 text-2xl font-bold text-white drop-shadow-md">
            {{ curProject?.name }}
          </h1>
          <p class="text-sm text-white/70">
            {{ curProject?.description || '프로젝트 설명을 아직 작성하지 않았습니다' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Project Content Tabs -->
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[1200px] px-6 py-6">
        <div class="tabs tabs-lift">
          <label class="tab gap-2">
            <input
              v-model="activeProjectTab"
              type="radio"
              name="project_detail_tabs"
              value="workspaces"
            />
            <span class="grid h-4 w-4 grid-cols-2 gap-0.5 text-primary" aria-hidden="true">
              <span class="rounded-[1px] border-2 border-current"></span>
              <span class="rounded-[1px] border-2 border-current"></span>
              <span class="rounded-[1px] border-2 border-current"></span>
              <span class="rounded-[1px] border-2 border-current"></span>
            </span>
            워크스페이스
          </label>
          <div class="tab-content min-h-[calc(100vh-18rem)] border-base-300 bg-base-100 p-6">
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  class="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-content/15 bg-base-100/50 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
                  @click="onCreateWorkspace"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-base-content/10"
                  >
                    <i-lucide-plus class="h-5 w-5 text-base-content/40" />
                  </div>
                  <span class="text-sm font-bold text-base-content/40">새 워크스페이스</span>
                </button>

                <!-- Workspace Cards -->
                <router-link
                  v-for="ws in filteredWorkspaces"
                  :key="ws.id"
                  :to="`/workspace/${ws.id}`"
                  class="group block overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  @contextmenu.prevent.stop="openWorkspaceContextMenu(ws, $event)"
                >
                  <div class="relative h-44 overflow-hidden">
                    <img
                      v-if="ws.thumbnail"
                      :src="ws.thumbnail"
                      alt="workspace thumbnail"
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <DefaultThumbnail
                      v-else
                      :id="ws.id"
                      :label="ws.name"
                      class="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      v-if="ws.thumbnail"
                      class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                    />
                    <div v-if="ws.thumbnail" class="absolute inset-x-0 bottom-0 p-4">
                      <div class="text-lg font-bold text-white drop-shadow-md">{{ ws.name }}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-1 text-xs text-base-content/40">
                      <i-lucide-clock class="h-3 w-3" />
                      {{ ws.createdAt }}
                    </div>
                    <div class="flex items-center gap-1 text-xs text-base-content/40">
                      <i-lucide-file-text class="h-3 w-3" />
                      {{ ws.docCount }}
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <label class="tab gap-2">
            <input
              v-model="activeProjectTab"
              type="radio"
              name="project_detail_tabs"
              value="deliverables"
            />
            <i-lucide-file-text class="h-4 w-4 text-primary" />
            산출물 관리
          </label>
          <div class="tab-content min-h-[calc(100vh-18rem)] border-base-300 bg-base-100 p-6">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <i-lucide-file-text class="h-4 w-4 text-primary" />
                  <span class="text-sm font-semibold">산출물 목록</span>
                </div>
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-primary gap-1.5"
                    @click="addDeliverable"
                  >
                    <i-lucide-plus class="h-4 w-4" />
                    산출물 추가
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in filteredDeliverables"
                  :key="item.id"
                  class="flex cursor-pointer items-center gap-4 rounded-lg border border-primary/20 bg-base-100 px-4 py-3 transition hover:border-primary/35 hover:bg-primary/10"
                  @click="openDeliverableStructure(item.id)"
                  @contextmenu.prevent.stop="openDeliverableContextMenu(item, $event)"
                >
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <i-lucide-file-text class="h-5 w-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <input
                      v-if="editingDeliverableId === item.id"
                      v-model="editingDeliverableTitle"
                      type="text"
                      :data-deliverable-editor-id="item.id"
                      class="input input-primary input-xs w-full max-w-sm font-bold"
                      @click.stop
                      @blur="confirmRenameDeliverable"
                      @keydown.enter.prevent="confirmRenameDeliverable"
                      @keydown.esc.prevent="cancelRenameDeliverable"
                    />
                    <div v-else class="truncate text-sm font-bold text-base-content/80">
                      {{ item.title }}
                    </div>
                    <div class="mt-1 flex items-center gap-2 text-xs text-base-content/45">
                      <i-lucide-calendar class="h-3 w-3" />
                      <span>{{ item.updated_at }}</span>
                      <span
                        v-if="downloadStatusById[item.id] === 'downloading'"
                        class="badge badge-info badge-soft badge-xs gap-1"
                      >
                        <span class="loading loading-spinner loading-xs"></span>
                        추출 중
                      </span>
                      <span
                        v-else-if="downloadStatusById[item.id] === 'done'"
                        class="badge badge-success badge-soft badge-xs gap-1"
                      >
                        <i-lucide-check class="h-3 w-3" />
                        다운로드 완료
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 text-base-content/55">
                    <button
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square"
                      data-tip="미리보기"
                      @click.stop="openDeliverablePreview(item.id)"
                    >
                      <i-lucide-eye class="h-4 w-4" />
                    </button>
                    <div class="dropdown dropdown-end" @click.stop>
                      <button
                        tabindex="0"
                        type="button"
                        class="tooltip tooltip-left btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
                        data-tip="내보내기"
                        :disabled="downloadStatusById[item.id] === 'downloading'"
                      >
                        <span
                          v-if="downloadStatusById[item.id] === 'downloading'"
                          class="loading loading-spinner loading-xs"
                        ></span>
                        <i-lucide-download v-else class="h-4 w-4" />
                      </button>
                      <ul
                        tabindex="0"
                        class="dropdown-content menu z-[9999] mt-1 w-44 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-xl"
                      >
                        <li>
                          <button
                            v-blur
                            type="button"
                            class="rounded-lg text-sm font-medium text-base-content/80 hover:text-base-content"
                            @click="downloadDeliverable(item, 'html')"
                          >
                            <i-lucide-file-archive class="h-4 w-4 opacity-70" />
                            HTML 내보내기
                          </button>
                        </li>
                        <li>
                          <button
                            v-blur
                            type="button"
                            class="rounded-lg text-sm font-medium text-base-content/80 hover:text-base-content"
                            @click="downloadDeliverable(item, 'pdf')"
                          >
                            <i-lucide-file-down class="h-4 w-4 opacity-70" />
                            PDF 내보내기
                          </button>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square"
                      data-tip="복사"
                      @click.stop="copyDeliverable(item.id)"
                    >
                      <i-lucide-copy class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ModalNewProject ref="modalEditProjectRef" @on-submit="onSubmitEditProject" />
    <ModalNewWorkspace ref="modalNewWorkspaceRef" @on-submit="onSubmitWorkspace" />
    <ModalBase ref="downloadCompleteModalRef" width="w-80">
      <div class="py-3 text-center text-sm font-semibold">{{ downloadCompleteMessage }}</div>
      <template #footer="{ close }">
        <button class="btn btn-sm min-w-28 gap-1.5" @click="openSavedDownloadFolder">
          <i-lucide-folder-open class="h-4 w-4" />
          폴더 열기
        </button>
        <button class="btn btn-sm min-w-28" @click="close">
          <i-lucide-check class="h-4 w-4" />
          확인
        </button>
      </template>
    </ModalBase>

    <ul
      v-if="workspaceContextMenu.visible"
      class="menu fixed z-[9999] w-36 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-xl"
      :style="{
        left: `${workspaceContextMenu.x}px`,
        top: `${workspaceContextMenu.y}px`
      }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <li>
        <button type="button" class="rounded-lg text-sm" @click="editContextWorkspace">
          <i-lucide-pencil class="h-4 w-4 opacity-60" />
          수정
        </button>
      </li>
      <li>
        <button type="button" class="rounded-lg text-sm text-error" @click="deleteContextWorkspace">
          <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
          삭제
        </button>
      </li>
    </ul>

    <ul
      v-if="deliverableContextMenu.visible"
      class="menu fixed z-[9999] w-40 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-xl"
      :style="{
        left: `${deliverableContextMenu.x}px`,
        top: `${deliverableContextMenu.y}px`
      }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <li>
        <button type="button" class="rounded-lg text-sm" @click="renameContextDeliverable">
          <i-lucide-pencil class="h-4 w-4 opacity-60" />
          이름수정
        </button>
      </li>
      <li>
        <button
          type="button"
          class="rounded-lg text-sm text-error"
          @click="deleteContextDeliverable"
        >
          <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
          삭제
        </button>
      </li>
    </ul>

    <modal-confirm
      ref="modalConfirmRef"
      ok-text="예"
      cancel-text="아니오"
      @on-confirm="runConfirmCallback"
    >
      <template #message>
        <div v-dompurify-html="confirmMsgHtml"></div>
      </template>
    </modal-confirm>
  </div>
</template>

<script setup lang="ts">
import type { Project, Workspace as DbWorkspace } from '@database/dto'
import {
  createWorkspace,
  deleteProject,
  deleteWorkspace,
  createDeliverable,
  deleteDeliverable,
  getDocList,
  getDeliverables,
  getProjects,
  getWorkspaces,
  updateDeliverableTitle,
  updateProject,
  updateWorkspace,
  type Deliverable
} from '@/database'
import type { DownloadFormat, ExportResult } from '@/types'
import { formatDate } from '@/utils/datetime'
import { buildManualExport } from '@/views/deliverables/templates/manualExport'
import { renderManual, renderManualInline } from '@/views/deliverables/templates/manualTemplate'
import { useContextMenu } from '@renderer/composables/useContextMenu'
import { useRouter } from 'vue-router'

interface Workspace {
  id: number
  name: string
  thumbnail: string | null
  createdAt: string
  createdTime: number
  docCount: number
}

interface WorkspacePayload {
  id?: number
  name: string
  thumbnail: string | null
}

interface DeliverableItem {
  id: string
  title: string
  updated_at: string
  createdTime: number
}

const router = useRouter()

const route = useRoute()

const onConfirmCallback = ref<(() => void) | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const modalEditProjectRef = ref<ComponentRef<'ModalNewProject'> | null>(null)
const modalNewWorkspaceRef = ref<ComponentRef<'ModalNewWorkspace'> | null>(null)
const downloadCompleteModalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const confirmMsgHtml = ref<string>('')

const runConfirmCallback = (): void => {
  onConfirmCallback.value?.()
}
const projectThumbnail = ref<string | null>(null)
const workspaces = ref<Workspace[]>([])
const curProject = ref<Project | null>(null)
const activeProjectTab = ref(route.query.tab === 'deliverables' ? 'deliverables' : 'workspaces')
const deletingWorkspace = ref<Workspace | null>(null)
const deletingDeliverable = ref<DeliverableItem | null>(null)
const deliverables = ref<DeliverableItem[]>([])
const workspaceSearchText = ref('')
const deliverableSearchText = ref('')
const editingDeliverableId = ref<string | null>(null)
const editingDeliverableTitle = ref('')
const downloadStatusById = ref<Record<string, 'downloading' | 'done'>>({})
const savedDownloadPathById = ref<Record<string, string>>({})
const downloadCompleteMessage = ref('')
const savedDownloadPath = ref('')
const {
  contextMenu: workspaceContextMenu,
  selectedItem: selectedWorkspaceContextItem,
  openContextMenu: openWorkspaceMenu,
  closeContextMenu: closeWorkspaceContextMenu
} = useContextMenu<Workspace>({ closeOnWindowContextMenu: true })
const {
  contextMenu: deliverableContextMenu,
  selectedItem: selectedDeliverableContextItem,
  openContextMenu: openDeliverableMenu,
  closeContextMenu: closeDeliverableContextMenu
} = useContextMenu<DeliverableItem>({ closeOnWindowContextMenu: true })

// 이미지 파일 경로를 화면 표시용 URL로 변환
const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

// DB 워크스페이스를 카드 UI 데이터로 변환
const mapWorkspaceToCard = (workspace: DbWorkspace): Workspace => {
  return {
    id: workspace.id,
    name: workspace.name,
    thumbnail: workspace.thumbnail_path
      ? toFileSrc(workspace.thumbnail_path, workspace.updated_at)
      : null,
    createdAt: formatDate(new Date(workspace.created_at), 'YYYY-MM-DD HH:mm'),
    createdTime: new Date(workspace.created_at).getTime(),
    docCount: 0
  }
}

// DB 산출물을 목록 UI 데이터로 변환
const mapDeliverableToItem = (deliverable: Deliverable): DeliverableItem => ({
  id: String(deliverable.id),
  title: deliverable.title,
  updated_at: formatDate(new Date(deliverable.updated_at), 'YYYY년 MM월 DD일'),
  createdTime: new Date(deliverable.created_at).getTime()
})

const getSearchKeyword = (value: string): string => value.trim().toLowerCase()

const filteredWorkspaces = computed(() => {
  const keyword = getSearchKeyword(workspaceSearchText.value)
  if (!keyword) return workspaces.value

  return workspaces.value.filter((workspace) => workspace.name.toLowerCase().includes(keyword))
})

const filteredDeliverables = computed(() => {
  const keyword = getSearchKeyword(deliverableSearchText.value)
  if (!keyword) return deliverables.value

  return deliverables.value.filter((deliverable) =>
    deliverable.title.toLowerCase().includes(keyword)
  )
})

// 프로젝트 기본 정보 조회
const loadProject = async (): Promise<void> => {
  const rows = await getProjects({
    id: route.params.id,
    limit: 1,
    offset: 0
  })
  curProject.value = rows[0] ?? null
  projectThumbnail.value = curProject.value?.thumbnail_path
    ? toFileSrc(curProject.value.thumbnail_path, curProject.value.updated_at)
    : null
}

// 워크스페이스 목록 조회
const loadWorkspaces = async (): Promise<void> => {
  const projectId = Number(route.params.id)
  const rows = await getWorkspaces({ project_id: projectId, limit: 50, offset: 0 })
  const cards = rows.map(mapWorkspaceToCard)
  const docCounts = await Promise.all(
    cards.map(async (workspace) => {
      const docs = await getDocList({ workspaceId: workspace.id })
      return [workspace.id, docs.length] as const
    })
  )
  const docCountByWorkspaceId = new Map(docCounts)

  workspaces.value = cards
    .map((workspace) => ({
      ...workspace,
      docCount: docCountByWorkspaceId.get(workspace.id) ?? 0
    }))
    .sort((left, right) => right.createdTime - left.createdTime)
}

// 산출물 목록 조회
const loadDeliverables = async (): Promise<void> => {
  const projectId = Number(route.params.id)
  if (!projectId) {
    deliverables.value = []
    return
  }

  const rows = await getDeliverables({ projectId })
  deliverables.value = rows
    .map(mapDeliverableToItem)
    .sort((left, right) => right.createdTime - left.createdTime)
}

// 프로젝트 수정 모달
const onEditProject = (): void => {
  if (!curProject.value) return

  modalEditProjectRef.value?.onOpenEdit({
    id: String(curProject.value.id),
    name: curProject.value.name,
    description: curProject.value.description,
    url: curProject.value.serv_url,
    thumbnail: projectThumbnail.value
  })
}

// 프로젝트 수정
const onSubmitEditProject = async (payload: {
  id?: string
  name: string
  description: string
  url: string
  thumbnail: string | null
}): Promise<void> => {
  if (!curProject.value || !payload.id) return

  await updateProject({
    id: payload.id,
    name: payload.name,
    description: payload.description,
    serv_url: payload.url,
    thumbnail: payload.thumbnail
  })

  await loadProject()
}

// 워크스페이스 생성 모달
const onCreateWorkspace = (): void => {
  modalNewWorkspaceRef.value?.onOpen()
}

// 워크스페이스 수정 모달
const openEditWorkspace = (workspace: Workspace): void => {
  modalNewWorkspaceRef.value?.onOpenEdit({
    id: workspace.id,
    name: workspace.name,
    thumbnail: workspace.thumbnail
  })
}

// 워크스페이스 삭제 확인 모달
const openDeleteWorkspace = (workspace: Workspace): void => {
  deletingWorkspace.value = workspace
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${workspace.name}</h3>
    <p class="text-sm text-gray-500">워크스페이스를 정말 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback.value = (): void => {
    if (!deletingWorkspace.value) return

    void (async () => {
      await deleteWorkspace(deletingWorkspace.value!.id)
      deletingWorkspace.value = null
      await loadWorkspaces()
    })()
  }
  modalConfirmRef.value?.onOpen()
}

// 워크스페이스 우클릭 메뉴 열기
const openWorkspaceContextMenu = (workspace: Workspace, event: MouseEvent): void => {
  closeDeliverableContextMenu()
  openWorkspaceMenu(event, workspace)
}

// 우클릭 메뉴에서 워크스페이스 수정 열기
const editContextWorkspace = (): void => {
  const workspace = selectedWorkspaceContextItem.value
  closeWorkspaceContextMenu()
  if (!workspace) return

  openEditWorkspace(workspace)
}

// 우클릭 메뉴에서 워크스페이스 삭제 확인 열기
const deleteContextWorkspace = (): void => {
  const workspace = selectedWorkspaceContextItem.value
  closeWorkspaceContextMenu()
  if (!workspace) return

  openDeleteWorkspace(workspace)
}

// 새 산출물 기본 제목 생성
const getNextNumberedTitle = (baseTitle: string): string => {
  const titles = new Set(deliverables.value.map((item) => item.title))
  if (!titles.has(baseTitle)) return baseTitle

  let index = 2
  while (titles.has(`${baseTitle}${index}`)) {
    index += 1
  }

  return `${baseTitle}${index}`
}

// 산출물 추가
const addDeliverable = async (): Promise<void> => {
  const projectId = Number(route.params.id)
  if (!projectId) return

  const id = await createDeliverable({
    projectId,
    title: getNextNumberedTitle('새산출물')
  })
  if (id === null) return

  await loadDeliverables()
}

// 산출물 복사 제목 생성
const getCopyTitle = (title: string): string => {
  const copyPattern = /_복사본(?:\d+)?$/
  const baseTitle = title.replace(copyPattern, '')
  const copyTitles = new Set(deliverables.value.map((item) => item.title))
  let copyIndex = 1

  while (copyTitles.has(`${baseTitle}_복사본${copyIndex === 1 ? '' : copyIndex}`)) {
    copyIndex += 1
  }

  return `${baseTitle}_복사본${copyIndex === 1 ? '' : copyIndex}`
}

// 산출물 복사
const copyDeliverable = async (id: string): Promise<void> => {
  const index = deliverables.value.findIndex((item) => item.id === id)
  const target = deliverables.value[index]
  if (!target) return

  const projectId = Number(route.params.id)
  if (!projectId) return

  const copiedId = await createDeliverable({
    projectId,
    title: getCopyTitle(target.title),
    sourceDeliverableId: Number(id)
  })
  if (copiedId === null) return

  await loadDeliverables()
}

// 산출물 구조 구성 화면 이동
const openDeliverableStructure = (id: string): void => {
  void router.push(`/projects/${route.params.id}/deliverables/${id}/structure`)
}

// 산출물 미리보기 화면 이동
const openDeliverablePreview = (id: string): void => {
  void router.push(`/projects/${route.params.id}/deliverables/${id}/preview`)
}

// URL 쿼리에 맞춰 탭 상태 동기화
watch(
  () => route.query.tab,
  (tab) => {
    activeProjectTab.value = tab === 'deliverables' ? 'deliverables' : 'workspaces'
  }
)

// 산출물 우클릭 메뉴 열기
const openDeliverableContextMenu = (item: DeliverableItem, event: MouseEvent): void => {
  closeWorkspaceContextMenu()
  openDeliverableMenu(event, item)
}

// 우클릭 메뉴에서 산출물 이름 수정 시작
const renameContextDeliverable = (): void => {
  const item = selectedDeliverableContextItem.value
  closeDeliverableContextMenu()
  if (!item) return

  renameDeliverable(item.id)
}

// 우클릭 메뉴에서 산출물 삭제 확인 열기
const deleteContextDeliverable = (): void => {
  const item = selectedDeliverableContextItem.value
  closeDeliverableContextMenu()
  if (!item) return

  openDeleteDeliverable(item)
}

// 산출물별 다운로드 상태 저장
const setDownloadStatus = (id: string, status: 'downloading' | 'done' | undefined): void => {
  if (!status) {
    const nextStatusById = { ...downloadStatusById.value }
    delete nextStatusById[id]
    downloadStatusById.value = nextStatusById
    return
  }

  downloadStatusById.value = {
    ...downloadStatusById.value,
    [id]: status
  }
}

// 다운로드 저장 다이얼로그 호출 및 저장된 파일 경로 기록
const downloadDeliverable = async (
  deliverable: DeliverableItem,
  format: DownloadFormat
): Promise<void> => {
  setDownloadStatus(deliverable.id, 'downloading')

  try {
    const data = await buildManualExport(Number(deliverable.id), {
      includeImages: format === 'html'
    })
    if (!data) {
      setDownloadStatus(deliverable.id, undefined)
      return
    }

    const result = format === 'html' ? await saveManualHtml(data) : await saveManualPdf(data)

    if (result.canceled || !result.filePath) {
      setDownloadStatus(deliverable.id, undefined)
      return
    }

    savedDownloadPathById.value = {
      ...savedDownloadPathById.value,
      [deliverable.id]: result.filePath
    }
    setDownloadStatus(deliverable.id, 'done')
    showDownloadComplete('산출물 내보내기가 완료되었습니다.', result.filePath)
  } catch (error) {
    console.error('Failed to download deliverable:', error)
    setDownloadStatus(deliverable.id, undefined)
  }
}

// 산출물 HTML ZIP 저장
const saveManualHtml = async (
  data: Awaited<ReturnType<typeof buildManualExport>>
): Promise<ExportResult> => {
  if (!data) throw new Error('Manual export data is empty.')

  const bundle = renderManual(data.model)
  const files = [
    { path: 'index.html', content: bundle.html },
    { path: 'assets/manual.css', content: bundle.css },
    { path: 'assets/manual.js', content: bundle.js },
    ...data.images.map((file) => ({
      path: file.path,
      content: file.content,
      encoding: file.encoding
    }))
  ]

  return (await window.api.invoke('export:manualHtmlZip', {
    defaultFileName: data.fileName,
    files
  })) as ExportResult
}

// 산출물 PDF 저장
const saveManualPdf = async (
  data: Awaited<ReturnType<typeof buildManualExport>>
): Promise<ExportResult> => {
  if (!data) throw new Error('Manual export data is empty.')

  return (await window.api.invoke('export:manualPdf', {
    defaultFileName: data.fileName,
    html: renderManualInline(data.model)
  })) as ExportResult
}

const showDownloadComplete = (message: string, filePath: string): void => {
  downloadCompleteMessage.value = message
  savedDownloadPath.value = filePath
  downloadCompleteModalRef.value?.onOpen()
}

// 마지막 저장 파일 위치를 파일 탐색기에서 표시
const openSavedDownloadFolder = (): void => {
  if (!savedDownloadPath.value) return

  void window.api.invoke('shell:showItemInFolder', savedDownloadPath.value)
  downloadCompleteModalRef.value?.onClose()
}

// 산출물 이름 수정 시작
const renameDeliverable = (id: string): void => {
  const target = deliverables.value.find((item) => item.id === id)
  if (!target) return

  editingDeliverableId.value = id
  editingDeliverableTitle.value = target.title
  void nextTick(() => {
    const input = document.querySelector<HTMLInputElement>(`[data-deliverable-editor-id="${id}"]`)
    input?.focus()
    input?.select()
  })
}

// 산출물 이름 수정 저장
const confirmRenameDeliverable = async (): Promise<void> => {
  const targetId = editingDeliverableId.value
  if (!targetId) return

  const nextTitle = editingDeliverableTitle.value.trim()
  editingDeliverableId.value = null
  editingDeliverableTitle.value = ''
  if (!nextTitle) return

  const isUpdated = await updateDeliverableTitle({
    id: Number(targetId),
    title: nextTitle
  })
  if (!isUpdated) return

  await loadDeliverables()
}

// 산출물 이름 수정 취소
const cancelRenameDeliverable = (): void => {
  editingDeliverableId.value = null
  editingDeliverableTitle.value = ''
}

// 산출물 삭제 처리
const deleteDeliverableItem = async (id: string): Promise<void> => {
  if (editingDeliverableId.value === id) {
    cancelRenameDeliverable()
  }
  const isDeleted = await deleteDeliverable(Number(id))
  if (!isDeleted) return

  const nextStatusById = { ...downloadStatusById.value }
  const nextSavedPathById = { ...savedDownloadPathById.value }
  delete nextStatusById[id]
  delete nextSavedPathById[id]
  downloadStatusById.value = nextStatusById
  savedDownloadPathById.value = nextSavedPathById
  await loadDeliverables()
}

// 산출물 삭제 확인 모달
const openDeleteDeliverable = (item: DeliverableItem): void => {
  deletingDeliverable.value = item
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${item.title}</h3>
    <p class="text-sm text-gray-500">산출물을 정말 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback.value = (): void => {
    if (!deletingDeliverable.value) return

    void (async () => {
      await deleteDeliverableItem(deletingDeliverable.value!.id)
      deletingDeliverable.value = null
    })()
  }
  modalConfirmRef.value?.onOpen()
}

// 워크스페이스 생성 또는 수정 저장
const onSubmitWorkspace = (payload: WorkspacePayload): void => {
  void (async () => {
    const projectId = Number(route.params.id)

    if (payload.id != null) {
      await updateWorkspace({
        id: payload.id,
        name: payload.name,
        thumbnail: payload.thumbnail
      })
      await loadWorkspaces()
      return
    }

    await createWorkspace({
      project_id: projectId,
      name: payload.name,
      thumbnail: payload.thumbnail
    })
    await loadWorkspaces()
  })()
}

// 프로젝트 삭제 확인 모달
const onDeleteProject = (): void => {
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${curProject.value?.name}</h3>
    <p class="text-sm text-gray-500">프로젝트를 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback.value = (): void => {
    if (!curProject.value) return

    void (async () => {
      await deleteProject(String(curProject.value?.id))
      await router.push('/')
    })()
  }
  modalConfirmRef.value?.onOpen()
}

// 화면 진입 시 프로젝트 상세 데이터 조회
onMounted(() => {
  void loadProject()
  void loadWorkspaces()
  void loadDeliverables()
})
</script>
