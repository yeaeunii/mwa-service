<template>
  <div class="flex h-screen flex-col overflow-hidden bg-base-100 text-base-content">
    <header class="z-30 shrink-0 border-b border-base-content/10 bg-base-100/95 backdrop-blur">
      <div class="flex h-16 max-w-7xl items-center gap-4 px-6 md:px-10">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary/70 shadow-sm"
          >
            <i-lucide-panels-top-left class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-black tracking-tight">MWA</h1>
          </div>
        </div>
      </div>
    </header>

    <div
      class="mx-auto bg-base-100 flex w-full max-w-7xl shrink-0 flex-col gap-5 px-6 pb-6 pt-6 md:px-10"
    >
      <!-- Filters -->
      <div class="flex items-center gap-2">
        <button
          v-for="filter in PROJECT_FILTERS"
          :key="filter"
          class="btn btn-sm rounded-full border-0 px-5 font-semibold shadow-none transition-all"
          :class="
            selectedProjectFilter === filter
              ? 'bg-primary text-primary-content hover:bg-primary/90'
              : 'bg-slate-100 text-base-content/60 hover:bg-base-300/50'
          "
          @click.stop="selectedProjectFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <section class="min-h-0 flex-1 border-y border-base-content/10 bg-base-100">
      <div class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-6 md:px-10">
        <div class="flex flex-col gap-3 border-b border-base-content/10 pb-5">
          <div>
            <h1 class="text-3xl font-black tracking-tight">내 프로젝트</h1>
            <div class="mt-1.5 flex items-center justify-between gap-3">
              <p class="text-sm text-base-content/50">
                매뉴얼 프로젝트를 확인하고 관리하세요.
              </p>
              <button
                type="button"
                :disabled="isImportingProject"
                class="inline-flex h-5 shrink-0 items-center gap-1.5 bg-transparent px-1 text-xs font-bold text-base-content/55 transition-colors hover:text-emerald-600 hover:underline disabled:pointer-events-none disabled:opacity-50"
                @click.stop="importProject">
                <span v-if="isImportingProject" class="loading loading-spinner loading-xs" />
                <i-lucide-folder-input v-else class="h-4 w-4" />
                불러오기
              </button>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <!-- Project Grid -->
          <section
            v-if="selectedProjectFilter === '전체' || filteredProjects.length > 0"
            class="grid grid-cols-1 content-start gap-5 pb-6 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              v-if="selectedProjectFilter === '전체'"
              type="button"
              class="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-content/15 bg-base-100/50 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
              @click.stop="modalCreateProjectRef?.onOpen()"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-base-content/10"
              >
                <i-lucide-plus class="h-5 w-5 text-base-content/40" />
              </div>
              <span class="text-sm font-bold text-base-content/40">새 프로젝트</span>
            </button>
            <!-- Project Card -->
            <div
              v-for="project in filteredProjects"
              :key="project.id"
              class="group cursor-pointer overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
              @click="router.push({ name: 'projects-index', params: { id: project.id } })"
              @contextmenu.prevent.stop="openProjectContextMenu(project, $event)"
            >
              <!-- Thumbnail -->
              <div class="relative overflow-hidden">
                <img
                  v-if="project.thumbnail"
                  :src="project.thumbnail"
                  alt="project thumbnail"
                  class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <DefaultThumbnail
                  v-else
                  :id="Number(project.id)"
                  :label="project.title"
                  class="h-44 w-full transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  v-if="project.thumbnail"
                  class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                />
                <span
                  class="badge badge-sm absolute right-2.5 top-2.5 z-10 font-bold shadow-sm"
                  :class="
                    project.status === '완료'
                      ? 'border-emerald-200 bg-emerald-500 text-white'
                      : 'border-fuchsia-200 bg-fuchsia-500 text-white'
                  "
                >
                  {{ project.status }}
                </span>
              </div>

              <!-- Info -->
              <div class="p-4">
                <div class="mb-1.5 flex items-start gap-2">
                  <h3 class="min-w-0 flex-1 text-base font-bold leading-tight line-clamp-1">
                    <template v-if="project.thumbnail">{{ project.title }}</template>
                    <span v-else aria-hidden="true">&nbsp;</span>
                  </h3>
                </div>
                <p class="mb-4 h-10 text-xs leading-relaxed text-base-content/45 line-clamp-2">
                  {{ project.description || EMPTY_DESCRIPTION }}
                </p>
                <div class="flex items-center justify-between border-t border-base-content/5 pt-3">
                  <div class="flex items-center gap-1 text-xs text-base-content/40">
                    <i-lucide-clock class="h-3 w-3" />
                    {{ project.createdAt }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Empty State -->
          <div
            v-if="filteredProjects.length === 0 && projects.length > 0"
            class="flex min-h-full flex-col items-center justify-center gap-3 py-10 text-base-content/30"
          >
            <i-lucide-search-x class="h-12 w-12" />
            <p class="text-sm font-medium">
              '{{ selectedProjectFilter }}' 필터에 해당하는 프로젝트가 없습니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <ModalNewProject ref="modalCreateProjectRef" @on-submit="onSubmitProject" />
    <ul
      v-if="projectContextMenu.visible"
      class="menu fixed z-[9999] w-40 rounded-xl border border-base-content/10 bg-base-100 p-1.5 shadow-xl"
      :style="{
        left: `${projectContextMenu.x}px`,
        top: `${projectContextMenu.y}px`
      }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <li>
        <button type="button" class="rounded-lg text-sm" @click="editContextProject">
          <i-lucide-pencil class="h-4 w-4 opacity-60" />
          수정
        </button>
      </li>
      <li>
        <button
          type="button"
          class="rounded-lg text-sm"
          :disabled="exportingProjectId === selectedProjectContextItem?.id"
          @click="exportContextProject"
        >
          <span
            v-if="exportingProjectId === selectedProjectContextItem?.id"
            class="loading loading-spinner loading-xs opacity-60"
          />
          <i-lucide-download v-else class="h-4 w-4 opacity-60" />
          내보내기
        </button>
      </li>
      <li>
        <button type="button" class="rounded-lg text-sm text-error" @click="deleteContextProject">
          <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
          삭제
        </button>
      </li>
    </ul>
    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="onConfirmDeleteProject">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ deletingProject?.title }}</h3>
          <p class="text-sm text-gray-500">프로젝트를 정말 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>
    <ModalBase ref="projectResultModalRef" width="w-80">
      <div class="py-3 text-center text-sm font-semibold">{{ projectResultMessage }}</div>
      <template #footer="{ close }">
        <button
          v-if="projectResultPath"
          type="button"
          class="btn btn-sm gap-1.5"
          @click="openProjectResultFolder"
        >
          <i-lucide-folder-open class="h-4 w-4" />
          폴더 열기
        </button>
        <button type="button" class="btn btn-sm" @click="close">
          <i-lucide-check class="h-4 w-4" />
          확인
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@database/dto'
import { createProject, deleteProject, getProjects, updateProject } from '@/database'
import { formatDate } from '@/utils/datetime'
import type { ExportResult } from '@/types'
import { useContextMenu } from '@renderer/composables/useContextMenu'

type ProjectFilter = '전체' | '진행중' | '완료'
const PROJECT_FILTERS: ProjectFilter[] = ['전체', '진행중', '완료']

interface ProjectCard {
  id: string
  title: string
  createdAt: string
  createdTime: number
  progress: string
  description: string
  rawDescription: string
  status: '진행중' | '완료'
  thumbnail: string | null
  url: string
}

const EMPTY_DESCRIPTION = '프로젝트 설명을 아직 작성하지 않았습니다.'
const selectedProjectFilter = ref<ProjectFilter>('전체')
const searchText = ref('')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalNewProject'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const projectResultModalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const deletingProject = ref<ProjectCard | null>(null)
const exportingProjectId = ref<string | null>(null)
const isImportingProject = ref(false)
const projectResultMessage = ref('')
const projectResultPath = ref('')
const {
  contextMenu: projectContextMenu,
  selectedItem: selectedProjectContextItem,
  openContextMenu: openProjectMenu,
  closeContextMenu: closeProjectMenu
} = useContextMenu<ProjectCard>({ closeOnWindowContextMenu: true })

const projects = ref<ProjectCard[]>([])

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

const normalizeProjectStatus = (status: string): ProjectCard['status'] => {
  return status === '완료' ? '완료' : '진행중'
}

const mapProjectToCard = (project: Project): ProjectCard => {
  const status = normalizeProjectStatus(project.status)

  return {
    id: String(project.id),
    title: project.name,
    createdAt: formatDate(new Date(project.created_at), 'YYYY.MM.DD HH:mm'),
    createdTime: new Date(project.created_at).getTime(),
    progress: '-',
    description: project.description ?? '',
    rawDescription: project.description ?? '',
    status,
    thumbnail: project.thumbnail_path
      ? toFileSrc(project.thumbnail_path, project.updated_at)
      : null,
    url: project.serv_url ?? ''
  }
}

// workspace 목록 화면으로 이동
const goToWorkspace = async (projectId: string): Promise<void> => {
  await router.push({ name: 'projects-index', params: { id: projectId } })
}

// 프로젝트 조회
const loadProjects = async (): Promise<void> => {
  const rows = await getProjects({ limit: -1, offset: 0 })
  console.log('loaded rows:', rows)
  projects.value = rows
    .map(mapProjectToCard)
    .sort((left, right) => right.createdTime - left.createdTime)
}

const filteredProjects = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  const searchedProjects = keyword
    ? projects.value.filter((project) =>
        [project.title, project.rawDescription, project.url].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      )
    : projects.value

  switch (selectedProjectFilter.value) {
    case '진행중':
      return searchedProjects.filter((project) => project.status === '진행중')
    case '완료':
      return searchedProjects.filter((project) => project.status === '완료')
    default:
      return searchedProjects
  }
})

const openEditProject = (project: ProjectCard): void => {
  modalCreateProjectRef.value?.onOpenEdit({
    id: project.id,
    name: project.title,
    description: project.rawDescription,
    url: project.url,
    thumbnail: project.thumbnail
  })
}

const openProjectContextMenu = (project: ProjectCard, event: MouseEvent): void => {
  openProjectMenu(event, project)
}

const editContextProject = (): void => {
  const project = selectedProjectContextItem.value
  closeProjectMenu()
  if (!project) return

  openEditProject(project)
}

const exportContextProject = (): void => {
  const project = selectedProjectContextItem.value
  closeProjectMenu()
  if (!project) return

  void openExportProject(project)
}

const deleteContextProject = (): void => {
  const project = selectedProjectContextItem.value
  closeProjectMenu()
  if (!project) return

  openDeleteProject(project)
}

const openDeleteProject = (project: ProjectCard): void => {
  deletingProject.value = project
  modalConfirmRef.value?.onOpen()
}

const showProjectResultModal = (message: string, filePath = ''): void => {
  projectResultMessage.value = message
  projectResultPath.value = filePath
  projectResultModalRef.value?.onOpen()
}

const openProjectResultFolder = (): void => {
  if (!projectResultPath.value) return

  void window.api.invoke('shell:showItemInFolder', projectResultPath.value)
  projectResultModalRef.value?.onClose()
}

const openExportProject = async (project: ProjectCard): Promise<void> => {
  if (exportingProjectId.value) return

  exportingProjectId.value = project.id
  try {
    const result = (await window.api.invoke('export:project', {
      projectId: project.id,
      defaultFileName: `${project.title}_export`
    })) as ExportResult

    if (!result.canceled && result.filePath) {
      showProjectResultModal('프로젝트 내보내기가 완료되었습니다.', result.filePath)
    }
  } catch (error) {
    console.error('Failed to export project:', error)
    showProjectResultModal('프로젝트 내보내기에 실패했습니다.')
  } finally {
    exportingProjectId.value = null
  }
}

const importProject = async (): Promise<void> => {
  if (isImportingProject.value) return

  isImportingProject.value = true
  try {
    const result = (await window.api.invoke('import:project')) as {
      canceled: boolean
      projectId?: number
    }

    if (!result.canceled) {
      await loadProjects()
      showProjectResultModal('프로젝트 불러오기가 완료되었습니다.')
    }
  } catch (error) {
    console.error('Failed to import project:', error)
    showProjectResultModal('프로젝트 불러오기에 실패했습니다.')
  } finally {
    isImportingProject.value = false
  }
}

//프로젝트 생성/수정
const onSubmitProject = async (payload: {
  id?: string
  name: string
  description: string
  url: string
  thumbnail: string | null
}): Promise<void> => {
  if (payload.id) {
    await updateProject({
      id: payload.id,
      name: payload.name,
      description: payload.description,
      serv_url: payload.url,
      thumbnail: payload.thumbnail
    })
    await loadProjects()
    return
  }

  const projectId = await createProject({
    name: payload.name,
    description: payload.description,
    serv_url: payload.url,
    thumbnail: payload.thumbnail
  })
  if (projectId === null) return

  console.log('created projectId:', projectId)
  await loadProjects()
  await goToWorkspace(String(projectId))
}

const onConfirmDeleteProject = async (): Promise<void> => {
  if (!deletingProject.value) return

  await deleteProject(deletingProject.value.id)

  deletingProject.value = null
  await loadProjects()
}

onMounted(() => {
  void loadProjects()
})
</script>
