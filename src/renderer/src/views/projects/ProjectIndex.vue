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
                <a v-blur class="rounded-lg text-sm text-error" @click="onClickDeleteProject">
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
            {{ curProject?.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Workspace Grid -->
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[1200px] px-6 py-6">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i-lucide-layout-grid class="h-4 w-4 text-primary" />
            <span class="text-sm font-semibold">워크스페이스</span>
            <span class="badge badge-sm badge-ghost">{{ workspaces.length }}</span>
          </div>
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
                :src="ws.thumbnail ?? 'https://placehold.co/600x300/475569/94a3b8?text=WORKSPACE'"
                alt="workspace thumbnail"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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

          <!-- New Workspace Button -->
          <button
            type="button"
            class="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-content/15 bg-base-100/50 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            @click="onClickNewWorkspace"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-base-content/10">
              <i-lucide-plus class="h-5 w-5 text-base-content/40" />
            </div>
            <span class="text-sm font-bold text-base-content/40">새 워크스페이스</span>
          </button>
        </div>
      </div>
    </div>

    <ModalNewProject ref="modalEditProjectRef" @on-submit="onSubmitEditProject" />
    <ModalNewWorkspace ref="modalNewWorkspaceRef" @on-submit="onSubmitWorkspace" />

    <modal-confirm
      ref="modalConfirmRef"
      ok-text="예"
      cancel-text="아니오"
      @confirm="onConfirmCallback"
    >
      <template #message>
        <div :vue-dompurify-html="confirmMsgHtml"></div>
      </template>
    </modal-confirm>
  </div>
</template>

<script setup lang="ts">
import ModalConfirm from '@renderer/components/ui/modal/ModalConfirm.vue'
import ModalNewWorkspace from './components/ModalNewWorkspace.vue'
import type { WorkspacePayload } from './components/ModalNewWorkspace.vue'
import { Project } from '@database/dto'
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
let onConfirmCallback: (() => void) | null = null
const modalConfirmRef = ref<InstanceType<typeof ModalConfirm> | null>(null)
const modalEditProjectRef = ref<ComponentRef<'ModalNewProject'> | null>(null)
const modalNewWorkspaceRef = ref<InstanceType<typeof ModalNewWorkspace> | null>(null)
const confirmMsgHtml = ref<string>('')
const projectThumbnail = ref<string | null>(null)

let nextWsId = 3
const workspaces = ref<Workspace[]>([
  {
    id: 1,
    name: 'AI 솔루션',
    thumbnail: null,
    createdAt: '2026-04-04 10:00',
    imageCount: 5,
    docCount: 5
  },
  {
    id: 2,
    name: '구매 프로세스',
    thumbnail: null,
    createdAt: '2026-04-08 14:30',
    imageCount: 3,
    docCount: 2
  }
])

const curProject = ref<Project | null>({
  id: 1,
  name: 'AI 마켓 솔루션 구매',
  description: 'AI 마켓에서 솔루션을 검색하고 구매하는 전체 프로세스에 대한 매뉴얼',
  status: '진행중',
  serv_url: 'https://www.google.com',
  delete_yn: 0,
  created_at: '2026-04-01',
  updated_at: '2026-04-10'
})

const onEditProject = (): void => {
  if (!curProject.value) return
  modalEditProjectRef.value?.onOpenEdit({
    id: String(curProject.value.id),
    name: curProject.value.name,
    description: curProject.value.description,
    thumbnail: projectThumbnail.value
  })
}

const onSubmitEditProject = (payload: {
  id?: string
  name: string
  description: string
  thumbnail: string | null
}): void => {
  if (!curProject.value) return
  curProject.value.name = payload.name
  curProject.value.description = payload.description
  projectThumbnail.value = payload.thumbnail
}

const onClickNewWorkspace = (): void => {
  modalNewWorkspaceRef.value?.onOpen()
}

const onSubmitWorkspace = (payload: WorkspacePayload): void => {
  if (payload.id != null) {
    const ws = workspaces.value.find((w) => w.id === payload.id)
    if (ws) {
      ws.name = payload.name
      ws.thumbnail = payload.thumbnail
    }
  } else {
    const now = new Date()
    const pad = (n: number): string => String(n).padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    workspaces.value.push({
      id: nextWsId++,
      name: payload.name,
      thumbnail: payload.thumbnail,
      createdAt: dateStr,
      imageCount: 0,
      docCount: 0
    })
  }
}

const onClickDeleteProject = (): void => {
  confirmMsgHtml.value = `
  <div class="text-center">
    <h3 class="text-lg font-bold mb-2">"${curProject.value?.name}"</h3>
    <p class="text-sm text-gray-500">프로젝트를 삭제하시겠습니까?</p>
  </div>
  `
  onConfirmCallback = (): void => {
    console.log('프로젝트 삭제')
  }
  modalConfirmRef.value?.onOpen()
}
</script>
