<template>
  <ModalBase ref="modalRef" title="문서 미리보기" width="max-w-[920px] w-[920px]">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-lg font-bold">문서 미리보기</h3>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          :disabled="!currentDoc"
          @click="goDocumentEdit"
        >
          <i-lucide-pencil class="h-4 w-4" />
          문서 편집 바로가기
        </button>
      </div>
    </template>

    <div class="max-h-[78vh] overflow-y-auto bg-base-200 p-5">
      <article
        class="mx-auto flex min-h-[920px] w-[720px] flex-col bg-base-100 px-7 py-6 text-base-content shadow-sm"
      >
        <header class="border-b border-slate-200 pb-4">
          <div class="flex items-end justify-between">
            <div class="ml-auto text-[11px] font-semibold text-slate-600">
              작성일: {{ docDate }}
            </div>
          </div>
        </header>

        <section class="pt-7">
          <h1 class="text-2xl font-black tracking-tight text-slate-950">{{ docTitle }}</h1>

          <div class="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <i-lucide-folder-open class="h-3.5 w-3.5" />
            <span>경로: {{ entryPath || '입력된 화면 경로가 없습니다' }}</span>
          </div>

          <div class="mt-5 rounded-md border border-base-300 bg-base-200 p-4">
            <div class="mb-2 text-sm font-black text-primary">화면 개요</div>
            <p class="text-xs leading-6 text-base-content/80">
              {{ currentDoc?.description || '화면 설명이 없습니다.' }}
            </p>
          </div>
        </section>

        <section class="mt-6">
          <div class="mb-2 flex items-center gap-2">
            <i-lucide-square-check class="h-3.5 w-3.5 text-slate-500" />
            <h2 class="text-sm font-black text-base-content">화면구성</h2>
          </div>

          <div class="border border-slate-300 bg-white p-1">
            <div v-if="imageSrc" class="flex min-h-[250px] items-center justify-center">
              <img :src="imageSrc" :alt="docTitle" class="max-h-[390px] w-full object-contain" />
            </div>
            <div
              v-else
              class="flex min-h-[250px] flex-col items-center justify-center bg-slate-50 text-slate-400"
            >
              <i-lucide-image-off class="h-10 w-10" />
              <p class="mt-3 text-sm">저장된 화면 이미지가 없습니다</p>
            </div>
          </div>
        </section>

        <section class="mt-6">
          <div class="mb-2 flex items-center gap-2 border-b border-slate-200 pb-2">
            <i-lucide-square-check class="h-3.5 w-3.5 text-slate-500" />
            <h2 class="text-sm font-black text-base-content">주요 기능 명세</h2>
          </div>

          <table class="w-full border border-slate-300 text-xs">
            <thead class="bg-base-200 text-base-content">
              <tr>
                <th class="w-16 border border-slate-300 px-3 py-2 text-center">번호</th>
                <th class="border border-slate-300 px-3 py-2 text-center">상세 설명</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in functionItems" :key="item.number">
                <td class="border border-slate-300 px-3 py-3 text-center align-top">
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    :style="{ backgroundColor: numberColor }"
                  >
                    {{ item.number }}
                  </span>
                </td>
                <td class="break-all border border-slate-300 px-3 py-3 text-center align-top">
                  <p class="whitespace-normal break-all leading-5 text-slate-600">
                    {{ item.description }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer class="mt-auto pt-7"></footer>
      </article>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { getDocList, getWorkspaces } from '@/database'
import type { Doc, SectionDocInput, Workspace } from '@database/dto'
import { useRoute, useRouter } from 'vue-router'

interface FunctionDescription {
  number: number
  description: string
}

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const currentDoc = ref<Doc | null>(null)
const currentWorkspace = ref<Workspace | null>(null)
const parentWorkspaceName = ref('')
const route = useRoute()
const router = useRouter()

const getOriginalDocId = (docId: string): number => Number(docId.split('-copy-')[0])

const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

const parseJsonObject = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const parseContentItems = (value: string): FunctionDescription[] => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        number: Number(item?.number ?? 0),
        description: String(item?.text ?? '')
      }))
      .filter((item) => item.number > 0)
      .sort((left, right) => left.number - right.number)
  } catch {
    return []
  }
}

const getNumberColor = (value: string): string => {
  try {
    const parsed = JSON.parse(value || '[]')
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

const docTitle = computed(() => currentDoc.value?.title ?? '문서보기')

const docDate = computed(() => {
  const updatedAt = currentDoc.value?.updated_at ? new Date(currentDoc.value.updated_at) : null
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) return '-'

  return updatedAt.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

const entryPath = computed(() => {
  const docMeta = parseJsonObject(currentDoc.value?.doc_meta_json ?? '{}')
  return String(docMeta.entry_path ?? '')
})

const imageSrc = computed(() => {
  const imagePath = currentDoc.value?.draw_img_path || currentDoc.value?.orgn_img_path
  return imagePath ? toFileSrc(imagePath, currentDoc.value?.updated_at) : ''
})

const functionItems = computed(() => parseContentItems(currentDoc.value?.content_json ?? '[]'))
const numberColor = computed(() => getNumberColor(currentDoc.value?.annotation_json ?? '[]'))

const goDocumentEdit = (): void => {
  const doc = currentDoc.value
  if (!doc) return

  modalRef.value?.onClose()
  void router.push({
    name: 'docs-index',
    params: {
      id: String(doc.workspace_id),
      docId: String(doc.id)
    },
    query: {
      from: 'deliverable-structure',
      projectId: String(route.params.id),
      deliverableId: String(route.params.deliverableId)
    }
  })
}

const onOpen = async (item: SectionDocInput, workspaceName = ''): Promise<void> => {
  currentDoc.value = null
  currentWorkspace.value = null
  parentWorkspaceName.value = workspaceName
  modalRef.value?.onOpen()

  const docId = getOriginalDocId(item.doc_id)
  if (!docId) return

  const docs = await getDocList({ id: docId })
  currentDoc.value = docs[0] ?? null

  if (currentDoc.value?.workspace_id) {
    const workspaces = await getWorkspaces({
      id: currentDoc.value.workspace_id,
      limit: 1,
      offset: 0
    })
    currentWorkspace.value = workspaces[0] ?? null
  }
}

defineExpose({ onOpen })
</script>
