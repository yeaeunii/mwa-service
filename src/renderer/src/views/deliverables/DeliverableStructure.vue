<template>
  <div class="flex h-screen max-h-screen flex-col overflow-hidden bg-base-200">
    <nav class="navbar shrink-0 border-b border-base-content/10 bg-base-100 px-4">
      <div class="flex flex-1 items-center gap-3">
        <button type="button" class="btn btn-ghost btn-sm" @click="goProjectDeliverables">
          <i-lucide-arrow-left class="h-4 w-4" />
        </button>
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <i-lucide-file-text class="h-4 w-4 text-primary" />
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-bold leading-tight">산출물 구조 구성</div>
            <div class="text-xs text-base-content/50">
              <div
                v-if="autoSaveState.status !== 'idle'"
                class="flex items-center gap-1.5 text-xs text-base-content/50"
              >
                <template v-if="isAutoSaving">
                  <i-lucide-loader-circle class="h-3 w-3 animate-spin text-primary" />
                  {{ autoSaveMessage }}
                </template>
                <template v-else-if="isAutoSaveError">
                  <i-lucide-alert-circle class="h-3 w-3 text-error" />
                  {{ autoSaveMessage }}
                </template>
                <template v-else>
                  <i-lucide-check-circle class="h-3 w-3 text-primary" />
                  {{ autoSaveMessage }}
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div
      ref="splitContainerRef"
      class="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-1 overflow-hidden p-4"
    >
      <section
        class="order-3 flex min-h-0 min-w-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5"
        >
          <div>
            <h2 class="mt-1 text-base font-black text-base-content">산출물 카테고리 구성</h2>
            <p class="mt-1 text-xs text-base-content/55">카테고리 안에 문서를 배치하세요.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline gap-1.5" @click="goPreview">
              <i-lucide-eye class="h-4 w-4" />
              미리보기
            </button>
          </div>
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto p-5"
          @contextmenu.prevent="openRootCategoryContextMenu"
        >
          <form
            v-if="isAddingCategory && addingCategoryParentId === null"
            class="mb-3 flex items-center gap-2 rounded-lg border border-primary/25 bg-base-100 p-2 shadow-sm"
            @submit.prevent="submitNewCategory"
          >
            <i-fluent-folder-open-16-filled class="h-5 w-5 shrink-0 text-indigo-500" />
            <input
              v-model="newCategoryTitle"
              type="text"
              class="input input-sm input-bordered min-w-0 flex-1"
              placeholder="카테고리명"
              autofocus
            />
            <button
              type="submit"
              class="btn btn-sm btn-square border-indigo-200 bg-indigo-100/80 text-indigo-950 hover:border-indigo-300 hover:bg-indigo-200"
            >
              <i-lucide-check class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square"
              @click="cancelAddCategory"
            >
              <i-lucide-x class="h-4 w-4" />
            </button>
          </form>

          <VueDraggable
            v-model="categories"
            :animation="180"
            :disabled="false"
            :group="categoryTreeGroup"
            handle=".category-handle"
            item-key="id"
            class="min-w-0"
          >
            <DeliverableCategoryNode
              v-for="category in filteredCategories"
              :key="category.id"
              v-model:new-category-title="newCategoryTitle"
              v-model:edit-title="editTitle"
              class="mb-3"
              :category="category"
              :category-group="categoryGroup"
              :category-tree-group="categoryTreeGroup"
              :is-adding-category="isAddingCategory"
              :adding-category-parent-id="addingCategoryParentId"
              :is-category-expanded="isSearchCategoryExpanded"
              :is-editing="isEditing"
              :selected-original-doc-id="selectedSourceOriginalDocId"
              :depth="0"
              @open-menu="openActionContextMenu"
              @toggle-category="toggleCategory"
              @submit-new-category="submitNewCategory"
              @cancel-add="cancelAddCategory"
              @submit-edit="submitEdit"
              @cancel-edit="cancelEdit"
              @update-children="updateCategoryChildren"
              @update-items="updateCategoryItems"
              @item-add="onCategoryNodeItemAdd"
            />
          </VueDraggable>
        </div>
      </section>

      <div
        class="order-2 flex w-4 shrink-0 cursor-col-resize items-stretch justify-center"
        :class="isResizingSplit ? 'select-none' : ''"
        @mousedown.prevent="startSplitResize"
      >
        <div
          class="my-1 w-1 rounded-full bg-base-300/70 transition-colors hover:bg-primary/45"
          :class="isResizingSplit ? 'bg-primary/60' : ''"
        />
      </div>

      <section
        class="order-1 flex min-h-0 min-w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        :style="sourcePanelStyle"
      >
        <div class="border-b border-slate-200 bg-white/90 px-6 py-5">
          <h2 class="mt-1 text-base font-black text-base-content">워크스페이스 문서 목록</h2>
          <p class="mt-1 text-xs text-base-content/55">
            워크스페이스 전체 또는 문서를 오른쪽 카테고리로 드래그하세요.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <div
            v-if="isLoadingWorkspaces"
            class="flex h-32 items-center justify-center text-sm text-base-content/50"
          >
            <i-lucide-loader-circle class="mr-2 h-4 w-4 animate-spin" />
            워크스페이스 문서를 불러오는 중입니다
          </div>

          <div
            v-else-if="filteredWorkspaces.length === 0"
            class="flex h-32 items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 text-sm text-base-content/50"
          >
            워크스페이스 문서가 없습니다
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="workspace in filteredWorkspaces"
              :key="workspace.id"
              class="overflow-hidden rounded-xl border border-slate-500 bg-white shadow-sm"
            >
              <VueDraggable
                :model-value="workspace.bundleItems"
                :animation="180"
                :group="sourceGroup"
                :clone="cloneStructureItem"
                item-key="doc_id"
                :sort="false"
              >
                <div
                  v-for="bundle in workspace.bundleItems"
                  :key="bundle.doc_id"
                  class="flex cursor-grab items-center gap-2 border-b border-slate-500 bg-slate-600 px-4 py-1.5 text-white"
                >
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-white btn-square cursor-pointer"
                    @click.stop="toggleWorkspace(workspace.id)"
                  >
                    <i-lucide-chevron-down
                      v-if="isWorkspaceExpanded(workspace.id)"
                      class="h-4 w-4 text-base-content/60 text-white"
                    />
                    <i-lucide-chevron-right v-else class="h-4 w-4 text-base-content/60" />
                  </button>

                  <span class="min-w-0 flex-1 truncate text-sm font-bold">
                    {{ workspace.name }}
                  </span>
                </div>
              </VueDraggable>

              <VueDraggable
                v-if="isWorkspaceExpanded(workspace.id)"
                :model-value="workspace.items"
                :animation="180"
                :group="sourceGroup"
                :clone="cloneStructureItem"
                item-key="doc_id"
                :sort="false"
                class="px-3 py-1"
              >
                <div
                  v-for="item in workspace.items"
                  :key="item.doc_id"
                  class="border-b border-slate-100 bg-white last:border-b-0"
                >
                  <div
                    class="flex cursor-pointer items-center gap-2 px-1 py-1.5"
                    :class="
                      isSelectedSourceDoc(item)
                        ? 'border-l-4 border-yellow-200 bg-yellow-50 text-yellow-950'
                        : 'text-base-content'
                    "
                    @click.stop="selectSourceDoc(item)"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex min-w-0 items-center gap-1.5">
                        <span class="truncate text-xs font-bold leading-tight">
                          {{ getDocumentTitle(item) }}
                        </span>
                      </div>
                    </div>
                    <span
                      class="shrink-0 text-[11px] font-semibold"
                      :class="
                        getSourceDocPlacementCount(item) > 0
                          ? 'inline-flex h-5 items-center rounded border border-orange-200 bg-orange-50 px-1.5 text-orange-600'
                          : 'text-base-content/45'
                      "
                    >
                      {{ getSourceDocPlacementLabel(item) }}
                    </span>
                    <button
                      type="button"
                      class="tooltip tooltip-left btn btn-ghost btn-xs btn-square h-6 min-h-6 w-6"
                      data-tip="문서보기"
                      @click.stop="openDocumentPreview(item)"
                    >
                      <i-lucide-file-search class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </VueDraggable>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="actionMenu.visible"
      class="menu fixed z-[1000] w-45 rounded-box border border-base-300 bg-base-100 p-1.5 text-xs shadow-xl"
      :style="{ left: `${actionMenu.x}px`, top: `${actionMenu.y}px` }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <button
        v-if="selectedActionTarget?.kind === 'category-root'"
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start"
        @click="startAddRootCategory"
      >
        <i-lucide-folder-plus class="h-4 w-4 opacity-60" />
        상위 카테고리 추가
      </button>
      <button
        v-if="selectedActionTarget?.kind === 'category'"
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start"
        @click="startAddSelectedCategory"
      >
        <i-lucide-folder-plus class="h-4 w-4 opacity-60" />
        하위 카테고리 추가
      </button>
      <button
        v-if="selectedActionTarget?.kind === 'category'"
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start"
        @click="startEditSelected"
      >
        <i-lucide-pencil class="h-4 w-4 opacity-60" />
        수정
      </button>
      <button
        v-if="selectedActionTarget?.kind === 'item'"
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start"
        @click="openSelectedDocument"
      >
        <i-lucide-file-search class="h-4 w-4 opacity-60" />
        문서보기
      </button>
      <button
        v-if="selectedActionTarget?.kind !== 'category-root'"
        type="button"
        class="btn btn-ghost btn-sm w-full justify-start text-error"
        @click="requestDeleteSelected"
      >
        <i-lucide-trash-2 class="h-4 w-4 opacity-60" />
        삭제
      </button>
    </div>

    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="confirmDelete">
      <template #message>
        <p>{{ deleteTarget?.title }}</p>
        <p>항목을 삭제하시겠습니까?</p>
      </template>
    </ModalConfirm>

    <PreviewModal ref="docPreviewModalRef" />
    <div v-if="toastMessage" class="toast toast-end toast-bottom z-[1000]">
      <div class="alert border border-slate-300 bg-base-100 shadow-xl">
        <i-lucide-circle-alert class="h-5 w-5 text-error" />
        <span class="text-sm">{{ toastMessage }}</span>
        <button type="button" class="btn btn-ghost btn-xs" @click="clearToast">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getDeliverableStructure,
  getDocList,
  getWorkspaces,
  saveDeliverableStructure,
  type DeliverableSection,
  type DeliverableSectionDoc
} from '@/database'
import { useContextMenu } from '@renderer/composables/useContextMenu'
import type { Doc, SectionDocInput, SectionTreeInput, Workspace } from '@database/dto'
import DeliverableCategoryNode from './components/DeliverableCategoryNode.vue'
import PreviewModal from './components/PreviewModal.vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useRoute, useRouter } from 'vue-router'

type ActionTargetKind = 'category-root' | 'category' | 'item'

interface ActionTarget {
  kind: ActionTargetKind
  id: string
  title: string
}

interface DragAddEvent {
  newIndex?: number
}

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface AutoSaveState {
  status: AutoSaveStatus
  savedAt: number | null
}

interface StructureWorkspace {
  id: string
  name: string
  items: SectionDocInput[]
}

interface StructureWorkspaceView extends StructureWorkspace {
  bundleItems: SectionDocInput[]
}

const route = useRoute()
const router = useRouter()
const categoryGroup = { name: 'deliverable-structure' }
const categoryTreeGroup = { name: 'deliverable-category-tree' }
const sourceGroup = { name: 'deliverable-structure', pull: 'clone' as const, put: false }
const autoSaveState = reactive<AutoSaveState>({
  status: 'idle',
  savedAt: null
})
const nowTime = ref(Date.now())
let autoSaveTimer: number | null = null
let autoSaveVersion = 0
let isApplyingStructure = false
const splitContainerRef = ref<HTMLElement | null>(null)
const sourcePanelPercent = ref(30)
const isResizingSplit = ref(false)
const selectedSourceOriginalDocId = ref<string | null>(null)
const toastMessage = ref('')
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const docPreviewModalRef = ref<InstanceType<typeof PreviewModal> | null>(null)
let toastTimer: number | null = null
const {
  contextMenu: actionMenu,
  selectedItem: selectedActionTarget,
  openContextMenu: openActionMenu,
  closeContextMenu: closeActionMenu
} = useContextMenu<ActionTarget>()

const sourcePanelStyle = computed(() => ({
  width: `${sourcePanelPercent.value}%`
}))

const clampSourcePanelPercent = (percent: number): number => Math.min(45, Math.max(18, percent))

const updateSplitResize = (clientX: number): void => {
  const container = splitContainerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  if (rect.width <= 0) return

  sourcePanelPercent.value = clampSourcePanelPercent(((clientX - rect.left) / rect.width) * 100)
}

const onSplitMouseMove = (event: MouseEvent): void => {
  updateSplitResize(event.clientX)
}

const stopSplitResize = (): void => {
  isResizingSplit.value = false
  window.removeEventListener('mousemove', onSplitMouseMove)
  window.removeEventListener('mouseup', stopSplitResize)
}

const startSplitResize = (event: MouseEvent): void => {
  isResizingSplit.value = true
  updateSplitResize(event.clientX)
  window.addEventListener('mousemove', onSplitMouseMove)
  window.addEventListener('mouseup', stopSplitResize)
}

const clearToast = (): void => {
  toastMessage.value = ''
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
}

const showToast = (message: string): void => {
  clearToast()
  toastMessage.value = message
  toastTimer = window.setTimeout(clearToast, 20000)
}

// 드래그 복제용 문서 ID 생성
const cloneStructureItem = (item: SectionDocInput): SectionDocInput => ({
  ...item,
  doc_id: `${item.doc_id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
})

// DB 문서를 산출물 배치용 문서로 변환
const mapDocToStructureItem = (doc: Doc): SectionDocInput => ({
  doc_id: String(doc.id),
  kind: 'document',
  doc_title: doc.title,
  meta: '',
  status: doc.status ?? ''
})

// DB section/doc row를 편집용 카테고리 트리로 변환
const buildCategoriesFromStructure = (
  sections: DeliverableSection[],
  sectionDocs: DeliverableSectionDoc[]
): SectionTreeInput[] => {
  const categoriesById = new Map<number, SectionTreeInput>()
  const childrenByParentId = new Map<number | null, DeliverableSection[]>()
  const docsBySectionId = new Map<number, DeliverableSectionDoc[]>()

  sections.forEach((section) => {
    const parentId = section.parent_id ?? null
    childrenByParentId.set(parentId, [...(childrenByParentId.get(parentId) ?? []), section])
    categoriesById.set(section.id, {
      id: String(section.id),
      name: section.name,
      docs: [],
      children: []
    })
  })

  sectionDocs.forEach((doc) => {
    docsBySectionId.set(doc.section_id, [...(docsBySectionId.get(doc.section_id) ?? []), doc])
  })

  const attach = (parentId: number | null): SectionTreeInput[] =>
    (childrenByParentId.get(parentId) ?? []).map((section) => {
      const category = categoriesById.get(section.id)!
      category.docs = (docsBySectionId.get(section.id) ?? []).map((doc) => ({
        doc_id: String(doc.doc_id),
        kind: 'document',
        doc_title: doc.title,
        meta: '',
        status: doc.status ?? ''
      }))
      category.children = attach(section.id)
      return category
    })

  return attach(null)
}

// 워크스페이스 전체 드래그용 bundle item 생성
const createWorkspaceBundleItem = (workspace: StructureWorkspace): SectionDocInput => ({
  doc_id: `workspace-bundle-${workspace.id}`,
  kind: 'workspace',
  doc_title: workspace.name,
  meta: '워크스페이스 문서 전체',
  status: ''
})

// DB 워크스페이스와 문서 목록을 좌측 패널 데이터로 변환
const mapWorkspaceToStructureWorkspace = (
  workspace: Workspace,
  docs: Doc[]
): StructureWorkspaceView => {
  const structureWorkspace: StructureWorkspaceView = {
    id: String(workspace.id),
    name: workspace.name,
    items: docs.map(mapDocToStructureItem),
    bundleItems: []
  }

  structureWorkspace.bundleItems = [createWorkspaceBundleItem(structureWorkspace)]

  return structureWorkspace
}

// 산출물 구조 상태
const categories = ref<SectionTreeInput[]>([])
const workspaces = ref<StructureWorkspaceView[]>([])
const isLoadingWorkspaces = ref(false)
const isStructureReady = ref(false)

// 카테고리 추가/수정/삭제 상태
const isAddingCategory = ref(false)
const addingCategoryParentId = ref<string | null>(null)
const newCategoryTitle = ref('')
const editTarget = ref<ActionTarget | null>(null)
const editTitle = ref('')
const deleteTarget = ref<ActionTarget | null>(null)

// 카테고리 ID 목록 수집
const collectCategoryIds = (categoryList: SectionTreeInput[]): string[] =>
  categoryList.flatMap((category) => [category.id, ...collectCategoryIds(category.children)])

// 펼침 상태
const expandedCategoryIds = ref(new Set(collectCategoryIds(categories.value)))
const expandedWorkspaceIds = ref(new Set(workspaces.value.map((workspace) => workspace.id)))

// 신규 카테고리 임시 ID 생성
const createCategoryId = (): string =>
  `category-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const koreanLabels = [
  '가',
  '나',
  '다',
  '라',
  '마',
  '바',
  '사',
  '아',
  '자',
  '차',
  '카',
  '타',
  '파',
  '하',
  '거',
  '너',
  '더',
  '러',
  '머',
  '버',
  '서',
  '어',
  '저',
  '처',
  '커',
  '터',
  '퍼',
  '허'
]

// 숫자 순서를 한글 순서 라벨로 변환
const getKoreanLabel = (order: number): string => {
  const index = order - 1
  const label = koreanLabels[index % koreanLabels.length]
  const round = Math.floor(index / koreanLabels.length)

  return round > 0 ? `${label}${round + 1}` : label
}

// 카테고리명 앞 번호/코드 추출
const getCategoryCode = (name: string): string => {
  const code = name.trim().split(/\s+/)[0] ?? ''
  return code.endsWith('.') ? code.slice(0, -1) : code
}

// 카테고리 깊이 계산
const getCategoryDepth = (categoryId: string): number => {
  const findDepth = (categoryList: SectionTreeInput[], depth: number): number | null => {
    for (const category of categoryList) {
      if (category.id === categoryId) return depth

      const childDepth = findDepth(category.children, depth + 1)
      if (childDepth !== null) return childDepth
    }

    return null
  }

  return findDepth(categories.value, 0) ?? 0
}

// 하위 카테고리 기본 순서 라벨 생성
const getCategoryOrderLabel = (depth: number, order: number): string => {
  if (depth === 1) return `${getKoreanLabel(order)}.`
  if (depth === 2) return `${order})`
  if (depth === 3) return `${getKoreanLabel(order)})`
  if (depth === 4) return `(${order})`

  return String(order)
}

// 루트 카테고리 기본 제목 생성
const getDefaultCategoryTitle = (): string => `${categories.value.length + 1}. 새 카테고리`

// 최초 기본 루트 카테고리 생성
const createDefaultRootCategory = (): SectionTreeInput => ({
  id: createCategoryId(),
  name: '1. 새 카테고리',
  docs: [],
  children: []
})

const filteredCategories = computed(() => categories.value)

const filteredWorkspaces = computed(() => workspaces.value)

// 카테고리 단건 조회
const findCategory = (
  targetId: string,
  categoryList: SectionTreeInput[] = categories.value
): SectionTreeInput | undefined => {
  for (const category of categoryList) {
    if (category.id === targetId) return category

    const child = findCategory(targetId, category.children)
    if (child) return child
  }

  return undefined
}

// 카테고리가 속한 형제 목록 조회
const findCategoryList = (
  targetId: string,
  categoryList: SectionTreeInput[] = categories.value
): SectionTreeInput[] | undefined => {
  if (categoryList.some((category) => category.id === targetId)) return categoryList

  for (const category of categoryList) {
    const childList = findCategoryList(targetId, category.children)
    if (childList) return childList
  }

  return undefined
}

// 배치된 문서 단건 조회
const findItem = (
  targetId: string,
  categoryList: SectionTreeInput[] = categories.value
): SectionDocInput | undefined => {
  for (const category of categoryList) {
    const item = category.docs.find((categoryItem) => categoryItem.doc_id === targetId)
    if (item) return item

    const childItem = findItem(targetId, category.children)
    if (childItem) return childItem
  }

  return undefined
}

// 배치된 문서가 속한 목록 조회
const findItemList = (
  targetId: string,
  categoryList: SectionTreeInput[] = categories.value
): SectionDocInput[] | undefined => {
  for (const category of categoryList) {
    if (category.docs.some((item) => item.doc_id === targetId)) return category.docs

    const childItems = findItemList(targetId, category.children)
    if (childItems) return childItems
  }

  return undefined
}

// 하위 카테고리 기본 제목 생성
const getDefaultChildCategoryTitle = (parentId: string): string => {
  const parent = findCategory(parentId)
  const nextOrder = (parent?.children.length ?? 0) + 1
  const parentCode = parent ? getCategoryCode(parent.name) : ''
  const childDepth = getCategoryDepth(parentId) + 1
  const childLabel = getCategoryOrderLabel(childDepth, nextOrder)

  return parentCode
    ? `${parentCode}-${childLabel} 새 하위 카테고리`
    : `${childLabel} 새 하위 카테고리`
}

// 카테고리 펼침 여부
const isCategoryExpanded = (categoryId: string): boolean =>
  expandedCategoryIds.value.has(categoryId)

const isSearchCategoryExpanded = (categoryId: string): boolean => isCategoryExpanded(categoryId)

// 카테고리 접기/펼치기
const toggleCategory = (categoryId: string): void => {
  const nextIds = new Set(expandedCategoryIds.value)

  if (nextIds.has(categoryId)) {
    nextIds.delete(categoryId)
  } else {
    nextIds.add(categoryId)
  }

  expandedCategoryIds.value = nextIds
}

// 워크스페이스 펼침 여부
const isWorkspaceExpanded = (workspaceId: string): boolean =>
  expandedWorkspaceIds.value.has(workspaceId)

// 워크스페이스 접기/펼치기
const toggleWorkspace = (workspaceId: string): void => {
  const nextIds = new Set(expandedWorkspaceIds.value)

  if (nextIds.has(workspaceId)) {
    nextIds.delete(workspaceId)
  } else {
    nextIds.add(workspaceId)
  }

  expandedWorkspaceIds.value = nextIds
}

// 항목 우클릭 메뉴 열기
const openActionContextMenu = (event: MouseEvent, target: ActionTarget): void => {
  openActionMenu(event, target)
}

// 빈 영역 우클릭 메뉴 열기
const openRootCategoryContextMenu = (event: MouseEvent): void => {
  openActionMenu(event, {
    kind: 'category-root',
    id: 'category-root',
    title: '상위 카테고리'
  })
}

// 프로젝트 산출물 목록으로 이동
const goProjectDeliverables = (): void => {
  void router.push({
    name: 'projects-index',
    params: {
      id: String(route.params.id)
    },
    query: {
      tab: 'deliverables'
    }
  })
}

// 산출물 미리보기로 이동
const goPreview = (): void => {
  void router.push({
    name: 'deliverable-preview',
    params: {
      id: String(route.params.id),
      deliverableId: String(route.params.deliverableId)
    },
    query: {
      from: 'deliverable-structure'
    }
  })
}

// 카테고리 추가 입력 시작
const startAddCategory = (parentId: string | null = null): void => {
  isAddingCategory.value = true
  addingCategoryParentId.value = parentId
  newCategoryTitle.value = parentId
    ? getDefaultChildCategoryTitle(parentId)
    : getDefaultCategoryTitle()

  if (parentId) {
    expandedCategoryIds.value = new Set([...expandedCategoryIds.value, parentId])
  }

  closeActionMenu()
}

// 선택 카테고리 하위 추가 시작
const startAddSelectedCategory = (): void => {
  const target = selectedActionTarget.value
  if (target?.kind !== 'category') return

  startAddCategory(target.id)
}

// 루트 카테고리 추가 시작
const startAddRootCategory = (): void => {
  startAddCategory(null)
}

// 카테고리 추가 취소
const cancelAddCategory = (): void => {
  isAddingCategory.value = false
  addingCategoryParentId.value = null
  newCategoryTitle.value = ''
}

// 새 카테고리 생성
const submitNewCategory = (): void => {
  const title = newCategoryTitle.value.trim()

  if (!title) return

  const newCategory: SectionTreeInput = {
    id: createCategoryId(),
    name: title,
    docs: [],
    children: []
  }

  if (addingCategoryParentId.value) {
    findCategory(addingCategoryParentId.value)?.children.push(newCategory)
  } else {
    categories.value.push(newCategory)
  }

  expandedCategoryIds.value = new Set([...expandedCategoryIds.value, newCategory.id])
  cancelAddCategory()
}

// 편집 중인 항목 여부
const isEditing = (kind: ActionTargetKind, id: string): boolean =>
  editTarget.value?.kind === kind && editTarget.value.id === id

// 카테고리명 편집 시작
const startEditCategory = (category: SectionTreeInput): void => {
  editTarget.value = { kind: 'category', id: category.id, title: category.name }
  editTitle.value = category.name
  closeActionMenu()
}

// 문서명 편집 시작
const startEditItem = (item: SectionDocInput): void => {
  editTarget.value = { kind: 'item', id: item.doc_id, title: item.doc_title }
  editTitle.value = item.doc_title
  closeActionMenu()
}

// 선택 항목 편집 시작
const startEditSelected = (): void => {
  const target = selectedActionTarget.value
  if (!target || target.kind === 'category-root') return

  if (target.kind === 'category') {
    const category = findCategory(target.id)
    if (category) startEditCategory(category)
  } else {
    const item = findItem(target.id)
    if (item) startEditItem(item)
  }
}

const openSelectedDocument = (): void => {
  const target = selectedActionTarget.value
  if (target?.kind !== 'item') return

  const item = findItem(target.id)
  if (!item) return

  closeActionMenu()
  openDocumentPreview(item)
}

// 편집 취소
const cancelEdit = (): void => {
  editTarget.value = null
  editTitle.value = ''
}

// 편집 내용 저장
const submitEdit = (): void => {
  const title = editTitle.value.trim()
  if (!editTarget.value || !title) return

  if (editTarget.value.kind === 'category') {
    const category = findCategory(editTarget.value.id)
    if (category) category.name = title
  } else {
    const item = findItem(editTarget.value.id)
    if (item) item.doc_title = title
  }

  cancelEdit()
}

// 선택 항목 삭제 확인 열기
const requestDeleteSelected = (): void => {
  const target = selectedActionTarget.value
  if (!target || target.kind === 'category-root') return

  deleteTarget.value = { ...target }
  closeActionMenu()
  modalConfirmRef.value?.onOpen()
}

// 선택 항목 삭제
const confirmDelete = (): void => {
  if (!deleteTarget.value) return

  if (deleteTarget.value.kind === 'category') {
    const categoryList = findCategoryList(deleteTarget.value.id)
    const categoryIndex = categoryList?.findIndex(
      (category) => category.id === deleteTarget.value?.id
    )

    if (categoryList && categoryIndex !== undefined && categoryIndex >= 0) {
      categoryList.splice(categoryIndex, 1)
    }
  } else {
    const itemList = findItemList(deleteTarget.value.id)
    const itemIndex = itemList?.findIndex((item) => item.doc_id === deleteTarget.value?.id)

    if (itemList && itemIndex !== undefined && itemIndex >= 0) {
      itemList.splice(itemIndex, 1)
    }
  }

  deleteTarget.value = null
}

// 복제 문서 ID에서 원본 문서 ID 추출
const getOriginalItemId = (itemId: string): string => itemId.split('-copy-')[0]

const getDocumentTitle = (item: SectionDocInput): string =>
  item.doc_title.trim() || '제목이 없는 문서'

const isSelectedSourceDoc = (item: SectionDocInput): boolean =>
  selectedSourceOriginalDocId.value === getOriginalItemId(item.doc_id)

const selectSourceDoc = (item: SectionDocInput): void => {
  const originalDocId = getOriginalItemId(item.doc_id)
  selectedSourceOriginalDocId.value =
    selectedSourceOriginalDocId.value === originalDocId ? null : originalDocId
}

const collectDocPlacements = (
  originalDocId: string,
  categoryList: SectionTreeInput[] = categories.value,
  parentPath = ''
): string[] =>
  categoryList.flatMap((category) => {
    const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name
    const currentPlacements = category.docs.some(
      (item) => getOriginalItemId(item.doc_id) === originalDocId
    )
      ? [currentPath]
      : []

    return [
      ...currentPlacements,
      ...collectDocPlacements(originalDocId, category.children, currentPath)
    ]
  })

const getSourceDocPlacementCount = (item: SectionDocInput): number =>
  collectDocPlacements(getOriginalItemId(item.doc_id)).length

const getSourceDocPlacementLabel = (item: SectionDocInput): string => {
  const placementCount = getSourceDocPlacementCount(item)

  return placementCount > 0 ? `${placementCount}개` : '-'
}

// 워크스페이스 bundle ID에서 워크스페이스 ID 추출
const getWorkspaceIdFromBundleId = (itemId: string): string | null => {
  const originalId = getOriginalItemId(itemId)
  const prefix = 'workspace-bundle-'

  return originalId.startsWith(prefix) ? originalId.slice(prefix.length) : null
}

// 카테고리 포함 여부 확인
const hasCategoryId = (category: SectionTreeInput, categoryId: string): boolean =>
  category.id === categoryId || category.children.some((child) => hasCategoryId(child, categoryId))

// 루트 카테고리 조회
const findRootCategory = (categoryId: string): SectionTreeInput | undefined =>
  categories.value.find((category) => hasCategoryId(category, categoryId))

// 카테고리 안 원본 문서 개수 계산
const countItemsInCategory = (originalItemId: string, category: SectionTreeInput): number => {
  const currentCount = category.docs.filter(
    (item) => getOriginalItemId(item.doc_id) === originalItemId
  ).length

  return category.children.reduce(
    (count, child) => count + countItemsInCategory(originalItemId, child),
    currentCount
  )
}

// 문서가 속한 워크스페이스명 조회
const getItemWorkspaceName = (item: SectionDocInput): string => {
  const originalItemId = getOriginalItemId(item.doc_id)
  const workspace = workspaces.value.find((workspace) =>
    workspace.items.some(
      (workspaceItem) => getOriginalItemId(workspaceItem.doc_id) === originalItemId
    )
  )

  return workspace?.name ?? ''
}

// 문서 미리보기 열기
const openDocumentPreview = (item: SectionDocInput): void => {
  void docPreviewModalRef.value?.onOpen(item, getItemWorkspaceName(item))
}

// 프로젝트 워크스페이스와 문서 목록 로드
const loadProjectWorkspaces = async (): Promise<void> => {
  const projectId = Number(route.params.id)

  if (!projectId) {
    workspaces.value = []
    return
  }

  isLoadingWorkspaces.value = true

  try {
    const workspaceRows = await getWorkspaces({ project_id: projectId, limit: 100, offset: 0 })
    const workspaceDocs = await Promise.all(
      workspaceRows.map(async (workspace) => ({
        workspace,
        docs: await getDocList({ workspaceId: workspace.id })
      }))
    )

    workspaces.value = workspaceDocs.map(({ workspace, docs }) =>
      mapWorkspaceToStructureWorkspace(workspace, docs)
    )
    expandedWorkspaceIds.value = new Set(workspaces.value.map((workspace) => workspace.id))
  } finally {
    isLoadingWorkspaces.value = false
  }
}

// 저장된 산출물 구조 로드
const loadDeliverableStructure = async (): Promise<void> => {
  const deliverableId = Number(route.params.deliverableId)
  if (!deliverableId) {
    isApplyingStructure = true
    categories.value = []
    await nextTick()
    isApplyingStructure = false
    isStructureReady.value = true
    return
  }

  const structure = await getDeliverableStructure(deliverableId)
  const loadedCategories = buildCategoriesFromStructure(structure.sections, structure.sectionDocs)

  isApplyingStructure = true
  categories.value = loadedCategories.length > 0 ? loadedCategories : [createDefaultRootCategory()]
  expandedCategoryIds.value = new Set(collectCategoryIds(categories.value))
  await nextTick()
  isApplyingStructure = false
  isStructureReady.value = true
}

// 자동저장 버전 증가
const getNextAutoSaveVersion = (): number => {
  autoSaveVersion += 1
  return autoSaveVersion
}

// 산출물 구조 저장
const saveStructure = async (version: number): Promise<void> => {
  if (!isStructureReady.value) return

  const deliverableId = Number(route.params.deliverableId)
  if (!deliverableId) return

  autoSaveState.status = 'saving'
  const isSaved = await saveDeliverableStructure({
    deliverableId,
    sections: categories.value
  })

  if (version !== autoSaveVersion) return

  if (isSaved) {
    autoSaveState.status = 'saved'
    autoSaveState.savedAt = Date.now()
    return
  }

  autoSaveState.status = 'error'
}

// 카테고리에 들어갈 문서 복제
const cloneDocumentForCategory = (item: SectionDocInput): SectionDocInput => ({
  ...item,
  doc_id: `${item.doc_id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
})

// 워크스페이스 bundle을 개별 문서 목록으로 확장
const expandWorkspaceBundle = (
  categoryId: string,
  targetItems: SectionDocInput[],
  itemIndex: number
): boolean => {
  const bundleItem = targetItems[itemIndex]
  const workspaceId = getWorkspaceIdFromBundleId(bundleItem.doc_id)
  if (!workspaceId) return false

  const rootCategory = findRootCategory(categoryId)
  if (!rootCategory) return false

  const workspace = workspaces.value.find((item) => item.id === workspaceId)
  const duplicateItems =
    workspace?.items.filter(
      (item) => countItemsInCategory(getOriginalItemId(item.doc_id), rootCategory) > 0
    ) ?? []
  const availableItems =
    workspace?.items.filter(
      (item) => countItemsInCategory(getOriginalItemId(item.doc_id), rootCategory) === 0
    ) ?? []

  targetItems.splice(itemIndex, 1, ...availableItems.map(cloneDocumentForCategory))

  if (availableItems.length !== workspace?.items.length) {
    const [firstDuplicate] = duplicateItems
    const duplicateLabel = firstDuplicate
      ? duplicateItems.length > 1
        ? `${firstDuplicate.doc_title} 외 ${duplicateItems.length - 1}개 문서`
        : firstDuplicate.doc_title
      : '선택한 문서'

    showToast(`${duplicateLabel}는 이미 있어 제외하고, 나머지 문서를 카테고리에 추가했습니다.`)
  }

  return true
}

// 하위 카테고리 목록 갱신
const updateCategoryChildren = (categoryId: string, children: SectionTreeInput[]): void => {
  const category = findCategory(categoryId)
  if (category) category.children = children
}

// 카테고리 문서 목록 갱신
const updateCategoryItems = (categoryId: string, items: SectionDocInput[]): void => {
  const category = findCategory(categoryId)
  if (category) category.docs = items
}

// 카테고리에 문서 드롭 후 중복/번들 처리
const onCategoryNodeItemAdd = async (categoryId: string, event: DragAddEvent): Promise<void> => {
  if (event.newIndex === undefined) return

  await nextTick()

  const targetItems = findCategory(categoryId)?.docs
  if (!targetItems) return

  if (expandWorkspaceBundle(categoryId, targetItems, event.newIndex)) return

  const addedItem = targetItems[event.newIndex]
  const rootCategory = findRootCategory(categoryId)
  if (!addedItem || !rootCategory) return

  if (countItemsInCategory(getOriginalItemId(addedItem.doc_id), rootCategory) <= 1) return

  targetItems.splice(event.newIndex, 1)
  showToast(`'${addedItem.doc_title}'은(는) 해당 카테고리에 이미 존재합니다.`)
}

// 자동저장 진행 여부
const isAutoSaving = computed(
  () => autoSaveState.status === 'pending' || autoSaveState.status === 'saving'
)

// 자동저장 실패 여부
const isAutoSaveError = computed(() => autoSaveState.status === 'error')

// 자동저장 상태 메시지
const autoSaveMessage = computed(() => {
  if (autoSaveState.status === 'pending') return '저장 중'
  if (autoSaveState.status === 'saving') return '자동저장 중'
  if (autoSaveState.status === 'error') return '자동저장 실패'
  if (autoSaveState.status !== 'saved' || !autoSaveState.savedAt) return ''

  const diffSeconds = Math.max(0, Math.floor((nowTime.value - autoSaveState.savedAt) / 1000))
  return diffSeconds < 10 ? '방금 전 자동저장' : '자동저장됨'
})

// 구조 변경 자동저장 예약
const scheduleStructureSave = (): void => {
  if (!isStructureReady.value || isApplyingStructure) return

  if (autoSaveTimer) window.clearTimeout(autoSaveTimer)
  const version = getNextAutoSaveVersion()
  autoSaveState.status = 'pending'

  autoSaveTimer = window.setTimeout(() => {
    autoSaveTimer = null
    void saveStructure(version)
  }, 600)
}

// 대기 중인 자동저장 즉시 실행
const flushPendingStructureSave = (): void => {
  if (!autoSaveTimer) return

  window.clearTimeout(autoSaveTimer)
  autoSaveTimer = null
  void saveStructure(autoSaveVersion)
}

// 카테고리 구조 변경 감지
watch(categories, scheduleStructureSave, { deep: true })

// 화면 진입 초기 데이터 로드
onMounted(() => {
  const relativeTimeTimer = window.setInterval(() => {
    nowTime.value = Date.now()
  }, 1000)

  onUnmounted(() => {
    window.clearInterval(relativeTimeTimer)
  })

  void loadDeliverableStructure()
  void loadProjectWorkspaces()
})

// 화면 이탈 전 대기 저장 처리
onUnmounted(() => {
  stopSplitResize()
  clearToast()
  flushPendingStructureSave()
})
</script>
