<template>
  <div class="drawer lg:drawer-open drawer-end">
    <input id="drawerRight" v-model="isDocDrawerOpen" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col h-screen">
      <!-- Navbar -->
      <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
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
            </div>
            <div class="mx-1 h-5 w-px bg-base-content/10"></div>
            <div class="join">
              <button
                class="btn btn-ghost btn-sm join-item"
                :disabled="!prevDoc"
                @click="goPrevDoc"
              >
                <i-lucide-chevron-left class="h-4 w-4" />
              </button>
              <div class="join-item flex h-8 items-center px-2 text-sm font-bold tabular-nums">
                {{ selectedDocIndex }} / {{ docs.length }}
              </div>
              <button
                class="btn btn-ghost btn-sm join-item"
                :disabled="!nextDoc"
                @click="goNextDoc"
              >
                <i-lucide-chevron-right class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div
            v-if="currentAutoSaveState.status !== 'idle'"
            class="mr-3 flex items-center gap-1.5 text-xs text-base-content/50"
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

          <button
            type="button"
            class="btn btn-sm gap-1.5"
            :class="currentDocDone ? 'btn-success' : 'btn-outline btn-success'"
            :disabled="!currentDoc"
            @click="toggleDone"
          >
            <i-lucide-check-circle class="h-4 w-4" />
            {{ currentDocDone ? '작업완료' : '작업중' }}
          </button>
          <div class="mx-1 h-5 w-px bg-base-content/10"></div>
          <label for="drawerRight" aria-label="open sidebar" class="btn btn-ghost btn-sm">
            <i-lucide-panel-right-close v-if="isDocDrawerOpen" class="h-4 w-4" />
            <i-lucide-panel-right-open v-else class="h-4 w-4" />
          </label>
        </div>
      </nav>

      <!-- Page content -->
      <div class="flex-1 overflow-y-auto bg-base-200">
        <div class="mx-auto max-w-[960px] py-4 md:py-6">
          <div ref="carouselRef" class="carousel w-full">
            <div
              v-for="doc in docs"
              :id="`slide-item-${doc.id}`"
              :key="doc.id"
              :data-doc-id="doc.id"
              class="carousel-item w-full"
            >
              <div class="w-full px-4 md:px-6">
                <div class="rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
                  <!-- Form Header -->
                  <div class="space-y-4 border-b border-base-content/5 p-5">
                    <label class="block w-full">
                      <div class="mb-1.5 text-sm font-semibold">제목</div>
                      <input
                        v-model="doc.title"
                        type="text"
                        placeholder="제목을 입력해주세요"
                        class="input input-lg h-12 w-full bg-base-200/50 text-2xl font-black leading-tight"
                        @input="scheduleAutoSave(doc)"
                      />
                    </label>
                    <label class="block w-full">
                      <div class="mb-1.5 text-sm font-semibold">진입경로</div>
                      <label class="input input-md w-full bg-base-200/50">
                        <i-lucide-folder-open class="h-3 w-3 text-base-content/50" />
                        <input
                          v-model="doc.entryPath"
                          type="text"
                          placeholder="진입경로 ex) 메인>로그인화면"
                          @input="scheduleAutoSave(doc)"
                        />
                      </label>
                    </label>
                    <label class="block w-full">
                      <div class="mb-1.5 text-sm font-semibold">화면 설명</div>
                      <textarea
                        v-model.trim="doc.description"
                        rows="2"
                        placeholder="화면 설명을 입력해주세요"
                        class="textarea textarea-md w-full resize-none bg-base-200/50"
                        @input="scheduleAutoSave(doc)"
                      ></textarea>
                    </label>
                  </div>

                  <!-- Screenshot -->
                  <div class="border-b border-base-content/5 px-5 py-3">
                    <span class="text-sm font-semibold">화면 구성</span>
                  </div>
                  <div class="group relative bg-base-200">
                    <img
                      :src="doc.thumbnail"
                      class="max-h-[420px] w-full object-contain"
                      style="max-height: 420px"
                    />
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
                    >
                      <router-link
                        :to="`/documents/${doc.id}/annotation`"
                        class="btn btn-circle btn-lg border-none bg-white/90 text-base-content shadow-lg opacity-0 transition-all duration-200 hover:bg-white group-hover:opacity-100"
                      >
                        <i-lucide-pencil class="h-5 w-5" />
                      </router-link>
                    </div>
                  </div>

                  <!-- Step List -->
                  <div class="p-5">
                    <div class="mb-3 flex items-center gap-2">
                      <span class="text-sm font-semibold">기능 설명</span>
                      <span class="badge badge-sm badge-ghost">{{ doc.functionItems.length }}</span>
                    </div>
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
                        <div class="flex-1 pt-0.5">
                          <div class="text-sm font-medium">
                            {{ item.text || '기능 설명이 없습니다' }}
                          </div>
                        </div>
                      </li>
                    </ol>
                    <div
                      v-if="doc.functionItems.length === 0"
                      class="rounded-lg border border-dashed border-base-content/10 bg-base-200/30 p-4 text-center text-sm text-base-content/40"
                    >
                      저장된 기능 설명이 없습니다
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="drawer-side is-drawer-close:overflow-visible z-20">
      <label for="drawerRight" aria-label="close sidebar" class="drawer-overlay"></label>
      <div
        class="flex h-screen min-h-0 flex-col bg-base-100 border-l border-base-content/10 is-drawer-close:w-0 is-drawer-open:w-72"
      >
        <div class="flex min-h-0 w-full flex-1 flex-col is-drawer-close:hidden">
          <div
            class="shrink-0 flex items-center justify-between border-b border-base-content/5 px-4 py-3"
          >
            <div class="flex h-9.5 items-center gap-2">
              <span class="text-sm font-semibold">문서 목록</span>
              <span class="badge badge-sm badge-ghost">{{ docs.length }}</span>
            </div>
          </div>
          <div class="shrink-0 space-y-2 border-b border-base-content/5 px-3 py-2">
            <label class="input input-sm w-full">
              <i-lucide-search class="h-3.5 w-3.5 opacity-40" />
              <input v-model="docListSearchKeyword" type="search" placeholder="문서 검색..." />
            </label>
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
                class="block cursor-pointer overflow-hidden rounded-lg border-2 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md"
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
                    class="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded bg-black px-1.5 text-[10px] font-black tabular-nums text-white shadow-sm"
                  >
                    {{ getDocOrder(doc) }}
                  </div>
                  <div v-if="selectedDocId === doc.id" class="absolute right-2 top-2">
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <i-lucide-check class="h-3 w-3" />
                    </div>
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
              {{ docListSearchKeyword ? '검색 결과가 없습니다' : '조건에 맞는 문서가 없습니다' }}
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
const isDocDrawerOpen = ref(true)

type Doc = {
  id: number
  title: string
  description: string
  status: string
  entryPath: string
  docMetaJson: string
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
const docListSearchKeyword = ref('')
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
const currentDocDone = computed(() => currentDoc.value?.status === '작업완료')
const isDoneDoc = (doc: Doc): boolean => doc.status === '작업완료'
const docStatusText = (doc: Doc): string => (isDoneDoc(doc) ? '작업완료' : '작업중')
const docStatusClass = (doc: Doc): string =>
  isDoneDoc(doc)
    ? 'border-success/20 bg-success/10 text-success'
    : 'border-info/20 bg-info/10 text-info'
const getDocTitle = (doc: Doc): string => doc.title.trim() || EMPTY_DOC_TITLE
const getDocDescription = (doc: Doc): string => doc.description.trim() || EMPTY_DOC_DESCRIPTION
const getDocOrder = (doc: Doc): number => {
  const index = docs.value.findIndex((item) => item.id === doc.id)
  return index === -1 ? 0 : index + 1
}
const filteredSidebarDocs = computed(() => {
  const keyword = docListSearchKeyword.value.trim().toLowerCase()

  return docs.value.filter((doc) => {
    const matchesStatus =
      docListFilter.value === 'all' ||
      (docListFilter.value === 'done' && isDoneDoc(doc)) ||
      (docListFilter.value === 'doing' && !isDoneDoc(doc))
    if (!matchesStatus) return false

    if (!keyword) return true

    return [getDocTitle(doc), getDocDescription(doc)].some((text) =>
      text.toLowerCase().includes(keyword)
    )
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
}

const onClickSelectDoc = (id: number): void => {
  scrollToDoc(id)
}

const toggleDone = async (): Promise<void> => {
  const target = currentDoc.value
  if (!target) return

  const nextStatus = target.status === '작업완료' ? '작업중' : '작업완료'
  const isUpdated = await updateDocStatus({
    id: target.id,
    status: nextStatus
  })

  if (!isUpdated) return
  target.status = nextStatus
}

const goPrevDoc = (): void => {
  if (prevDoc.value) scrollToDoc(prevDoc.value.id)
}

const goNextDoc = (): void => {
  if (nextDoc.value) scrollToDoc(nextDoc.value.id)
}

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
