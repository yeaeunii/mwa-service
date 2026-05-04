<template>
  <div class="drawer lg:drawer-open drawer-end">
    <input id="drawerRight" type="checkbox" class="drawer-toggle" checked />
    <div class="drawer-content flex flex-col h-screen">
      <!-- Navbar -->
      <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
        <div class="flex flex-1 items-center gap-3">
          <button class="btn btn-ghost btn-sm" @click="router.push(`/workspace/${workspaceId}`)">
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
          <button
            type="button"
            class="btn btn-primary btn-sm gap-1.5"
            :class="{ 'btn-disabled': isSaving }"
            :disabled="!selectedDocId || isSaving"
            @click="onClickSave"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
            <i-lucide-save v-else class="h-4 w-4" />
            저장
          </button>
          <div class="mx-1 h-5 w-px bg-base-content/10"></div>
          <button class="btn btn-ghost btn-sm" @click="onClickPrev">
            <i-lucide-chevron-left class="h-4 w-4" />
          </button>
          <button class="btn btn-ghost btn-sm" @click="onClickNext">
            <i-lucide-chevron-right class="h-4 w-4" />
          </button>
          <div class="mx-1 h-5 w-px bg-base-content/10"></div>
          <label for="drawerRight" aria-label="open sidebar" class="btn btn-ghost btn-sm">
            <i-lucide-panel-right-open class="h-4 w-4" />
          </label>
        </div>
      </nav>

      <!-- Page content -->
      <div class="flex-1 overflow-hidden bg-base-200">
        <div class="mx-auto h-full max-w-[960px]">
          <div ref="carouselRef" class="carousel h-full w-full">
            <div
              v-for="doc in docs"
              :id="`slide-item-${doc.id}`"
              :key="doc.id"
              :data-doc-id="doc.id"
              class="carousel-item h-full w-full"
            >
              <div class="h-full w-full overflow-y-auto p-4 md:p-6">
                <div class="rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
                  <!-- Form Header -->
                  <div class="border-b border-base-content/5 p-5">
                    <div class="mb-4">
                      <input
                        v-model="doc.title"
                        type="text"
                        class="input input-ghost w-full text-lg font-bold focus:outline-none bg-slate-50"
                        placeholder="문서 제목을 입력하세요"
                      />
                    </div>
                    <div class="mb-4">
                      <textarea
                        v-model.trim="doc.description"
                        rows="2"
                        class="textarea textarea-ghost w-full resize-none text-sm focus:outline-none bg-slate-50"
                        placeholder="문서에 대한 설명을 입력하세요"
                      ></textarea>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 bg-slate-50 px-2 rounded-lg">
                        <i-lucide-route class="h-4 w-4 shrink-0 text-base-content/30" />
                        <input
                          v-model="doc.entryPath"
                          type="text"
                          class="input input-ghost w-full text-sm focus:outline-none bg-slate-50"
                          placeholder="진입경로 예) 홈 > 마켓 > AI 솔루션"
                        />
                      </div>
                    </div>
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
        class="flex min-h-full flex-col bg-base-100 border-l border-base-content/10 is-drawer-close:w-0 is-drawer-open:w-72"
      >
        <div class="w-full is-drawer-close:hidden">
          <div class="flex items-center justify-between border-b border-base-content/5 px-4 py-3">
            <div class="flex items-center gap-2">
              <i-lucide-layers class="h-4 w-4 text-primary" />
              <span class="text-sm font-semibold">문서 목록</span>
              <span class="badge badge-sm badge-ghost">{{ docs.length }}</span>
            </div>
          </div>
          <div class="overflow-y-auto p-3">
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
                    {{ doc.savedTitle }}
                  </div>
                  <div class="mt-0.5 text-xs text-base-content/50 line-clamp-1">
                    {{ doc.savedDescription }}
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="saveToast" class="toast toast-end toast-top z-50">
      <div
        class="alert gap-2 shadow-lg"
        :class="saveToast.type === 'success' ? 'alert-success' : 'alert-error'"
      >
        <i-lucide-check-circle v-if="saveToast.type === 'success'" class="h-4 w-4" />
        <i-lucide-circle-alert v-else class="h-4 w-4" />
        <span>{{ saveToast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDocList, updateDoc } from '@/database'

const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => route.params.id)
const routeDocId = computed(() => Number(route.params.docId || 0))
const selectedDocId = ref(0)
const isSaving = ref(false)
const saveToast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let saveToastTimeout: ReturnType<typeof setTimeout> | null = null
const carouselRef = ref<HTMLElement | null>(null)

type Doc = {
  id: number
  title: string
  description: string
  savedTitle: string
  savedDescription: string
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

const docs = ref<Doc[]>([])

const selectedDocIndex = computed(() => {
  const index = docs.value.findIndex((doc) => doc.id === selectedDocId.value)
  return index === -1 ? 0 : index + 1
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
      savedTitle: doc.title,
      savedDescription: doc.description,
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

const onClickSave = (): void => {
  if (!selectedDocId.value || isSaving.value) return
  void saveCurrentDoc()
}

const showSaveToast = (type: 'success' | 'error', message: string): void => {
  if (saveToastTimeout) {
    clearTimeout(saveToastTimeout)
  }

  saveToast.value = { type, message }
  saveToastTimeout = setTimeout(() => {
    saveToast.value = null
    saveToastTimeout = null
  }, 1800)
}

const saveCurrentDoc = async (): Promise<void> => {
  const target = docs.value.find((doc) => doc.id === selectedDocId.value)
  if (!target || isSaving.value) return

  isSaving.value = true
  try {
    const docMeta = {
      ...parseDocMeta(target.docMetaJson),
      writer: '담당자',
      entry_path: target.entryPath.trim()
    }

    const isSaved = await updateDoc({
      id: target.id,
      title: target.title.trim(),
      description: target.description.trim(),
      docMetaJson: JSON.stringify(docMeta)
    })

    if (!isSaved) {
      showSaveToast('error', '저장에 실패했습니다.')
      return
    }

    target.docMetaJson = JSON.stringify(docMeta)
    target.savedTitle = target.title.trim()
    target.savedDescription = target.description.trim()
    showSaveToast('success', '저장되었습니다.')
  } finally {
    isSaving.value = false
  }
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

onUnmounted(() => {
  if (saveToastTimeout) {
    clearTimeout(saveToastTimeout)
    saveToastTimeout = null
  }
})
</script>
