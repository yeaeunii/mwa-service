<template>
  <div class="drawer lg:drawer-open drawer-end">
    <input id="drawerRight" type="checkbox" class="drawer-toggle" checked />
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
              <div class="text-xs text-base-content/50">
                {{ selectedDocIndex }} / {{ docs.length }}
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div
            v-if="currentAutoSaveState.status !== 'idle'"
            class="flex items-center gap-1.5 text-xs text-base-content/50"
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
          <button class="btn btn-ghost btn-sm" @click="onClickPrev">
            <i-lucide-chevron-left class="h-4 w-4" />
          </button>
          <button class="btn btn-ghost btn-sm" @click="onClickNext">
            <i-lucide-chevron-right class="h-4 w-4" />
          </button>
          <div class="mx-1 h-5 w-px bg-base-content/10"></div>
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
            <i-lucide-panel-right-open class="h-4 w-4" />
          </label>
        </div>
      </nav>

      <!-- Page content -->
      <div class="flex-1 overflow-y-auto bg-base-200">
        <div class="mx-auto min-h-full max-w-[960px]">
          <div ref="carouselRef" class="carousel min-h-full w-full">
            <div
              v-for="doc in docs"
              :id="`slide-item-${doc.id}`"
              :key="doc.id"
              :data-doc-id="doc.id"
              class="carousel-item w-full"
            >
              <div class="w-full p-4 md:p-6">
                <div class="rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
                  <!-- Form Header -->
                  <div class="border-b border-base-content/5 p-5">
                    <label class="floating-label mb-4 block w-full">
                      <span>문서 제목</span>
                      <input
                        v-model="doc.title"
                        type="text"
                        placeholder="문서 제목을 입력해주세요"
                        class="input input-md w-full bg-base-200/50"
                        @input="scheduleAutoSave(doc)"
                      />
                    </label>
                    <label class="floating-label mb-4 block w-full">
                      <span>문서 설명</span>
                      <textarea
                        v-model.trim="doc.description"
                        rows="2"
                        placeholder="문서 설명을 입력해주세요"
                        class="textarea textarea-md w-full resize-none bg-base-200/50"
                        @input="scheduleAutoSave(doc)"
                      ></textarea>
                    </label>
                    <label class="floating-label block w-full">
                      <span>진입경로</span>
                      <input
                        v-model="doc.entryPath"
                        type="text"
                        placeholder="ex) 산출물 관리 > 미리보기"
                        class="input input-md w-full bg-base-200/50"
                        @input="scheduleAutoSave(doc)"
                      />
                    </label>
                  </div>

                  <!-- Screenshot -->
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
                      <i-lucide-list-ordered class="h-4 w-4 text-primary" />
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
            <div class="flex items-center gap-2">
              <i-lucide-layers class="h-4 w-4 text-primary" />
              <span class="text-sm font-semibold">문서 목록</span>
              <span class="badge badge-sm badge-ghost">{{ docs.length }}</span>
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <div class="space-y-2">
              <a
                v-for="doc in docs"
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
                  <img :src="doc.thumbnail" class="h-24 w-full object-contain" />
                  <div v-if="selectedDocId === doc.id" class="absolute right-2 top-2">
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <i-lucide-check class="h-3 w-3" />
                    </div>
                  </div>
                </div>
                <div class="p-2.5">
                  <div class="text-sm font-semibold leading-tight line-clamp-1">
                    {{ doc.title }}
                  </div>
                  <div class="mt-0.5 text-xs text-base-content/50 line-clamp-1">
                    {{ doc.description }}
                  </div>
                </div>
              </a>
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

const docs = ref<Doc[]>([])
const nowTime = ref(Date.now())
const autoSaveByDoc = reactive<Record<number, AutoSaveState>>({})
const autoSaveTimers = new Map<number, number>()
const autoSaveVersions = new Map<number, number>()

const selectedDocIndex = computed(() => {
  const index = docs.value.findIndex((doc) => doc.id === selectedDocId.value)
  return index === -1 ? 0 : index + 1
})

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

const onClickPrev = (): void => {
  const currentIndex = docs.value.findIndex((doc) => doc.id === selectedDocId.value)
  const prevDoc = docs.value[currentIndex - 1]
  if (prevDoc) scrollToDoc(prevDoc.id)
}

const onClickNext = (): void => {
  const currentIndex = docs.value.findIndex((doc) => doc.id === selectedDocId.value)
  const nextDoc = docs.value[currentIndex + 1]
  if (nextDoc) scrollToDoc(nextDoc.id)
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
