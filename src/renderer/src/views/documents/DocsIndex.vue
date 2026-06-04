<template>
  <div class="drawer h-dvh overflow-hidden lg:drawer-open drawer-end">
    <input id="drawerRight" v-model="isDocDrawerOpen" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex h-dvh min-h-0 flex-col overflow-hidden">
      <!-- Navbar -->
      <nav class="navbar h-[72px] shrink-0 border-b border-base-content/10 bg-base-100 px-4">
        <div class="flex flex-1 items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="goBack">
            <i-lucide-arrow-left class="h-4 w-4" />
          </button>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <i-lucide-file-text class="h-4 w-4 text-primary" />
            </div>
            <div>
              <div class="text-sm font-bold leading-tight">문서 편집</div>
              <div
                v-if="currentAutoSaveState.status !== 'idle'"
                class="mt-0.5 flex items-center gap-1 text-xs text-base-content/50"
              >
                <template v-if="isAutoSaving">
                  <i-lucide-loader-circle class="h-3 w-3 animate-spin text-primary" />
                  {{ autoSaveMessage }}
                </template>
                <template v-else-if="currentAutoSaveState.status === 'saved'">
                  <i-lucide-check-circle class="h-3 w-3 text-primary" />
                  {{ autoSaveMessage }}
                </template>
                <template v-else-if="currentAutoSaveState.status === 'error'">
                  <i-lucide-circle-alert class="h-3 w-3 text-error" />
                  {{ autoSaveMessage }}
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" :disabled="!prevDoc" @click="goPrevDoc">
            <i-lucide-chevron-left class="h-4 w-4" />
          </button>
          <div class="flex h-8 items-center px-2 text-sm font-bold tabular-nums">
            {{ selectedDocIndex }} / {{ docs.length }}
          </div>
          <button class="btn btn-ghost btn-sm" :disabled="!nextDoc" @click="goNextDoc">
            <i-lucide-chevron-right class="h-4 w-4" />
          </button>
        </div>
      </nav>

      <!-- Page content -->
      <div
        ref="pageContentRef"
        class="min-h-0 flex-1 bg-base-200"
        :class="currentDocHasFunctionItems ? 'overflow-y-auto' : 'overflow-hidden'"
      >
        <div class="mx-auto box-border w-full max-w-[960px] p-2 md:p-3">
          <div ref="carouselRef" class="carousel w-full">
            <div
              v-for="doc in docs"
              :id="`slide-item-${doc.id}`"
              :key="doc.id"
              :data-doc-id="doc.id"
              class="carousel-item w-full"
            >
              <div class="w-full">
                <div
                  :class="
                    isDoneDoc(doc)
                      ? 'rounded-xl border border-base-content/10 bg-base-100 shadow-sm'
                      : 'rounded-xl border border-base-content/10 bg-base-100 shadow-sm'
                  "
                >
                  <template v-if="isDoneDoc(doc)">
                    <div class="space-y-5 p-5">
                      <div>
                        <div class="flex items-start gap-3">
                          <h1 class="min-w-0 flex-1 break-words text-2xl font-black leading-tight">
                            {{ getDocTitle(doc) }}
                          </h1>
                          <button
                            type="button"
                            class="btn btn-sm shrink-0 gap-1.5"
                            :class="isDoneDoc(doc) ? 'btn-success' : 'btn-outline btn-success'"
                            @click="toggleDocDone(doc)"
                          >
                            <i-lucide-check-circle class="h-4 w-4" />
                            {{ isDoneDoc(doc) ? '작업완료' : '작업중' }}
                          </button>
                        </div>
                        <div
                          class="mt-4 flex items-center gap-2 text-xs font-medium text-base-content/60"
                        >
                          <i-lucide-folder-open class="h-3.5 w-3.5 text-primary" />
                          <span class="font-bold">경로 :</span>
                          <span>{{ doc.entryPath || '입력된 화면 경로가 없습니다' }}</span>
                        </div>
                      </div>

                      <section class="rounded-md border border-blue-200 bg-blue-50 p-4">
                        <h2 class="mb-2 text-sm font-black text-blue-900">화면 설명</h2>
                        <p class="whitespace-pre-line text-sm leading-6 text-slate-700">
                          {{ getDocDescription(doc) }}
                        </p>
                      </section>

                      <section>
                        <div class="mb-3 flex items-center gap-2 text-base font-black">
                          <i-lucide-check class="h-4 w-4 text-primary" />
                          <span>기능 설명</span>
                        </div>
                        <div class="overflow-hidden border border-base-content/20 bg-white">
                          <img
                            :src="doc.thumbnail"
                            class="max-h-[420px] w-full object-contain"
                            style="max-height: 420px"
                          />
                        </div>
                      </section>

                      <section>
                        <div class="overflow-hidden border border-base-content/20">
                          <table class="table table-sm w-full">
                            <thead class="bg-[#eef2f7] text-[#1f3554]">
                              <tr>
                                <th class="w-16 border border-slate-300 px-3 py-2 text-center">
                                  번호
                                </th>
                                <th class="border border-slate-300 px-3 py-2 text-center">
                                  상세 설명
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="item in doc.functionItems" :key="item.annotationId">
                                <td class="border border-slate-300 px-3 py-3 text-center align-top">
                                  <span
                                    class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black text-white"
                                    :style="{ backgroundColor: getNumberColor(doc) }"
                                  >
                                    {{ item.number }}
                                  </span>
                                </td>
                                <td class="break-all border border-slate-300 px-3 py-3 text-sm">
                                  {{ item.text || '작성된 기능 설명이 없습니다' }}
                                </td>
                              </tr>
                              <tr v-if="doc.functionItems.length === 0">
                                <td
                                  colspan="2"
                                  class="py-5 text-center text-sm text-base-content/40"
                                >
                                  작성된 기능 설명이 없습니다
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </template>

                  <template v-else>
                    <!-- Form Header -->
                    <div class="border-b border-base-content/5 p-5">
                      <div class="mb-4 flex items-start gap-50">
                        <label class="floating-label block min-w-0 flex-1">
                          <span class="text-sm font-medium">문서 제목</span>
                          <input
                            v-model="doc.title"
                            type="text"
                            class="input input-ghost h-10 w-full border-0 bg-slate-50 text-lg font-bold shadow-none focus:outline-none"
                            placeholder="문서 제목을 입력하세요"
                            @input="scheduleAutoSave(doc)"
                          />
                        </label>
                        <button
                          type="button"
                          class="btn btn-sm mt-0.5 shrink-0 gap-1.5"
                          :class="isDoneDoc(doc) ? 'btn-success' : 'btn-outline btn-success'"
                          @click="toggleDocDone(doc)"
                        >
                          <i-lucide-check-circle class="h-4 w-4" />
                          {{ isDoneDoc(doc) ? '작업완료' : '작업중' }}
                        </button>
                      </div>

                      <label class="floating-label mb-4 block w-full">
                        <span class="text-sm font-medium">화면 경로</span>
                        <div
                          class="input input-ghost flex h-10 w-full items-center gap-2 border-0 bg-slate-50 shadow-none focus-within:outline-none"
                        >
                          <i-lucide-folder class="h-4 w-4 shrink-0 text-base-content/45" />
                          <input
                            v-model="doc.entryPath"
                            type="text"
                            placeholder="화면 경로 ex) 메인>로그인"
                            class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-base-content/45"
                            @input="scheduleAutoSave(doc)"
                          />
                        </div>
                      </label>

                      <label class="floating-label block w-full">
                        <span class="text-sm font-medium">문서 설명</span>
                        <textarea
                          v-model.trim="doc.description"
                          rows="2"
                          placeholder="문서 설명을 입력해주세요"
                          class="textarea textarea-ghost w-full resize-none border-0 bg-slate-50 shadow-none focus:outline-none"
                          @input="scheduleAutoSave(doc)"
                        ></textarea>
                      </label>
                    </div>
                    <!-- Screenshot -->
                    <div class="p-5">
                      <div class="flex items-center gap-20">
                        <span class="text-sm font-semibold">기능 설명</span>
                      </div>
                    </div>

                    <div class="group relative bg-base-200">
                      <img
                        :src="doc.thumbnail"
                        class="w-full object-contain"
                        style="max-height: clamp(240px, calc(100dvh - 610px), 380px)"
                      />
                      <div
                        class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
                      >
                        <router-link
                          :to="`/documents/${doc.id}/annotation`"
                          class="flex flex-col items-center gap-3 text-white opacity-0 transition-all duration-200 group-hover:opacity-100"
                        >
                          <span
                            class="flex h-14 w-14 items-center justify-center rounded-full border-none bg-white/90 text-base-content shadow-lg transition-colors hover:bg-white"
                          >
                            <i-lucide-pencil class="h-5 w-5" />
                          </span>
                          <span class="text-sm font-semibold drop-shadow">
                            클릭 후 화면 구성을 편집해주세요
                          </span>
                        </router-link>
                      </div>
                    </div>

                    <!-- Step List -->
                    <div class="p-5">
                      <ol class="space-y-2">
                        <li
                          v-for="item in doc.functionItems"
                          :key="item.annotationId"
                          class="flex items-start gap-3 rounded-lg border border-base-content/5 bg-base-200/50 p-3 transition-colors hover:bg-base-200"
                        >
                          <div
                            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
                          >
                            {{ item.number }}
                          </div>
                          <div class="min-w-0 flex-1 pt-0.5">
                            <div class="break-all text-sm font-medium leading-relaxed">
                              {{ item.text || '기능 설명이 없습니다' }}
                            </div>
                          </div>
                        </li>
                      </ol>
                      <div
                        v-if="doc.functionItems.length === 0"
                        class="rounded-lg border border-dashed border-base-content/10 bg-base-200/30 p-4 text-center text-sm text-base-content/40"
                      >
                        작성된 기능 설명이 없습니다
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <label
      for="drawerRight"
      class="fixed top-1/2 z-50 flex h-12 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-base-content/10 bg-white text-base-content/40 shadow-sm transition-all hover:border-primary/30 hover:text-primary hover:shadow-md"
      :class="isDocDrawerOpen ? 'right-[17.75rem]' : 'right-1'"
      :aria-label="isDocDrawerOpen ? '문서 목록 닫기' : '문서 목록 열기'"
    >
      <i-lucide-chevron-right v-if="isDocDrawerOpen" class="h-4 w-4" />
      <i-lucide-chevron-left v-else class="h-4 w-4" />
    </label>

    <!-- Sidebar -->
    <div class="drawer-side is-drawer-close:overflow-visible relative z-20">
      <label for="drawerRight" aria-label="close sidebar" class="drawer-overlay"></label>
      <div
        class="flex h-screen min-h-0 flex-col border-l border-base-content/10 bg-base-100 is-drawer-close:w-0 is-drawer-open:w-72"
      >
        <div class="flex min-h-0 w-full flex-1 flex-col is-drawer-close:hidden">
          <div
            class="flex h-[72px] shrink-0 items-center justify-between border-b border-base-content/5 px-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">문서 목록</span>
              <span class="badge badge-sm badge-ghost">{{ docs.length }}</span>
            </div>
          </div>
          <div class="shrink-0 space-y-2 border-b border-base-content/5 px-3 py-2">
            <div
              class="flex items-center gap-1 rounded-md bg-base-200 p-1 text-[11px] font-bold text-base-content/55"
            >
              <button
                type="button"
                class="h-6 flex-1 rounded px-2 transition-colors"
                :class="docListFilter === 'all' ? 'bg-base-100 text-base-content shadow-sm' : ''"
                @click="docListFilter = 'all'"
              >
                전체
              </button>
              <button
                type="button"
                class="h-6 flex-1 rounded px-2 transition-colors"
                :class="docListFilter === 'doing' ? 'bg-base-100 text-base-content shadow-sm' : ''"
                @click="docListFilter = 'doing'"
              >
                작업중
              </button>
              <button
                type="button"
                class="h-6 flex-1 rounded px-2 transition-colors"
                :class="docListFilter === 'done' ? 'bg-base-100 text-base-content shadow-sm' : ''"
                @click="docListFilter = 'done'"
              >
                작업완료
              </button>
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <div class="space-y-2">
              <a
                v-for="doc in filteredSidebarDocs"
                :key="doc.id"
                class="group block cursor-pointer overflow-hidden rounded-lg border-2 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md"
                :class="
                  selectedDocId === doc.id
                    ? 'border-primary shadow-primary/10'
                    : 'border-transparent hover:border-base-content/10'
                "
                @click="onClickSelectDoc(doc.id)"
              >
                <div class="relative bg-base-200">
                  <img :src="doc.thumbnail" class="h-24 w-full object-cover" />
                  <div
                    class="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[10px] font-black tabular-nums shadow-sm transition-colors duration-200"
                    :class="
                      selectedDocId === doc.id
                        ? 'bg-primary text-primary-content'
                        : 'bg-primary/30 text-primary'
                    "
                  >
                    {{ getDocOrder(doc) }}
                  </div>
                </div>
                <div class="min-w-0 p-2.5">
                  <div class="flex min-w-0 items-center justify-between gap-2">
                    <div class="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">
                      {{ getDocTitle(doc) }}
                    </div>
                    <div
                      class="badge badge-xs shrink-0 border-0 font-bold"
                      :class="docStatusClass(doc)"
                    >
                      {{ docStatusText(doc) }}
                    </div>
                  </div>
                  <div
                    class="mt-0.5 line-clamp-2 min-h-8 overflow-hidden break-all text-xs leading-relaxed text-base-content/50"
                  >
                    {{ getDocDescription(doc) }}
                  </div>
                </div>
              </a>
            </div>
            <div
              v-if="filteredSidebarDocs.length === 0"
              class="flex min-h-40 items-center justify-center text-center text-sm text-base-content/40"
            >
              조건에 맞는 문서가 없습니다
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDocList, updateDoc, updateDocStatus } from '@/database'

const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => route.params.id)
const routeDocId = computed(() => Number(route.params.docId || 0))
const selectedDocId = ref(0)
const carouselRef = ref<HTMLElement | null>(null)
const pageContentRef = ref<HTMLElement | null>(null)
const isDocDrawerOpen = ref(true)

type Doc = {
  id: number
  title: string
  description: string
  status: string
  entryPath: string
  docMetaJson: string
  annotationJson: string
  functionItems: FunctionContentItem[]
  thumbnail: string
  createdAt: string
  updatedAt: string
}

type FunctionContentItem = {
  annotationId: string
  number: number
  text: string
}

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

type AutoSaveState = {
  status: AutoSaveStatus
  savedAt: number | null
}

const EMPTY_DOC_TITLE = '제목 없는 문서'
const EMPTY_DOC_DESCRIPTION = '문서 설명을 아직 작성하지 않았습니다.'

const docs = ref<Doc[]>([])
const docListFilter = ref<'all' | 'doing' | 'done'>('all')
const nowTime = ref(Date.now())
const autoSaveByDoc = reactive<Record<number, AutoSaveState>>({})
const autoSaveTimers = new Map<number, number>()
const autoSaveVersions = new Map<number, number>()

const selectedDocIndex = computed(() => {
  const index = docs.value.findIndex((doc) => doc.id === selectedDocId.value)
  return index === -1 ? 0 : index + 1
})

const currentDocIndex = computed(() =>
  docs.value.findIndex((doc) => doc.id === selectedDocId.value)
)
const prevDoc = computed(() => docs.value[currentDocIndex.value - 1] ?? null)
const nextDoc = computed(() => docs.value[currentDocIndex.value + 1] ?? null)

const goBack = (): void => {
  if (route.query.from === 'deliverable-structure') {
    void router.push({
      name: 'deliverable-structure',
      params: {
        id: String(route.query.projectId ?? ''),
        deliverableId: String(route.query.deliverableId ?? '')
      }
    })
    return
  }

  void router.push(`/workspace/${workspaceId.value}`)
}

const currentDoc = computed(() => docs.value.find((doc) => doc.id === selectedDocId.value) ?? null)
const currentDocHasFunctionItems = computed(() => (currentDoc.value?.functionItems.length ?? 0) > 0)
const isDoneDoc = (doc: Doc): boolean => doc.status === '작업완료'
const docStatusText = (doc: Doc): string => (isDoneDoc(doc) ? '작업완료' : '작업중')
const docStatusClass = (doc: Doc): string =>
  isDoneDoc(doc)
    ? 'border-success/20 bg-success/10 text-success'
    : 'border-info/20 bg-info/10 text-info'
const getDocTitle = (doc: Doc): string => doc.title.trim() || EMPTY_DOC_TITLE
const getDocDescription = (doc: Doc): string => doc.description.trim() || EMPTY_DOC_DESCRIPTION
const getNumberColor = (doc: Doc): string => {
  try {
    const parsed = JSON.parse(doc.annotationJson || '[]')
    if (!Array.isArray(parsed)) return '#f87171'

    const colorCounts = new Map<string, number>()
    parsed.forEach((item) => {
      if (item?.toolType !== 'number' || typeof item?.color !== 'string') return

      colorCounts.set(item.color, (colorCounts.get(item.color) ?? 0) + 1)
    })

    return [...colorCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '#f87171'
  } catch {
    return '#f87171'
  }
}
const getDocOrder = (doc: Doc): number => {
  const index = docs.value.findIndex((item) => item.id === doc.id)
  return index === -1 ? 0 : index + 1
}
const filteredSidebarDocs = computed(() => {
  return docs.value.filter((doc) => {
    const matchesStatus =
      docListFilter.value === 'all' ||
      (docListFilter.value === 'done' && isDoneDoc(doc)) ||
      (docListFilter.value === 'doing' && !isDoneDoc(doc))

    return matchesStatus
  })
})
const currentAutoSaveState = computed<AutoSaveState>(() =>
  currentDoc.value
    ? (autoSaveByDoc[currentDoc.value.id] ?? { status: 'idle', savedAt: null })
    : { status: 'idle', savedAt: null }
)
const isAutoSaving = computed(
  () =>
    currentAutoSaveState.value.status === 'pending' ||
    currentAutoSaveState.value.status === 'saving'
)
const autoSaveMessage = computed(() => {
  const state = currentAutoSaveState.value

  if (state.status === 'pending') return '저장 중'
  if (state.status === 'saving') return '자동저장 중'
  if (state.status === 'error') return '자동저장 실패'
  if (state.status !== 'saved' || !state.savedAt) return ''

  const diffSeconds = Math.max(0, Math.floor((nowTime.value - state.savedAt) / 1000))
  if (diffSeconds < 10) return '방금 전 자동저장'
  return '자동저장됨'
})

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

const parseDocMeta = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const parseFunctionItems = (value: string): FunctionContentItem[] => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        annotationId: String(item?.annotationId ?? ''),
        number: Number(item?.number ?? 0),
        text: String(item?.text ?? '')
      }))
      .filter((item) => item.annotationId)
      .sort((left, right) => left.number - right.number)
  } catch {
    return []
  }
}

const getNextAutoSaveVersion = (docId: number): number => {
  const nextVersion = (autoSaveVersions.get(docId) ?? 0) + 1
  autoSaveVersions.set(docId, nextVersion)
  return nextVersion
}

const saveDoc = async (doc: Doc, version: number): Promise<void> => {
  autoSaveByDoc[doc.id] = {
    status: 'saving',
    savedAt: autoSaveByDoc[doc.id]?.savedAt ?? null
  }

  const docMeta = parseDocMeta(doc.docMetaJson)
  docMeta.entry_path = doc.entryPath
  const docMetaJson = JSON.stringify(docMeta)

  const isSaved = await updateDoc({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    docMetaJson
  })

  if (autoSaveVersions.get(doc.id) !== version) return

  if (isSaved) {
    doc.docMetaJson = docMetaJson
    autoSaveByDoc[doc.id] = {
      status: 'saved',
      savedAt: Date.now()
    }
    return
  }

  autoSaveByDoc[doc.id] = {
    status: 'error',
    savedAt: autoSaveByDoc[doc.id]?.savedAt ?? null
  }
}

const scheduleAutoSave = (doc: Doc): void => {
  const version = getNextAutoSaveVersion(doc.id)
  const prevTimer = autoSaveTimers.get(doc.id)
  if (prevTimer) window.clearTimeout(prevTimer)

  autoSaveByDoc[doc.id] = {
    status: 'pending',
    savedAt: autoSaveByDoc[doc.id]?.savedAt ?? null
  }

  const timer = window.setTimeout(() => {
    autoSaveTimers.delete(doc.id)
    void saveDoc(doc, version)
  }, 600)

  autoSaveTimers.set(doc.id, timer)
}

const flushPendingAutoSaves = (): void => {
  autoSaveTimers.forEach((timer, docId) => {
    window.clearTimeout(timer)
    const doc = docs.value.find((item) => item.id === docId)
    const version = autoSaveVersions.get(docId)
    if (doc && version) void saveDoc(doc, version)
  })
  autoSaveTimers.clear()
}

const loadDocs = async (): Promise<void> => {
  const list = await getDocList({
    workspaceId: Number(workspaceId.value)
  })

  docs.value = list.map((doc) => {
    const docMeta = parseDocMeta(doc.doc_meta_json)

    const thumbnailPath = doc.draw_img_path || doc.orgn_img_path
    const thumbnailVersion = doc.draw_img_path ? `${doc.updated_at}-${Date.now()}` : doc.updated_at

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      status: doc.status === '작업완료' ? '작업완료' : '작업중',
      entryPath: String(docMeta.entry_path ?? ''),
      docMetaJson: doc.doc_meta_json,
      annotationJson: doc.annotation_json,
      functionItems: parseFunctionItems(doc.content_json),
      thumbnail: thumbnailPath
        ? toFileSrc(thumbnailPath, thumbnailVersion)
        : 'https://placehold.co/960x500/f1f5f9/94a3b8?text=Screenshot',
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }
  })
}

const scrollToDoc = (id: number): void => {
  const slide = document.getElementById(`slide-item-${id}`)
  if (slide) {
    slide.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    })
  }

  resetPageScrollIfNeeded(id)
}

const resetPageScrollIfNeeded = (id: number): void => {
  const doc = docs.value.find((item) => item.id === id)
  if (!doc || doc.functionItems.length > 0) return

  void nextTick(() => {
    if (pageContentRef.value) pageContentRef.value.scrollTop = 0
  })
}

const onClickSelectDoc = (id: number): void => {
  scrollToDoc(id)
}

const toggleDocDone = async (doc: Doc): Promise<void> => {
  const nextStatus = doc.status === '작업완료' ? '작업중' : '작업완료'
  const isUpdated = await updateDocStatus({
    id: doc.id,
    status: nextStatus
  })

  if (!isUpdated) return
  doc.status = nextStatus
}

const goPrevDoc = (): void => {
  if (prevDoc.value) scrollToDoc(prevDoc.value.id)
}

const goNextDoc = (): void => {
  if (nextDoc.value) scrollToDoc(nextDoc.value.id)
}

watch(selectedDocId, (id) => {
  if (id) resetPageScrollIfNeeded(id)
})

onMounted(() => {
  const relativeTimeTimer = window.setInterval(() => {
    nowTime.value = Date.now()
  }, 1000)

  onUnmounted(() => {
    window.clearInterval(relativeTimeTimer)
    flushPendingAutoSaves()
  })

  void (async () => {
    await loadDocs()

    await nextTick()
    const container = carouselRef.value
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute('data-doc-id'))
            if (id) selectedDocId.value = id
          }
        }
      },
      { root: container, threshold: 0.5 }
    )

    container.querySelectorAll('.carousel-item').forEach((el) => observer.observe(el))
    scrollToDoc(routeDocId.value || docs.value[0]?.id || 0)
    onUnmounted(() => observer.disconnect())
  })()
})
</script>
