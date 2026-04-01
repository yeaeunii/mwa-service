<template>
  <div class="h-screen overflow-hidden bg-base-200">
    <div class="pt-3 px-5">
      <div class="flex justify-between items-center">
        <div class="text-[1.6rem] font-black tracking-[-0.04em] text-[#1b2235] md:text-[2rem]">
          {{ project.title }}
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 font-semibold transition hover:text-primary"
          @click="goHome"
        >
          <i-lucide-menu />
        </button>
      </div>
      <p class="max-w-3xl text-xs font-bold leading-[1.5] text-[#8f97aa] md:text-sm">
        {{ project.description }}
        asdfasdfasdfasdf
      </p>
    </div>
    <div class="flex gap-2 items-center">
      <progress class="progress progress-primary w-full" value="10" max="100"></progress>
      <div
        class="w-35 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm"
      >
        전체 진행률 {{ project.progress }}%
      </div>
    </div>

    <div class="mx-auto flex h-full max-w-[1280px] flex-col pt-8">
      <div class="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div class="">
          <div class="text-lg font-bold mb-3">이미지 캡쳐 그룹</div>
          <div>
            <div v-for="folder in captureFolders" :key="folder.id">
              <div class="rounded-[24px] bg-white/70 p-3 flex items-center gap-2 shadow-sm">
                <div
                  class="overflow-hidden rounded-[14px] bg-[#efedf2] w-30 h-20 border border-[#e8e4ee] shadow-sm"
                >
                  <img
                    v-if="folder.thumbnail"
                    :src="folder.thumbnail"
                    alt=""
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-[linear-gradient(135deg,#ece9f1,#d8d2e7)] text-[#7f77a7]"
                  >
                    <i-lucide-image class="text-xl" />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <div class="text-sm font-bold">{{ folder.title }}</div>
                  <div class="text-xs text-gray-500 flex gap-2">
                    <i-lucide-images class="text-xs" /> {{ folder.itemCount }}개
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div
              v-if="captureFolders.length === 0"
              class="rounded-[24px] bg-white/70 p-8 text-center text-xs font-semibold text-[#8e8a97]"
            >
              아직 생성된 캡쳐 폴더가 없습니다.
            </div>

            <div v-else class="min-h-0 flex-1 overflow-y-auto pr-1">
              <div class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
                <article
                  v-for="folder in captureFolders"
                  :key="folder.id"
                  class="rounded-[18px] bg-white p-2.5 shadow-[0_8px_18px_rgba(56,52,68,0.08)]"
                >
                  <div class="overflow-hidden rounded-[14px] bg-[#efedf2]">
                    <img
                      v-if="folder.thumbnail"
                      :src="folder.thumbnail"
                      alt=""
                      class="h-20 w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-20 items-center justify-center bg-[linear-gradient(135deg,#ece9f1,#d8d2e7)] text-[#7f77a7]"
                    >
                      <i-lucide-image class="text-xl" />
                    </div>
                  </div>

                  <div class="mt-2">
                    <div class="flex items-start gap-2">
                      <div class="min-w-0 flex-1">
                        <input
                          v-if="editingFolderId === folder.id"
                          v-model="editingFolderTitle"
                          type="text"
                          class="w-full rounded-xl border border-[#d9d3e3] bg-white px-2.5 py-1.5 text-sm font-black tracking-[-0.04em] text-[#25252b] outline-none focus:border-[#695fc5]"
                          @keydown.enter.prevent="commitFolderTitle(folder.id)"
                          @keydown.esc.prevent="cancelFolderEdit"
                          @blur="commitFolderTitle(folder.id)"
                        />
                        <div
                          v-else
                          class="text-[0.9rem] font-black tracking-[-0.04em] text-[#25252b]"
                        >
                          {{ folder.title }}
                        </div>
                      </div>
                      <div class="relative">
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#6d7284] shadow-[0_4px_10px_rgba(33,37,54,0.08)] transition hover:bg-[#f5f6fa]"
                          @click.stop="toggleFolderMenu(folder.id)"
                        >
                          <i-lucide-ellipsis-vertical class="text-sm" />
                        </button>
                        <div
                          v-if="openedFolderMenuId === folder.id"
                          class="absolute right-0 top-12 z-20 min-w-[120px] rounded-2xl border border-[#ebe7f0] bg-white p-2 shadow-[0_16px_30px_rgba(39,35,56,0.12)]"
                        >
                          <button
                            type="button"
                            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f4f1fb]"
                            @click.stop="openEditFromMenu(folder)"
                          >
                            <i-lucide-pencil class="text-sm" />
                            수정
                          </button>
                          <button
                            type="button"
                            class="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-[#fff1f3]"
                            @click.stop="removeFolder(folder.id)"
                          >
                            <i-lucide-trash-2 class="text-sm" />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      class="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#7f7b86]"
                    >
                      <i-lucide-folder class="text-xs" />
                      <span>{{ folder.itemCount }}개 항목</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="mt-2.5 w-full rounded-xl border border-[#e8e4ee] bg-white px-3 py-1.5 text-[10px] font-bold text-[#33303a] transition hover:border-[#695fc5] hover:text-[#695fc5]"
                    @click="goCaptureArea(folder.id)"
                  >
                    작업 이어하기
                  </button>
                </article>
              </div>
            </div>
          </div>
        </div>
        <div class="border border-gray-200 rounded-2xl p-4 shadow-md">
          <div class="text-lg font-bold">문서 작성</div>
        </div>
      </div>
    </div>

    <div class="mx-auto flex h-full max-w-[1280px] flex-col pt-8">
      <div class="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          class="flex min-h-0 flex-col rounded-[26px] bg-[#f1eef2] p-4 shadow-[0_10px_28px_rgba(55,50,70,0.08)]"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-[1.65rem] font-black tracking-[-0.04em] text-[#25252b]">
                캡쳐 이미지
              </h2>
              <p class="mt-1 text-xs font-semibold text-[#8e8a97]">
                프로젝트별 화면 캡쳐 및 자산 관리
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#695fc5] px-3 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_rgba(105,95,197,0.2)] transition hover:bg-[#584eb8]"
              @click="createFolderDirect('capture')"
            >
              <i-lucide-plus-circle class="text-sm" />
              새 폴더 생성
            </button>
          </div>

          <div
            v-if="captureFolders.length === 0"
            class="rounded-[24px] bg-white/70 p-8 text-center text-xs font-semibold text-[#8e8a97]"
          >
            아직 생성된 캡쳐 폴더가 없습니다.
          </div>

          <div v-else class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
              <article
                v-for="folder in captureFolders"
                :key="folder.id"
                class="rounded-[18px] bg-white p-2.5 shadow-[0_8px_18px_rgba(56,52,68,0.08)]"
              >
                <div class="overflow-hidden rounded-[14px] bg-[#efedf2]">
                  <div v-if="folder.screenshots.length > 0"></div>
                  <!-- <img
                    v-if="folder.thumbnail"
                    :src="folder.thumbnail"
                    alt=""
                    class="h-20 w-full object-cover"
                  /> -->
                  <div
                    v-else
                    class="flex h-20 items-center justify-center bg-[linear-gradient(135deg,#ece9f1,#d8d2e7)] text-[#7f77a7]"
                  >
                    <i-lucide-image class="text-xl" />
                  </div>
                </div>

                <div class="mt-2">
                  <div class="flex items-start gap-2">
                    <div class="min-w-0 flex-1">
                      <input
                        v-if="editingFolderId === folder.id"
                        v-model="editingFolderTitle"
                        type="text"
                        class="w-full rounded-xl border border-[#d9d3e3] bg-white px-2.5 py-1.5 text-sm font-black tracking-[-0.04em] text-[#25252b] outline-none focus:border-[#695fc5]"
                        @keydown.enter.prevent="commitFolderTitle(folder.id)"
                        @keydown.esc.prevent="cancelFolderEdit"
                        @blur="commitFolderTitle(folder.id)"
                      />
                      <div
                        v-else
                        class="text-[0.9rem] font-black tracking-[-0.04em] text-[#25252b]"
                      >
                        {{ folder.title }}
                      </div>
                    </div>
                    <div class="relative">
                      <button
                        type="button"
                        class="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#6d7284] shadow-[0_4px_10px_rgba(33,37,54,0.08)] transition hover:bg-[#f5f6fa]"
                        @click.stop="toggleFolderMenu(folder.id)"
                      >
                        <i-lucide-ellipsis-vertical class="text-sm" />
                      </button>
                      <div
                        v-if="openedFolderMenuId === folder.id"
                        class="absolute right-0 top-12 z-20 min-w-[120px] rounded-2xl border border-[#ebe7f0] bg-white p-2 shadow-[0_16px_30px_rgba(39,35,56,0.12)]"
                      >
                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f4f1fb]"
                          @click.stop="openEditFromMenu(folder)"
                        >
                          <i-lucide-pencil class="text-sm" />
                          수정
                        </button>
                        <button
                          type="button"
                          class="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-[#fff1f3]"
                          @click.stop="removeFolder(folder.id)"
                        >
                          <i-lucide-trash-2 class="text-sm" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    class="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#7f7b86]"
                  >
                    <i-lucide-folder class="text-xs" />
                    <span>{{ folder.itemCount }}개 항목</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="mt-2.5 w-full rounded-xl border border-[#e8e4ee] bg-white px-3 py-1.5 text-[10px] font-bold text-[#33303a] transition hover:border-[#695fc5] hover:text-[#695fc5]"
                  @click="goCaptureArea(folder.id)"
                >
                  작업 이어하기
                </button>
              </article>
            </div>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col rounded-[26px] bg-[#f1eef2] p-4 shadow-[0_10px_28px_rgba(55,50,70,0.08)]"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-[1.65rem] font-black tracking-[-0.04em] text-[#25252b]">
                문서 생성 영역
              </h2>
              <p class="mt-1 text-xs font-semibold text-[#8e8a97]">
                분석 및 기획 리포트 워크플로우
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#695fc5] px-3 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_rgba(105,95,197,0.2)] transition hover:bg-[#584eb8]"
              @click="createFolderDirect('document')"
            >
              <i-lucide-plus-circle class="text-sm" />
              새 폴더 생성
            </button>
          </div>

          <div
            v-if="documentFolders.length === 0"
            class="rounded-[24px] bg-white/70 p-8 text-center text-xs font-semibold text-[#8e8a97]"
          >
            아직 생성된 문서 폴더가 없습니다.
          </div>

          <div v-else class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div class="space-y-3">
              <article
                v-for="folder in documentFolders"
                :key="folder.id"
                class="rounded-[18px] bg-white p-3 shadow-[0_8px_18px_rgba(56,52,68,0.08)]"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#ddd6ff] text-[#5f59c6]"
                  >
                    <i-lucide-file-text class="text-sm" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <input
                          v-if="editingFolderId === folder.id"
                          v-model="editingFolderTitle"
                          type="text"
                          class="w-full rounded-xl border border-[#d9d3e3] bg-white px-2.5 py-1.5 text-sm font-black tracking-[-0.04em] text-[#35333c] outline-none focus:border-[#695fc5]"
                          @keydown.enter.prevent="commitFolderTitle(folder.id)"
                          @keydown.esc.prevent="cancelFolderEdit"
                          @blur="commitFolderTitle(folder.id)"
                        />
                        <div
                          v-else
                          class="truncate text-[0.95rem] font-black tracking-[-0.04em] text-[#35333c]"
                        >
                          {{ folder.title }}
                        </div>
                        <div class="mt-0.5 text-[10px] font-semibold text-[#8e8a97]">
                          최종 수정: {{ folder.updatedLabel }}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          :class="folder.badgeClass"
                        >
                          {{ folder.statusLabel }}
                        </span>
                        <div class="relative">
                          <button
                            type="button"
                            class="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#6d7284] shadow-[0_4px_10px_rgba(33,37,54,0.08)] transition hover:bg-[#f5f6fa]"
                            @click.stop="toggleFolderMenu(folder.id)"
                          >
                            <i-lucide-ellipsis-vertical class="text-sm" />
                          </button>
                          <div
                            v-if="openedFolderMenuId === folder.id"
                            class="absolute right-0 top-12 z-20 min-w-[120px] rounded-2xl border border-[#ebe7f0] bg-white p-2 shadow-[0_16px_30px_rgba(39,35,56,0.12)]"
                          >
                            <button
                              type="button"
                              class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#374151] transition hover:bg-[#f4f1fb]"
                              @click.stop="openEditFromMenu(folder)"
                            >
                              <i-lucide-pencil class="text-sm" />
                              수정
                            </button>
                            <button
                              type="button"
                              class="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-[#fff1f3]"
                              @click.stop="removeFolder(folder.id)"
                            >
                              <i-lucide-trash-2 class="text-sm" />
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      class="mt-2.5 flex items-center justify-between gap-3 text-[10px] font-bold text-[#8e8a97]"
                    >
                      <span>진척도</span>
                      <span class="text-[#4c4958]">{{ folder.progress }}%</span>
                    </div>
                    <div class="mt-2 h-1.5 rounded-full bg-[#e9e6ee]">
                      <div
                        class="h-full rounded-full bg-[#6256c9]"
                        :style="{ width: `${folder.progress}%` }"
                      ></div>
                    </div>

                    <div class="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        class="rounded-xl px-3 py-1.5 text-[10px] font-bold transition"
                        :class="
                          folder.progress >= 100
                            ? 'border border-[#e8e4ee] bg-white text-[#3b3942] hover:border-[#695fc5] hover:text-[#695fc5]'
                            : 'bg-[#695fc5] text-white hover:bg-[#584eb8]'
                        "
                        @click="goDocumentArea(folder.id)"
                      >
                        {{ folder.progress >= 100 ? '보기' : '수정하기' }}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { toFileImageSrc } from '@/utils/manualWorkspace'

type FolderArea = 'capture' | 'document'

interface DashboardProject {
  id: string
  title: string
  description: string
  progress: number
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
}

interface WorkspaceResponse {
  project: {
    id: string
    name: string
    description: string
    progress: number
    status: 'draft' | 'in_progress' | 'completed' | 'archived'
  } | null
  folders: Array<{
    id: string
    title: string
    path: string
    description: string
    area_type: FolderArea
    updated_at: string
    screenshots: Array<{
      id: string
      image_path: string
      image_src?: string
      is_selected: number
      annotations: Array<{
        description: string
        tool_type: 'number' | 'box'
      }>
    }>
  }>
}

interface DashboardFolderItem {
  id: string
  title: string
  path: string
  description: string
  areaType: FolderArea
  updatedAt: string
  thumbnail: string | null
  itemCount: number
  progress: number
  statusLabel: string
  badgeClass: string
  updatedLabel: string
}

const router = useRouter()
const route = useRoute()

const projectId = computed(() => String(route.query.projectId ?? ''))
const project = ref<DashboardProject>({
  id: '',
  title: '프로젝트 없음',
  description: '프로젝트를 먼저 생성하거나 선택하세요.',
  progress: 0,
  status: 'draft'
})
const folders = ref<DashboardFolderItem[]>([])
const editingFolderId = ref<string | null>(null)
const editingFolderTitle = ref('')
const openedFolderMenuId = ref<string | null>(null)

const formatUpdatedLabel = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const getFolderProgress = (folder: WorkspaceResponse['folders'][number]): number => {
  const total = folder.screenshots.length
  if (total === 0) return 0

  const selectedCount = folder.screenshots.filter((shot) => shot.is_selected === 1).length
  const documentedCount = folder.screenshots.filter((shot) =>
    shot.annotations.some(
      (annotation) => annotation.tool_type === 'number' && annotation.description.trim().length > 0
    )
  ).length

  if (selectedCount === 0) {
    return 33
  }

  if (documentedCount >= selectedCount) {
    return 100
  }

  return 66
}

const getFolderStatus = (
  progress: number
): Pick<DashboardFolderItem, 'statusLabel' | 'badgeClass'> => {
  if (progress >= 100) {
    return {
      statusLabel: '완료',
      badgeClass: 'bg-[#e7e4e8] text-[#797381]'
    }
  }

  if (progress > 0) {
    return {
      statusLabel: '편집 중',
      badgeClass: 'bg-[#e8ecff] text-[#6972d8]'
    }
  }

  return {
    statusLabel: '준비 중',
    badgeClass: 'bg-[#efecef] text-[#8f8a94]'
  }
}

const mapFolderItem = (folder: WorkspaceResponse['folders'][number]): DashboardFolderItem => {
  const progress = getFolderProgress(folder)
  const status = getFolderStatus(progress)

  return {
    id: folder.id,
    title: folder.title,
    path: folder.path,
    description: folder.description,
    areaType: folder.area_type,
    updatedAt: folder.updated_at,
    thumbnail:
      folder.screenshots[0]?.image_src ??
      (folder.screenshots[0]?.image_path ? toFileImageSrc(folder.screenshots[0].image_path) : null),
    itemCount: folder.screenshots.length,
    progress,
    statusLabel: status.statusLabel,
    badgeClass: status.badgeClass,
    updatedLabel: formatUpdatedLabel(folder.updated_at)
  }
}

const captureFolders = computed(() =>
  folders.value.filter((folder) => folder.areaType === 'capture')
)
const documentFolders = computed(() =>
  folders.value.filter((folder) => folder.areaType === 'document')
)
const normalizedFolderTitles = computed(
  () => new Set(folders.value.map((folder) => folder.title.trim().toLocaleLowerCase()))
)

const loadDashboard = async (): Promise<void> => {
  if (!projectId.value) return

  const response = (await window.api.invoke('workspace:get', {
    projectId: projectId.value
  })) as WorkspaceResponse

  if (response.project) {
    project.value = {
      id: response.project.id,
      title: response.project.name,
      description: response.project.description,
      progress: response.project.progress,
      status: response.project.status
    }
  }

  folders.value = response.folders.map(mapFolderItem)
}

const syncFoldersToDatabase = async (): Promise<void> => {
  await window.api.invoke('capture:syncFolders', {
    projectId: projectId.value,
    projectName: project.value.title,
    projectDescription: project.value.description,
    areaScope: undefined,
    folders: folders.value.map((folder, index) => ({
      id: folder.id,
      title: folder.title,
      description: folder.description,
      path: folder.path,
      areaType: folder.areaType,
      sortOrder: index
    }))
  })
}

const buildUniqueFolderTitle = (area: FolderArea): string => {
  const baseTitle = area === 'capture' ? '새 캡쳐 폴더' : '새 문서 폴더'

  if (!normalizedFolderTitles.value.has(baseTitle.toLocaleLowerCase())) {
    return baseTitle
  }

  let index = 2
  while (normalizedFolderTitles.value.has(`${baseTitle} ${index}`.toLocaleLowerCase())) {
    index += 1
  }

  return `${baseTitle} ${index}`
}

const createFolderDirect = async (area: FolderArea): Promise<void> => {
  const now = new Date().toISOString()
  folders.value = [
    ...folders.value,
    {
      id: `folder-${Date.now()}`,
      title: buildUniqueFolderTitle(area),
      path: '',
      description: '',
      areaType: area,
      updatedAt: now,
      thumbnail: null,
      itemCount: 0,
      progress: 0,
      statusLabel: '준비 중',
      badgeClass: 'bg-[#efecef] text-[#8f8a94]',
      updatedLabel: formatUpdatedLabel(now)
    }
  ]
  await syncFoldersToDatabase()
  await loadDashboard()
}

const startFolderEdit = (folder: DashboardFolderItem): void => {
  openedFolderMenuId.value = null
  editingFolderId.value = folder.id
  editingFolderTitle.value = folder.title
}

const toggleFolderMenu = (folderId: string): void => {
  openedFolderMenuId.value = openedFolderMenuId.value === folderId ? null : folderId
}

const openEditFromMenu = (folder: DashboardFolderItem): void => {
  startFolderEdit(folder)
}

const cancelFolderEdit = (): void => {
  editingFolderId.value = null
  editingFolderTitle.value = ''
}

const commitFolderTitle = async (folderId: string): Promise<void> => {
  const title = editingFolderTitle.value.trim()
  const currentFolder = folders.value.find((folder) => folder.id === folderId)

  if (!currentFolder) {
    cancelFolderEdit()
    return
  }

  if (!title) {
    cancelFolderEdit()
    return
  }

  const duplicated = folders.value.some(
    (folder) =>
      folder.id !== folderId &&
      folder.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase()
  )

  if (duplicated) {
    editingFolderTitle.value = currentFolder.title
    return
  }

  const now = new Date().toISOString()
  folders.value = folders.value.map((folder) =>
    folder.id === folderId
      ? {
          ...folder,
          title,
          updatedAt: now,
          updatedLabel: formatUpdatedLabel(now)
        }
      : folder
  )

  cancelFolderEdit()
  openedFolderMenuId.value = null
  await syncFoldersToDatabase()
  await loadDashboard()
}

const removeFolder = async (folderId: string): Promise<void> => {
  folders.value = folders.value.filter((folder) => folder.id !== folderId)
  openedFolderMenuId.value = null

  if (editingFolderId.value === folderId) {
    cancelFolderEdit()
  }

  await syncFoldersToDatabase()
  await loadDashboard()
}

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goCaptureArea = async (folderId: string): Promise<void> => {
  await router.push({
    name: 'capture-index',
    query: {
      projectId: projectId.value,
      folderId
    }
  })
}

const goDocumentArea = async (folderId: string): Promise<void> => {
  await router.push({
    name: 'workspace-index',
    query: {
      projectId: projectId.value,
      folderId
    }
  })
}

onMounted(() => {
  void loadDashboard()
})
</script>
