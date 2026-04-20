<template>
  <div class="drawer lg:drawer-open drawer-end">
    <input id="drawerRight" type="checkbox" class="drawer-toggle" />
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
                          type="text"
                          class="input input-ghost w-full text-sm focus:outline-none bg-slate-50"
                          placeholder="진입경로 예) 홈 > 마켓 > AI 솔루션"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Screenshot -->
                  <div class="group relative">
                    <img
                      src="https://placehold.co/960x500/f1f5f9/94a3b8?text=Screenshot"
                      class="w-full object-cover"
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
                      <span class="badge badge-sm badge-ghost">10</span>
                    </div>
                    <ol class="space-y-2">
                      <li
                        v-for="n in 10"
                        :key="n"
                        class="flex items-start gap-3 rounded-lg border border-base-content/5 bg-base-200/50 p-3 transition-colors hover:bg-base-200"
                      >
                        <div
                          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
                        >
                          {{ n }}
                        </div>
                        <div class="flex-1 pt-0.5">
                          <div class="text-sm font-medium">
                            기능 {{ n }}: 기능 설명 내용이 이곳에 표시됩니다
                          </div>
                        </div>
                      </li>
                    </ol>
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
                  selectedDocIndex === doc.id
                    ? 'border-primary shadow-primary/10'
                    : 'border-transparent hover:border-base-content/10'
                "
                @click="onClickSelectDoc(doc.id)"
              >
                <div class="relative">
                  <img :src="doc.thumbnail" class="h-24 w-full object-cover" />
                  <div v-if="selectedDocIndex === doc.id" class="absolute right-2 top-2">
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
const router = useRouter()
const route = useRoute()
const workspaceId = computed(() => route.params.id)
const selectedDocIndex = ref(1)
const carouselRef = ref<HTMLElement | null>(null)

type Doc = {
  id: number
  title: string
  description: string
  thumbnail: string
  createdAt: string
  updatedAt: string
}

const docs = ref<Doc[]>([])

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

const onClickPrev = (): void => {
  const idx = selectedDocIndex.value
  if (idx > 1) scrollToDoc(idx - 1)
}

const onClickNext = (): void => {
  const idx = selectedDocIndex.value
  if (idx < docs.value.length) scrollToDoc(idx + 1)
}

onMounted(() => {
  for (let i = 1; i <= 10; i++) {
    docs.value.push({
      id: i,
      title: `문서 제목 ${i}`,
      description: `문서 설명 ${i}`,
      thumbnail: `https://placehold.co/280x160/f1f5f9/94a3b8?text=doc-${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  nextTick(() => {
    const container = carouselRef.value
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute('data-doc-id'))
            if (id) selectedDocIndex.value = id
          }
        }
      },
      { root: container, threshold: 0.5 }
    )

    container.querySelectorAll('.carousel-item').forEach((el) => observer.observe(el))
    onUnmounted(() => observer.disconnect())
  })
})
</script>
