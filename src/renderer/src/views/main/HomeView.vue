<template>
  <div class="min-h-screen bg-[#f6f8fc] px-5 py-7 text-slate-800 md:px-8">
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
          @click="selectedFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="project in filteredProjects"
          :key="project.id"
          type="button"
          class="group flex min-h-[300px] flex-col rounded-[28px] border border-[#e6eaf4] bg-white p-5 text-left shadow-[0_16px_32px_rgba(76,92,152,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(76,92,152,0.12)]"
          @click="goToDashboard(project.id)"
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
            <i-lucide-ellipsis-vertical
              class="text-lg text-[#b9c3db] transition group-hover:text-[#7f8bad]"
            />
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
              <span>진행 속도</span>
              <span class="text-[#5f59c6]">{{ project.progress }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-[#edf1f8]">
              <div
                class="h-full rounded-full bg-[#5f59c6]"
                :style="{ width: `${project.progress}%` }"
              ></div>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="flex min-h-[300px] flex-col items-center justify-center gap-5 rounded-[28px] border-2 border-dashed border-[#d7dfef] bg-white text-slate-500 transition-colors duration-200 hover:border-[#8f92ff] hover:text-[#5f59c6]"
          @click="modalCreateProjectRef?.onOpen()"
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

    <ModalCreateProject ref="modalCreateProjectRef" @on-create="onCreateProject" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { projectCards, type DummyProjectCard } from '@/assets/dummy/data'

type Filter = '전체' | '진행중' | '완료'
type ProjectCard = DummyProjectCard

const filters: Filter[] = ['전체', '진행중', '완료']
const selectedFilter = ref<Filter>('전체')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalCreateProject'> | null>(null)

const projects = ref<ProjectCard[]>(projectCards.map((project) => ({ ...project })))

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

const onCreateProject = (payload: { name: string; description: string }): void => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  projects.value.unshift({
    id: `project-${now.getTime()}`,
    title: payload.name,
    updatedAt: `${year}.${month}.${day}`,
    progress: 0,
    description: payload.description || '프로젝트 설명을 아직 작성하지 않았습니다.',
    status: '진행중',
    filter: '진행중'
  })
}
</script>
