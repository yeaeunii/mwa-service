<template>
  <div class="min-h-screen bg-base-200 text-base-content" @click="closeProjectMenu">
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
              src="https://placehold.co/600x300/f1f5f9/94a3b8?text=thumbnail"
              alt="project thumbnail"
              class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <div class="absolute right-2.5 top-2.5">
              <span
                class="badge badge-sm font-bold shadow-sm"
                :class="project.filter === '완료' ? 'badge-primary' : 'badge-success'"
              >
                {{ project.status }}
              </span>
            </div>
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
              <div class="flex items-center gap-1 text-xs text-base-content/40">
                <i-lucide-file-check class="h-3 w-3" />
                {{ project.progress }}
              </div>
            </div>
          </div>
        </div>

        <!-- New Project Card -->
        <button
          type="button"
          class="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-base-content/15 bg-base-100/50 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
          @click.stop="modalCreateProjectRef?.onOpen()"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-base-content/10 transition-colors group-hover:bg-primary/20"
          >
            <i-lucide-plus class="h-6 w-6 text-base-content/40" />
          </div>
          <span class="text-sm font-bold text-base-content/40">새 프로젝트 만들기</span>
        </button>
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
    <ModalConfirm ref="modalConfirmRef" @on-confirm="onConfirmDeleteProject" />
  </div>
</template>

<script setup lang="ts">
type Filter = '전체' | '진행중' | '완료'

interface ProjectCard {
  id: string
  title: string
  updatedAt: string
  progress: string
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

const DUMMY_PROJECTS: ProjectCard[] = [
  {
    id: 'project-1',
    title: 'AI 마켓 솔루션 구매',
    updatedAt: '2026.04.10 14:30',
    progress: '13 / 15',
    description: 'AI 마켓에서 솔루션을 검색하고 구매하는 전체 프로세스에 대한 매뉴얼 문서입니다.',
    rawDescription: '',
    status: '진행중',
    filter: '진행중'
  },
  {
    id: 'project-2',
    title: '사용자 권한 관리 시스템',
    updatedAt: '2026.04.08 09:15',
    progress: '8 / 8',
    description:
      '관리자 페이지에서 사용자 역할 및 권한을 설정하고 관리하는 기능에 대한 문서입니다.',
    rawDescription: '',
    status: '완료',
    filter: '완료'
  },
  {
    id: 'project-3',
    title: '대시보드 리포트 생성',
    updatedAt: '2026.04.07 16:42',
    progress: '5 / 12',
    description: '데이터 분석 대시보드에서 커스텀 리포트를 생성하고 공유하는 기능 매뉴얼입니다.',
    rawDescription: '',
    status: '진행중',
    filter: '진행중'
  },
  {
    id: 'project-4',
    title: '결제 시스템 연동 가이드',
    updatedAt: '2026.04.05 11:00',
    progress: '20 / 20',
    description: 'PG사 연동 및 결제 프로세스 전반에 대한 기술 문서 및 사용자 매뉴얼입니다.',
    rawDescription: '',
    status: '완료',
    filter: '완료'
  },
  {
    id: 'project-5',
    title: '회원가입 및 로그인 플로우',
    updatedAt: '2026.04.03 13:20',
    progress: '6 / 10',
    description: '소셜 로그인, 이메일 인증, 비밀번호 재설정 등 인증 관련 전체 플로우를 다룹니다.',
    rawDescription: '',
    status: '진행중',
    filter: '진행중'
  },
  {
    id: 'project-6',
    title: '알림 센터 운영 매뉴얼',
    updatedAt: '2026.03.28 10:05',
    progress: '4 / 4',
    description: '푸시 알림, 인앱 알림, 이메일 알림 설정 및 관리에 대한 운영 매뉴얼입니다.',
    rawDescription: '',
    status: '완료',
    filter: '완료'
  },
  {
    id: 'project-7',
    title: '파일 업로드 및 관리',
    updatedAt: '2026.03.25 17:30',
    progress: '2 / 7',
    description: '대용량 파일 업로드, 미리보기, 버전 관리 기능에 대한 사용자 가이드입니다.',
    rawDescription: '',
    status: '진행중',
    filter: '진행중'
  }
]

const projects = ref<ProjectCard[]>([])

const loadProjects = async (): Promise<void> => {
  const rows = await getProjects({ limit: 10, offset: 0 })
  console.log(rows)
  projects.value = DUMMY_PROJECTS
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

const goToDashboard = async (projectId: string): Promise<void> => {
  await router.push({ name: 'dashboard-index', query: { projectId } })
}

const closeProjectMenu = (): void => {
  openedProjectMenuId.value = null
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
