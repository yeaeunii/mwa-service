<template>
  <div class="min-h-screen bg-slate-50 px-8 py-8 text-slate-800">
    <div class="mx-auto flex max-w-7xl flex-col gap-8">
      <header class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black tracking-tight text-slate-900">내 프로젝트</h1>
          <p class="text-sm font-medium text-slate-500">
            최근 작업한 매뉴얼 프로젝트를 확인하고 관리하세요.
          </p>
        </div>
      </header>

      <div class="flex flex-wrap gap-3">
        <button
          v-for="filter in filters"
          :key="filter"
          class="btn h-11 rounded-full border-0 px-6 text-sm font-semibold shadow-none"
          :class="
            selectedFilter === filter
              ? 'btn-primary text-white'
              : 'bg-white text-slate-500 hover:bg-slate-100'
          "
          @click="selectedFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <section class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <button
          v-for="project in filteredProjects"
          :key="project.id"
          type="button"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1"
          @click="goToCapture(project.id)"
        >
          <div
            class="relative h-40 overflow-hidden"
            :style="{ background: project.coverBackground }"
          >
            <div class="absolute inset-0 bg-white/12"></div>
            <div
              class="absolute right-4 top-4 rounded-xl px-3 py-1 text-xs font-bold text-white"
              :class="project.status === '진행중' ? 'bg-blue-500' : 'bg-emerald-500'"
            >
              {{ project.status }}
            </div>

            <div class="absolute inset-x-7 bottom-5">
              <div
                class="mx-auto flex h-20 w-full max-w-[210px] items-center justify-center rounded-2xl border border-white/60 bg-white/90 shadow-lg backdrop-blur"
              >
                <div class="w-4/5 space-y-2">
                  <div class="h-2.5 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="grid grid-cols-4 gap-1.5 pt-1">
                    <div
                      v-for="index in 4"
                      :key="`${project.id}-row-${index}`"
                      class="h-8 rounded-lg bg-slate-100"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 px-6 py-5">
            <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">
              {{ project.title }}
            </h2>

            <div class="space-y-2 text-sm text-slate-500">
              <div class="flex items-center gap-2">
                <i-lucide-calendar-days class="text-base" />
                <span>업데이트: {{ project.updatedAt }}</span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white text-slate-500 transition-colors duration-200 hover:border-blue-300 hover:text-blue-500"
          @click="modalCreateProjectRef?.onOpen()"
        >
          <span
            class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl"
          >
            <i-lucide-plus />
          </span>
          <span class="text-xl font-extrabold">새 프로젝트 만들기</span>
        </button>
      </section>
    </div>
    <ModalCreateProject ref="modalCreateProjectRef" @onCreate="onCreateProject" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

type Filter = '전체' | '진행중' | '완료' 

interface ProjectCard {
  id: string
  title: string
  updatedAt: string
  captureCount: number
  description?: string
  status: '진행중' | '완료'
  filter: Exclude<Filter, '전체'>
  favorite: boolean
  coverBackground: string
}

const filters: Filter[] = ['전체', '진행중', '완료']
const selectedFilter = ref<Filter>('전체')
const router = useRouter()
const modalCreateProjectRef = ref<ComponentRef<'ModalCreateProject'> | null>(null)

const projects = ref<ProjectCard[]>([
  {
    id: 'crm-guide',
    title: '내부 CRM 가이드',
    updatedAt: '2023.10.24',
    captureCount: 12,
    status: '진행중',
    filter: '진행중',
    favorite: false,
    coverBackground: 'linear-gradient(135deg, #c8dedd 0%, #b4d4d5 45%, #eef5f5 100%)'
  },
  {
    id: 'customer-portal',
    title: '고객 포털 매뉴얼',
    updatedAt: '2023.10.20',
    captureCount: 8,
    status: '완료',
    filter: '완료',
    favorite: false,
    coverBackground: 'linear-gradient(135deg, #ecd2c5 0%, #f1ddd3 45%, #fbf4ef 100%)'
  }

])

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

const goToCapture = async (projectId: string): Promise<void> => {
  await router.push({
    name: 'capture-index',
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
    captureCount: 0,
    description: payload.description,
    status: '진행중',
    filter: '진행중',
    favorite: false,
    coverBackground: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 45%, #eff6ff 100%)'
  })
}

</script>
