<template>
  <div class="min-h-screen bg-[#f7f9fd] px-3 py-4 text-slate-800 md:px-4 md:py-5">
    <div class="mx-auto max-w-[1160px] pt-20">
      <div class="mb-8 flex items-start justify-between gap-4">
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[#8fa0bf] transition hover:text-[#5f59c6]"
          @click="goHome"
        >
          <i-lucide-arrow-left class="text-base" />
          <span>목록으로 돌아가기</span>
        </button>

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full text-[#a7b2c9] transition hover:bg-white hover:text-[#5f59c6]"
        >
          <i-lucide-ellipsis-vertical class="text-base" />
        </button>
      </div>

      <section class="space-y-2 pt-10">
        <h1 class="text-[1.8rem] leading-tight font-black tracking-[-0.04em] text-[#102348] md:text-[2.35rem]">
          {{ project.title }}
        </h1>
        <p class="max-w-3xl text-sm leading-[1.55] font-bold tracking-[-0.02em] text-[#9aa8c0] md:text-base">
          {{ project.description }}
        </p>
      </section>

      <div class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section
          class="rounded-[20px] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(36,48,82,0.05)] md:px-5"
        >
          <h2 class="text-base font-black tracking-[-0.03em] text-[#a2b0c8]">단계별 진행 상황</h2>

          <div class="mt-5 space-y-5">
            <article
              v-for="(step, index) in steps"
              :key="step.id"
              class="relative flex gap-5"
            >
              <div class="flex flex-col items-center">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full border-[3px] text-sm font-black"
                  :class="
                    step.state === 'done'
                      ? 'border-[#5f59c6] bg-[#5f59c6] text-white'
                      : step.state === 'active'
                        ? 'border-[#5f59c6] bg-white text-[#5f59c6]'
                        : 'border-[#dfe6f3] bg-white text-[#c0cadc]'
                  "
                >
                  <i-lucide-check v-if="step.state === 'done'" class="text-sm" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div
                  v-if="index < steps.length - 1"
                  class="mt-2 h-12 w-px bg-[#e8edf7]"
                ></div>
              </div>

              <div class="min-w-0 flex-1 pb-1">
                <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3
                    class="text-[1.1rem] leading-tight font-black tracking-[-0.03em] md:text-[1.2rem]"
                    :class="step.state === 'todo' ? 'text-[#b9c5da]' : 'text-[#102348]'"
                  >
                    {{ step.title }}
                  </h3>
                  <span
                    v-if="step.state === 'active'"
                    class="inline-flex w-fit rounded-full bg-[#ecebff] px-2.5 py-1 text-[10px] font-bold text-[#756fec]"
                  >
                    진행 중
                  </span>
                </div>
                <p
                  class="mt-1 text-xs leading-[1.55] font-bold md:text-sm"
                  :class="step.state === 'todo' ? 'text-[#b7c2d8]' : 'text-[#8fa0bf]'"
                >
                  {{ step.description }}
                </p>

                <button
                  v-if="step.state !== 'todo'"
                  type="button"
                  class="mt-3 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition"
                  :class="
                    step.state === 'done'
                      ? 'border-[#5f59c6] bg-white text-[#5f59c6] hover:bg-[#5f59c6] hover:text-white'
                      : 'border-[#5f59c6] bg-[#5f59c6] text-white shadow-[0_8px_18px_rgba(95,89,198,0.24)] hover:bg-[#554fb7]'
                  "
                  @click="goStep(step.id)"
                >
                  <i-lucide-camera class="text-sm" />
                  <span>{{ step.actionLabel }}</span>
                  <i-lucide-chevron-right class="text-sm" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <aside class="space-y-8">
          <section class="rounded-[20px] bg-white p-4 shadow-[0_8px_22px_rgba(36,48,82,0.05)]">
            <h2 class="text-base font-black tracking-[-0.03em] text-[#a2b0c8]">빠른 작업</h2>

            <button
              type="button"
              class="mt-4 flex w-full items-center gap-2.5 rounded-[18px] p-3 text-left transition"
              :class="
                isPdfDownloadEnabled
                  ? 'bg-[#fbfcff] hover:shadow-[0_8px_18px_rgba(72,87,124,0.08)]'
                  : 'cursor-not-allowed bg-[#f4f6fb] opacity-65'
              "
              :disabled="!isPdfDownloadEnabled"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecebff] text-[#5f59c6]"
              >
                <i-lucide-file-down class="text-lg" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-base leading-tight font-black tracking-[-0.03em] text-[#102348]">
                  PDF 다운로드
                </span>
                <span class="mt-0.5 block text-[11px] font-bold text-[#8fa0bf]">
                  {{ isPdfDownloadEnabled ? '다운로드 가능' : '2단계 완료 시 가능' }}
                </span>
              </span>
              <i-lucide-chevron-right class="text-base text-[#28334f]" />
            </button>
          </section>

          <section
            class="rounded-[20px] bg-[#5f59c6] p-4 text-white shadow-[0_12px_22px_rgba(95,89,198,0.24)]"
          >
            <div class="flex items-end justify-between gap-4">
              <h2 class="text-base font-black tracking-[-0.03em] text-white/75">전체 진행률</h2>
              <span class="text-[2rem] font-black tracking-[-0.04em]">{{ project.progress }}%</span>
            </div>

            <div class="mt-4 h-2 rounded-full bg-white/15">
              <div
                class="h-full rounded-full bg-white"
                :style="{ width: `${project.progress}%` }"
              ></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { dashboardProjectMap, type DummyDashboardProject } from '@/assets/dummy/data'

type DashboardProject = DummyDashboardProject

interface DashboardStep {
  id: string
  title: string
  description: string
  state: 'done' | 'active' | 'todo'
  actionLabel: string
}

const router = useRouter()
const route = useRoute()

const project = computed<DashboardProject>(() => {
  const projectId = String(route.query.projectId ?? 'shopping-ui-research')
  return dashboardProjectMap[projectId] ?? dashboardProjectMap['shopping-ui-research']
})

const steps = computed<DashboardStep[]>(() => {
  if (project.value.progress >= 100) {
    return [
      {
        id: 'capture-browser',
        title: '브라우저 캡처',
        description: '웹페이지를 캡처하여 소스를 수집합니다.',
        state: 'done',
        actionLabel: '브라우저 캡처 다시하기'
      },
      {
        id: 'select-folder',
        title: '캡처본 선택 및 폴더링',
        description: '수집된 이미지를 선택하고 폴더링 합니다.',
        state: 'done',
        actionLabel: '캡처본 선택 및 폴더링 다시하기'
      },
      {
        id: 'edit-capture',
        title: '캡처본 편집',
        description: '각 화면의 기능 설명을 추가하여 매뉴얼을 작성을 완료합니다.',
        state: 'done',
        actionLabel: '캡처본 편집 다시하기'
      }
    ]
  }

  return [
    {
      id: 'capture-browser',
      title: '브라우저 캡처',
      description: '웹페이지를 캡처하여 소스를 수집합니다.',
      state: 'done',
      actionLabel: '브라우저 캡처 다시하기'
    },
    {
      id: 'select-folder',
      title: '캡처본 선택 및 폴더링',
      description: '수집된 이미지를 정리하고 PDF로 변환할 준비를 합니다.',
      state: 'active',
      actionLabel: '캡처본 선택 및 폴더링 계속하기'
    },
    {
      id: 'edit-capture',
      title: '캡처본 편집',
      description: '이미지에 주석을 달거나 레이아웃을 조정합니다.',
      state: 'todo',
      actionLabel: '캡처본 편집 계속하기'
    }
  ]
})

const isPdfDownloadEnabled = computed(() =>
  steps.value.some((step) => step.id === 'select-folder' && step.state === 'done')
)

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goStep = async (stepId: string): Promise<void> => {
  const projectId = route.query.projectId ?? 'shopping-ui-research'

  if (stepId === 'select-folder') {
    await router.push({
      name: 'select-index',
      query: { projectId }
    })
    return
  }

  if (stepId === 'edit-capture') {
    await router.push({
      name: 'editor-index',
      query: { projectId, step: 'edit' }
    })
    return
  }

  await router.push({
    name: 'capture-index',
    query: { projectId }
  })
}
</script>
