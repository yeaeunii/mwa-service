<template>
  <div class="min-h-screen bg-[#f7f8fb] text-base-content">
    <header class="sticky top-0 z-30 border-b border-base-content/10 bg-base-100/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6 md:px-10">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary/70 shadow-sm">
            <i-lucide-panels-top-left class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-black tracking-tight">MWA</h1>
            <!-- <p class="truncate text-xs text-base-content/45">매뉴얼 프로젝트를 생성하고 관리하세요</p> -->
          </div>
        </div>

        <button
          type="button"
          class="btn btn-sm ml-auto border-0 bg-emerald-500 text-white hover:bg-emerald-600">
          <i-lucide-folder-input class="h-4 w-4" />
          불러오기
        </button>
      </div>
    </header>

    <div class="mx-auto flex max-w-7xl flex-col gap-5 px-6 pb-6 pt-15 md:px-10">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          class="flex items-center justify-between rounded-lg border bg-base-100 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="
            selectedProjectFilter === '전체'
              ? 'border-sky-300 bg-sky-50 text-sky-700'
              : 'border-base-content/10 hover:border-sky-200'
          "
          @click.stop="selectedProjectFilter = '전체'"
        >
          <div>
            <div class="text-xs font-semibold text-base-content/55">전체 프로젝트</div>
            <div class="mt-1 text-3xl font-black">
              {{ formatCount(projectCounts.total) }}<span class="ml-0.5 text-base font-bold">개</span>
            </div>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-500">
            <i-lucide-folder-kanban class="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          class="flex items-center justify-between rounded-lg border bg-base-100 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="
            selectedProjectFilter === '진행중'
              ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700'
              : 'border-base-content/10 hover:border-fuchsia-200'
          "
          @click.stop="selectedProjectFilter = '진행중'"
        >
          <div>
            <div class="text-xs font-semibold text-base-content/55">진행중</div>
            <div class="mt-1 text-3xl font-black">
              {{ formatCount(projectCounts.inProgress) }}<span class="ml-0.5 text-base font-bold">개</span>
            </div>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-500">
            <i-lucide-loader-circle class="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          class="flex items-center justify-between rounded-lg border bg-base-100 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="
            selectedProjectFilter === '완료'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-base-content/10 hover:border-emerald-200'
          "
          @click.stop="selectedProjectFilter = '완료'"
        >
          <div>
            <div class="text-xs font-semibold text-base-content/55">완료됨</div>
            <div class="mt-1 text-3xl font-black">
              {{ formatCount(projectCounts.done) }}<span class="ml-0.5 text-base font-bold">개</span>
            </div>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-500">
            <i-lucide-circle-check class="h-5 w-5" />
          </div>
        </button>
      </div>



    </div>

    <section class="border-y border-base-content/10 bg-base-100">
      <div class="mx-auto max-w-7xl px-6 py-6 md:px-10">

      <div class="flex flex-col gap-3 border-b border-base-content/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-bold">최근 프로젝트</h2>
        </div>
        <div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <label
            class="input input-sm flex w-full items-center gap-2 border-base-content/10 bg-base-100 shadow-none sm:w-72"
          >
            <i-lucide-search class="h-4 w-4 text-base-content/35" />
            <input v-model="searchText" type="search" class="grow" placeholder="프로젝트 검색" />
          </label>
          <button
            type="button"
            class="btn btn-sm border-0 bg-indigo-500 text-white hover:bg-indigo-600"
            @click.stop="modalCreateProjectRef?.onOpen()">
            <i-lucide-plus class="h-4 w-4" />
            새 프로젝트
          </button>
        </div>
      </div>

      <!-- Project Grid -->
      <section class="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <!-- Project Card -->
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="group cursor-pointer overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
          @click="router.push({ name: 'projects-index', params: { id: project.id } })"
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
              class="h-44 w-full transition-transform duration-300 group-hover:scale-105"
            />
            <div
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
                {{ project.title }}
              </h3>
              <div class="dropdown dropdown-end shrink-0" @click.stop.prevent @mousedown.stop>
                <button
                  tabindex="0"
                  type="button"
                  class="btn btn-xs btn-circle border-none bg-base-200 text-base-content/60 shadow-none hover:bg-base-300"
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
                      @click.stop.prevent="openEditProject(project)"
                    >
                      <i-lucide-pencil class="h-4 w-4 opacity-60" />
                      수정
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="rounded-lg text-sm"
                      :disabled="exportingProjectId === project.id"
                      @click.stop.prevent="openExportProject(project)"
                    >
                      <span
                        v-if="exportingProjectId === project.id"
                        class="loading loading-spinner loading-xs opacity-60"
                      />
                      <i-lucide-download v-else class="h-4 w-4 opacity-60" />
                      내보내기
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="rounded-lg text-sm text-error"
                      @click.stop.prevent="openDeleteProject(project)"
                    >
                      <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
                      삭제
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <p class="mb-4 h-10 text-xs leading-relaxed text-base-content/45 line-clamp-2">
              {{ project.description || EMPTY_DESCRIPTION }}
            </p>
            <div class="flex items-center justify-between border-t border-base-content/5 pt-3">
              <div class="flex items-center gap-1 text-xs text-base-content/40">
                <i-lucide-clock class="h-3 w-3" />
                {{ project.updatedAt }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div
        v-if="filteredProjects.length === 0 && projects.length > 0"
        class="flex flex-col items-center gap-3 py-20 text-base-content/30"
      >
        <i-lucide-search-x class="h-12 w-12" />
        <p class="text-sm font-medium">
          '{{ selectedProjectFilter }}' 필터에 해당하는 프로젝트가 없습니다.
        </p>
      </div>
      </div>
    </section>

    <ModalNewProject ref="modalCreateProjectRef" @on-submit="onSubmitProject" />
    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="onConfirmDeleteProject">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ deletingProject?.title }}</h3>
          <p class="text-sm text-gray-500">프로젝트를 정말 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@database/dto'
import { createProject, deleteProject, getProjects, updateProject } from '@/database'
import { formatDate } from '@/utils/datetime'
import type { ExportResult } from '@/types'

type ProjectFilter = '전체' | '진행중' | '완료'

interface ProjectCard {
  id: string
  title: string
  updatedAt: string
  updatedTime: number
  progress: string
  description: string
  rawDescription: string
  status: '진행중' | '완료'
  thumbnail: string | null
  url: string
}

const EMPTY_DESCRIPTION = '프로젝트 설명을 아직 작성하지 않았습니다.'
const countFormatter = new Intl.NumberFormat('ko-KR')
const selectedProjectFilter = ref<ProjectFilter>('전체')
const searchText = ref('')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalNewProject'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const deletingProject = ref<ProjectCard | null>(null)
const exportingProjectId = ref<string | null>(null)

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
    updatedAt: formatDate(new Date(project.updated_at), 'YYYY.MM.DD HH:mm'),
    updatedTime: new Date(project.updated_at).getTime(),
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
    .sort((left, right) => right.updatedTime - left.updatedTime)
}

const formatCount = (count: number): string => countFormatter.format(count)

const projectCounts = computed(() => {
  const done = projects.value.filter((project) => project.status === '완료').length

  return {
    total: projects.value.length,
    inProgress: projects.value.length - done,
    done
  }
})

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

const openDeleteProject = (project: ProjectCard): void => {
  deletingProject.value = project
  modalConfirmRef.value?.onOpen()
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
      window.alert('프로젝트 내보내기가 완료되었습니다.')
    }
  } catch (error) {
    console.error('Failed to export project:', error)
    window.alert('프로젝트 내보내기에 실패했습니다.')
  } finally {
    exportingProjectId.value = null
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
