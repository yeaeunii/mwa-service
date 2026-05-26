<template>
  <div class="min-h-screen bg-base-200 text-base-content">
    <div class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:px-10">
      <!-- Header -->
      <header class="pt-12">
        <div class="flex items-end justify-between">
          <div>
            <h1 class="text-3xl font-black tracking-tight">내 프로젝트</h1>
            <p class="mt-1.5 text-sm text-base-content/50">
              최근 작업한 매뉴얼 프로젝트를 확인하고 관리하세요.
            </p>
          </div>
          <button
            class="btn btn-primary btn-sm gap-1.5"
            @click.stop="modalCreateProjectRef?.onOpen()"
          >
            <i-lucide-plus class="h-4 w-4" />
            새 프로젝트
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="flex items-center gap-2">
        <button
          v-for="filter in filters"
          :key="filter"
          class="btn btn-sm rounded-full border-0 px-5 font-semibold shadow-none transition-all"
          :class="
            selectedFilter === filter
              ? 'bg-primary text-primary-content hover:bg-primary/90'
              : 'bg-base-100 text-base-content/60 hover:bg-base-300/50'
          "
          @click.stop="selectedFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <!-- Project Grid -->
      <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div
              class="dropdown dropdown-end absolute right-2.5 top-2.5 z-10"
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
                    @click.stop.prevent="openEditProject(project)"
                  >
                    <i-lucide-pencil class="h-4 w-4 opacity-60" />
                    수정
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
            <span
              class="badge badge-sm absolute bottom-2.5 left-2.5 z-10 font-bold shadow-sm"
              :class="project.filter === '완료' ? 'badge-primary' : 'badge-success'"
            >
              {{ project.status }}
            </span>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="mb-1.5 text-base font-bold leading-tight line-clamp-1">
              {{ project.title }}
            </h3>
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
          '{{ selectedFilter }}' 필터에 해당하는 프로젝트가 없습니다.
        </p>
      </div>
    </div>

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

type Filter = '전체' | '진행중' | '완료'

interface ProjectCard {
  id: string
  title: string
  updatedAt: string
  updatedTime: number
  progress: string
  description: string
  rawDescription: string
  status: '진행중' | '완료'
  filter: '진행중' | '완료'
  thumbnail: string | null
  url: string
}

const EMPTY_DESCRIPTION = '프로젝트 설명을 아직 작성하지 않았습니다.'
const filters: Filter[] = ['전체', '진행중', '완료']
const selectedFilter = ref<Filter>('전체')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalCreateProject'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const deletingProject = ref<ProjectCard | null>(null)

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
    filter: status,
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
  const rows = await getProjects({ limit: 10, offset: 0 })
  console.log('loaded rows:', rows)
  projects.value = rows
    .map(mapProjectToCard)
    .sort((left, right) => right.updatedTime - left.updatedTime)
}

const filteredProjects = computed(() => {
  switch (selectedFilter.value) {
    case '진행중':
      return projects.value.filter((p) => p.filter === '진행중')
    case '완료':
      return projects.value.filter((p) => p.filter === '완료')
    default:
      return projects.value
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
