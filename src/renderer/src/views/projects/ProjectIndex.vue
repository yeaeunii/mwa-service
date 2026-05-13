<template>
  <div class="flex h-screen flex-col bg-base-200">
    <!-- Hero Banner -->
    <div class="relative shrink-0">
      <img
        class="h-48 w-full object-cover"
        :src="projectThumbnail ?? 'https://placehold.co/1400x400/475569/94a3b8?text=thumbnail'"
        alt="project banner"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />

      <!-- Top Bar -->
      <div class="absolute inset-x-0 top-0 z-10">
        <div class="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <button
            class="btn btn-sm border-none bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            @click="router.push('/')"
          >
            <i-lucide-arrow-left class="h-4 w-4" />
            프로젝트 목록
          </button>
          <div class="dropdown dropdown-end">
            <div
              tabindex="0"
              role="button"
              class="btn btn-sm btn-circle border-none bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
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
          <h1 class="mb-1.5 text-2xl font-bold text-white drop-shadow-md">
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
            <input type="radio" name="project_detail_tabs" checked="checked" />
            <i-lucide-layout-grid class="h-4 w-4 text-primary" />
            워크스페이스
          </label>
          <div class="tab-content border-base-300 bg-base-100 p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-end">
                <label class="input input-sm w-64">
                  <i-lucide-search class="h-3.5 w-3.5 opacity-45" />
                  <input type="search" placeholder="워크스페이스 검색..." />
                </label>
              </div>

              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Workspace Cards -->
                <router-link
                  v-for="ws in workspaces"
                  :key="ws.id"
                  :to="`/workspace/${ws.id}`"
                  class="group block overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <div class="relative h-44 overflow-hidden">
                    <img
                      :src="
                        ws.thumbnail ??
                        'https://placehold.co/600x300/475569/94a3b8?text=WORKSPACE'
                      "
                      alt="workspace thumbnail"
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div
                      class="dropdown dropdown-end absolute right-2.5 top-2.5 z-20"
                      @click.stop.prevent
                      @mousedown.stop
                    >
                      <button
                        tabindex="0"
                        type="button"
                        class="btn btn-xs btn-circle border-none bg-black/35 text-white shadow-sm backdrop-blur-sm hover:bg-black/50"
                        @click.stop.prevent
                      >
                        <i-lucide-more-vertical class="h-3.5 w-3.5" />
                      </button>
                      <ul
                        tabindex="0"
                        class="dropdown-content menu z-20 w-36 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-lg"
                        @click.stop.prevent
                      >
                        <li>
                          <button
                            type="button"
                            class="rounded-lg text-sm"
                            @click.stop.prevent="openEditWorkspace(ws)"
                          >
                            <i-lucide-pencil class="h-4 w-4 opacity-60" />
                            수정
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            class="rounded-lg text-sm text-error"
                            @click.stop.prevent="openDeleteWorkspace(ws)"
                          >
                            <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
                            삭제
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div class="absolute inset-x-0 bottom-0 p-4">
                      <div class="text-lg font-bold text-white drop-shadow-md">{{ ws.name }}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-1 text-xs text-base-content/40">
                      <i-lucide-clock class="h-3 w-3" />
                      {{ ws.createdAt }}
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1 text-xs text-base-content/40">
                        <i-lucide-image class="h-3 w-3" />
                        {{ ws.imageCount }}
                      </div>
                      <div class="flex items-center gap-1 text-xs text-base-content/40">
                        <i-lucide-file-text class="h-3 w-3" />
                        {{ ws.docCount }}
                      </div>
                    </div>
                  </div>
                </router-link>

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
              </div>
            </div>
          </div>

          <label class="tab gap-2">
            <input type="radio" name="project_detail_tabs" />
            <i-lucide-folder-kanban class="h-4 w-4 text-primary" />
            산출물 관리
          </label>
          <div class="tab-content border-base-300 bg-base-100 p-6">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <i-lucide-folder-kanban class="h-4 w-4 text-primary" />
                  <span class="text-sm font-semibold">산출물 목록</span>
                  <span class="badge badge-sm badge-ghost">
                    {{ deliverables.length }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <label class="input input-sm w-72">
                    <i-lucide-search class="h-3.5 w-3.5 opacity-45" />
                    <input type="search" placeholder="산출물 검색..." />
                  </label>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary gap-1.5"
                    @click="addDeliverable"
                  >
                    <i-lucide-plus class="h-4 w-4" />
                    산출물 추가
                  </button>
                  <button type="button" class="btn btn-sm btn-outline gap-1.5">
                    <i-lucide-archive class="h-4 w-4" />
                    보관함
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in deliverables"
                  :key="item.id"
                  class="flex items-center gap-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3"
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
                      @blur="confirmRenameDeliverable"
                      @keydown.enter.prevent="confirmRenameDeliverable"
                      @keydown.esc.prevent="cancelRenameDeliverable"
                    />
                    <div v-else class="truncate text-sm font-bold text-base-content/80">
                      {{ item.title }}
                    </div>
                    <div class="mt-1 flex items-center gap-2 text-xs text-base-content/45">
                      <i-lucide-calendar class="h-3 w-3" />
                      <span>{{ item.date }}</span>
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
                    >
                      <i-lucide-eye class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
                      data-tip="다운로드"
                      :disabled="downloadStatusById[item.id] === 'downloading'"
                      @click.stop="downloadDeliverable(item.id)"
                    >
                      <span
                        v-if="downloadStatusById[item.id] === 'downloading'"
                        class="loading loading-spinner loading-xs"
                      ></span>
                      <i-lucide-download v-else class="h-4 w-4" />
                    </button>
                    <button
                      v-if="downloadStatusById[item.id] === 'done'"
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
                      data-tip="다운로드 폴더 열기"
                    >
                      <i-lucide-folder-open class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square"
                      data-tip="복사"
                      @click.stop="copyDeliverable(item.id)"
                    >
                      <i-lucide-copy class="h-4 w-4" />
                    </button>
                    <div class="dropdown dropdown-end">
                      <button
                        tabindex="0"
                        type="button"
                        class="tooltip tooltip-left btn btn-ghost btn-xs btn-square"
                        data-tip="더보기"
                        @click.stop
                      >
                        <i-lucide-more-vertical class="h-4 w-4" />
                      </button>
                      <ul
                        tabindex="0"
                        class="dropdown-content menu z-20 w-36 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-lg"
                        @click.stop
                      >
                        <li>
                          <button
                            type="button"
                            class="rounded-lg text-sm"
                            @click.stop="renameDeliverable(item.id)"
                          >
                            <i-lucide-pencil class="h-4 w-4 opacity-60" />
                            이름수정
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            class="rounded-lg text-sm text-error"
                            @click.stop="openDeleteDeliverable(item)"
                          >
                            <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
                            삭제
                          </button>
                        </li>
                      </ul>
                    </div>
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

    <modal-confirm
      ref="modalConfirmRef"
      ok-text="예"
      cancel-text="아니오"
      @on-confirm="onConfirmCallback?.()"
    >
      <template #message>
        <div v-dompurify-html="confirmMsgHtml"></div>
      </template>
    </modal-confirm>
  </div>
</template>

<script setup lang="ts">
import type { WorkspacePayload } from './components/ModalNewWorkspace.vue'
import type { Project, Workspace as DbWorkspace } from '@database/dto'
import {
  createWorkspace,
  deleteProject,
  deleteWorkspace,
  getProjects,
  getWorkspaces,
  updateProject,
  updateWorkspace
} from '@/database'
import { deliverableItems, type DummyDeliverableItem } from '@/assets/dummy/data'
import { formatDate } from '@/utils/datetime'
import { useRouter } from 'vue-router'

interface Workspace {
  id: number
  name: string
  thumbnail: string | null
  createdAt: string
  imageCount: number
  docCount: number
}

const router = useRouter()

const route = useRoute()

let onConfirmCallback: (() => void) | null = null
const modalConfirmRef = ref<InstanceType<typeof ModalConfirm> | null>(null)
const modalEditProjectRef = ref<ComponentRef<'ModalNewProject'> | null>(null)
const modalNewWorkspaceRef = ref<InstanceType<typeof ModalNewWorkspace> | null>(null)
const confirmMsgHtml = ref<string>('')
const projectThumbnail = ref<string | null>(null)
const workspaces = ref<Workspace[]>([])
const curProject = ref<Project | null>(null)
const deletingWorkspace = ref<Workspace | null>(null)
const deletingDeliverable = ref<DummyDeliverableItem | null>(null)
const deliverables = ref<DummyDeliverableItem[]>(deliverableItems.map((item) => ({ ...item })))
const editingDeliverableId = ref<string | null>(null)
const editingDeliverableTitle = ref('')
const downloadStatusById = ref<Record<string, 'downloading' | 'done'>>({})

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

const mapWorkspaceToCard = (workspace: DbWorkspace): Workspace => {
  return {
    id: workspace.id,
    name: workspace.name,
    thumbnail: workspace.thumbnail_path
      ? toFileSrc(workspace.thumbnail_path, workspace.updated_at)
      : null,
    createdAt: formatDate(new Date(workspace.created_at), 'YYYY-MM-DD HH:mm'),
    imageCount: 0,
    docCount: 0
  }
}

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

const loadWorkspaces = async (): Promise<void> => {
  const projectId = Number(route.params.id)
  const rows = await getWorkspaces({ project_id: projectId, limit: 50, offset: 0 })
  workspaces.value = rows.map(mapWorkspaceToCard)
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

const openEditWorkspace = (workspace: Workspace): void => {
  modalNewWorkspaceRef.value?.onOpenEdit({
    id: workspace.id,
    name: workspace.name,
    thumbnail: workspace.thumbnail
  })
}

const openDeleteWorkspace = (workspace: Workspace): void => {
  deletingWorkspace.value = workspace
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${workspace.name}</h3>
    <p class="text-sm text-gray-500">워크스페이스를 정말 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback = (): void => {
    if (!deletingWorkspace.value) return

    void (async () => {
      await deleteWorkspace(deletingWorkspace.value!.id)
      deletingWorkspace.value = null
      await loadWorkspaces()
    })()
  }
  modalConfirmRef.value?.onOpen()
}

const makeDeliverableId = (): string =>
  `deliverable-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const todayText = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${year}년 ${month}월 ${date}일`
}

const getNextNumberedTitle = (baseTitle: string): string => {
  const titles = new Set(deliverables.value.map((item) => item.title))
  if (!titles.has(baseTitle)) return baseTitle

  let index = 2
  while (titles.has(`${baseTitle}${index}`)) {
    index += 1
  }

  return `${baseTitle}${index}`
}

const addDeliverable = (): void => {
  deliverables.value = [
    {
      id: makeDeliverableId(),
      title: getNextNumberedTitle('새산출물'),
      date: todayText()
    },
    ...deliverables.value
  ]
}

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

const copyDeliverable = (id: string): void => {
  const index = deliverables.value.findIndex((item) => item.id === id)
  const target = deliverables.value[index]
  if (!target) return

  const copiedItem: DummyDeliverableItem = {
    ...target,
    id: makeDeliverableId(),
    title: getCopyTitle(target.title)
  }

  deliverables.value = [
    ...deliverables.value.slice(0, index + 1),
    copiedItem,
    ...deliverables.value.slice(index + 1)
  ]
}

const downloadDeliverable = (id: string): void => {
  downloadStatusById.value = {
    ...downloadStatusById.value,
    [id]: 'downloading'
  }

  window.setTimeout(() => {
    downloadStatusById.value = {
      ...downloadStatusById.value,
      [id]: 'done'
    }
  }, 1200)
}

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

const confirmRenameDeliverable = (): void => {
  const targetId = editingDeliverableId.value
  if (!targetId) return

  const nextTitle = editingDeliverableTitle.value.trim()
  editingDeliverableId.value = null
  editingDeliverableTitle.value = ''
  if (!nextTitle) return

  deliverables.value = deliverables.value.map((item) =>
    item.id === targetId ? { ...item, title: nextTitle } : item
  )
}

const cancelRenameDeliverable = (): void => {
  editingDeliverableId.value = null
  editingDeliverableTitle.value = ''
}

const deleteDeliverable = (id: string): void => {
  if (editingDeliverableId.value === id) {
    cancelRenameDeliverable()
  }
  const { [id]: _deletedStatus, ...nextStatusById } = downloadStatusById.value
  downloadStatusById.value = nextStatusById
  deliverables.value = deliverables.value.filter((item) => item.id !== id)
}

const openDeleteDeliverable = (item: DummyDeliverableItem): void => {
  deletingDeliverable.value = item
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${item.title}</h3>
    <p class="text-sm text-gray-500">산출물을 정말 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback = (): void => {
    if (!deletingDeliverable.value) return

    deleteDeliverable(deletingDeliverable.value.id)
    deletingDeliverable.value = null
  }
  modalConfirmRef.value?.onOpen()
}

//워크스페이스 생성
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

//프로젝트 삭제 모달
const onDeleteProject = (): void => {
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">${curProject.value?.name}</h3>
    <p class="text-sm text-gray-500">프로젝트를 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback = (): void => {
    if (!curProject.value) return

    void (async () => {
      await deleteProject(String(curProject.value?.id))
      await router.push('/')
    })()
  }
  modalConfirmRef.value?.onOpen()
}

onMounted(() => {
  void loadProject()
  void loadWorkspaces()
})
</script>
