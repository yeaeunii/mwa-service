<template>
  <div class="min-h-screen bg-[#f6f8fc] px-5 py-7 text-slate-800 md:px-8" @click="closeProjectMenu">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <header class="space-y-2 pt-20">
        <h1 class="text-4xl font-black tracking-tight text-slate-900">내 프로젝트</h1>
        <p class="text-sm font-medium text-slate-500">
          최근 작업한 매뉴얼 프로젝트를 확인하고 관리하세요.
        </p>
      </header>

      <div class="flex flex-wrap gap-3">
        <button
          v-for="filter in filters"
          :key="filter"
          class="btn h-10 rounded-full border-0 px-5 text-sm font-semibold shadow-none"
          :class="
            selectedFilter === filter
              ? 'bg-[#5f59c6] text-white hover:bg-[#5550b7]'
              : 'bg-white text-slate-500 hover:bg-slate-100'
          "
          @click.stop="selectedFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="project in filteredProjects"
          :key="project.id"
          class="group relative flex min-h-[300px] cursor-pointer flex-col rounded-[28px] border border-[#e6eaf4] bg-white p-5 text-left shadow-[0_16px_32px_rgba(76,92,152,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(76,92,152,0.12)]"
          role="button"
          tabindex="0"
          @click="goToDashboard(project.id)"
          @keydown.enter.prevent="goToDashboard(project.id)"
          @keydown.space.prevent="goToDashboard(project.id)"
        >
          <div class="flex items-start justify-between">
            <span
              class="inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-bold"
              :class="
                project.status === '진행중'
                  ? 'bg-[#fff1bf] text-[#bf8a00]'
                  : 'bg-[#e8f7ec] text-[#2f9a58]'
              "
            >
              {{ project.status }}
            </span>

            <div class="relative" @click.stop>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#b9c3db] transition hover:bg-slate-100 hover:text-[#7f8bad]"
                @click.stop="toggleProjectMenu(project.id)"
              >
                <i-lucide-ellipsis-vertical />
              </button>

              <div
                v-if="openedProjectMenuId === project.id"
                class="absolute top-11 right-0 z-20 min-w-28 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
              >
                <button
                  type="button"
                  class="flex w-full items-center rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  @click.stop="openEditProject(project)"
                >
                  수정
                </button>
                <button
                  type="button"
                  class="flex w-full items-center rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                  @click.stop="openDeleteProject(project)"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <div class="space-y-3">
              <h2 class="text-[1.7rem] leading-tight font-black tracking-[-0.03em] text-[#102348]">
                {{ project.title }}
              </h2>
              <p class="text-base leading-[1.55] font-bold tracking-[-0.02em] text-[#9aa8c0]">
                {{ project.description }}
              </p>
            </div>
          </div>

          <div class="mt-auto space-y-2.5 pt-8">
            <div class="flex items-center justify-between text-sm font-bold text-[#8f9db8]">
              <span>진행률</span>
              <span class="text-[#5f59c6]">{{ project.progress }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-[#edf1f8]">
              <div
                class="h-full rounded-full bg-[#5f59c6]"
                :style="{ width: `${project.progress}%` }"
              ></div>
            </div>
          </div>
        </article>

        <button
          type="button"
          class="flex min-h-[300px] flex-col items-center justify-center gap-5 rounded-[28px] border-2 border-dashed border-[#d7dfef] bg-white text-slate-500 transition-colors duration-200 hover:border-[#8f92ff] hover:text-[#5f59c6]"
          @click.stop="modalCreateProjectRef?.onOpen()"
        >
          <span
            class="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f4fb] text-2xl"
          >
            <i-lucide-plus />
          </span>
          <span class="text-lg font-extrabold">새 프로젝트 만들기</span>
        </button>
      </section>
    </div>

    <ModalCreateProject ref="modalCreateProjectRef" @on-submit="onSubmitProject" />
    <ModalConfirm ref="modalConfirmRef" @on-confirm="onConfirmDeleteProject" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

type Filter = '전체' | '진행중' | '완료'
type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

interface ProjectRecord {
  id: string
  name: string
  description: string
  status: ProjectStatus
  progress: number
  updated_at: string
}

interface ProjectCard {
  id: string
  title: string
  updatedAt: string
  progress: number
  description: string
  rawDescription: string
  status: '진행중' | '완료'
  filter: '진행중' | '완료'
}

const EMPTY_DESCRIPTION = '프로젝트 설명을 아직 작성하지 않았습니다.'
const filters: Filter[] = ['전체', '진행중', '완료']
const selectedFilter = ref<Filter>('전체')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalCreateProject'> | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const openedProjectMenuId = ref<string | null>(null)
const deletingProjectId = ref<string | null>(null)

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const toProjectCard = (project: ProjectRecord): ProjectCard => {
  const status = project.status === 'completed' ? '완료' : '진행중'

  return {
    id: project.id,
    title: project.name,
    updatedAt: formatDate(project.updated_at),
    progress: project.progress,
    description: project.description || EMPTY_DESCRIPTION,
    rawDescription: project.description || '',
    status,
    filter: status
  }
}

const projects = ref<ProjectCard[]>([])

const loadProjects = async (): Promise<void> => {
  const rows = (await window.api.invoke('project:list')) as ProjectRecord[]
  projects.value = rows.map(toProjectCard)
}

const filteredProjects = computed(() => {
  switch (selectedFilter.value) {
    case '진행중':
      return projects.value.filter((project) => project.filter === '진행중')
    case '완료':
      return projects.value.filter((project) => project.filter === '완료')
    default:
      return projects.value
  }
})

const goToDashboard = async (projectId: string): Promise<void> => {
  await router.push({
    name: 'dashboard-index',
    query: { projectId }
  })
}

const closeProjectMenu = (): void => {
  openedProjectMenuId.value = null
}

const toggleProjectMenu = (projectId: string): void => {
  openedProjectMenuId.value = openedProjectMenuId.value === projectId ? null : projectId
}

const openEditProject = (project: ProjectCard): void => {
  closeProjectMenu()
  modalCreateProjectRef.value?.onOpenEdit({
    id: project.id,
    name: project.title,
    description: project.rawDescription
  })
}

const openDeleteProject = (project: ProjectCard): void => {
  closeProjectMenu()
  deletingProjectId.value = project.id
  modalConfirmRef.value?.onOpen(`'${project.title}' 프로젝트를 삭제하시겠습니까?`)
}

const onSubmitProject = async (payload: {
  id?: string
  name: string
  description: string
}): Promise<void> => {
  if (payload.id) {
    await window.api.invoke('project:update', {
      id: payload.id,
      name: payload.name,
      description: payload.description
    })
    await loadProjects()
    return
  }

  const projectId = `project-${Date.now()}`

  await window.api.invoke('project:create', {
    id: projectId,
    name: payload.name,
    description: payload.description
  })

  await loadProjects()
  await goToDashboard(projectId)
}

const onConfirmDeleteProject = async (): Promise<void> => {
  if (!deletingProjectId.value) return

  await window.api.invoke('project:delete', {
    projectId: deletingProjectId.value
  })

  deletingProjectId.value = null
  await loadProjects()
}

onMounted(() => {
  void loadProjects()
})
</script>
