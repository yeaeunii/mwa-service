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
            <div class="truncate text-sm font-bold leading-tight">산출물 문서 구조 구성</div>
            <div class="text-xs text-base-content/50">
              <div class="flex items-center gap-1.5 text-xs text-base-content/50">
                <template v-if="isAutoSaving">
                  <i-lucide-loader-circle class="h-3 w-3 animate-spin text-primary" />
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
      class="mx-auto grid h-full min-h-0 w-full max-w-[1280px] flex-1 grid-cols-[1fr_1fr] overflow-hidden"
    >
      <section
        class="order-2 flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-base-300 bg-base-100"
      >
        <div class="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5">
          <div>
            <h2 class="text-sm font-bold">산출물 카테고리 구성</h2>
            <p class="mt-1 text-xs text-base-content/55">문서 구조를 정의하고 순서를 배치합니다.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline gap-1.5" @click="goPreview">
              <i-lucide-eye class="h-4 w-4" />
              미리보기
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline btn-primary"
              :disabled="isAddingCategory"
              @click="startAddCategory()"
            >
              <i-lucide-plus class="h-4 w-4" />
              카테고리 추가
            </button>
          </div>
        </div>

        <div class="shrink-0 border-b border-base-300 bg-base-100 px-6 py-3">
          <div class="flex items-center justify-end">
            <label class="input input-sm w-72">
              <i-lucide-search class="h-3.5 w-3.5 opacity-45" />
              <input v-model="categorySearchQuery" type="search" placeholder="문서 검색..." />
            </label>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-scroll p-6">
          <form
            v-if="isAddingCategory && addingCategoryParentId === null"
            class="mb-3 flex items-center gap-2 rounded-lg border border-primary/25 bg-base-100 p-2 shadow-sm"
            @submit.prevent="submitNewCategory"
          >
            <i-lucide-folder-plus class="ml-1 h-4 w-4 shrink-0 text-primary" />
            <input
              v-model="newCategoryTitle"
              type="text"
              class="input input-sm input-bordered min-w-0 flex-1"
              placeholder="카테고리명"
              autofocus
            />
            <button type="submit" class="btn btn-primary btn-sm btn-square">
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
            :disabled="Boolean(categorySearchQuery.trim())"
            handle=".category-handle"
            item-key="id"
          >
            <div v-for="category in filteredCategories" :key="category.id" class="mb-3">
              <div
                class="relative flex h-9 items-center gap-2 rounded-lg border border-primary/25 bg-base-100 px-3 shadow-sm"
                @click.stop
                @contextmenu.prevent.stop="
                  openActionContextMenu($event, getCategoryTarget(category))
                "
              >
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  @click="toggleCategory(category.id)"
                >
                  <i-lucide-chevron-down
                    v-if="isCategoryExpanded(category.id)"
                    class="h-4 w-4 text-base-content/60"
                  />
                  <i-lucide-chevron-right v-else class="h-4 w-4 text-base-content/60" />
                </button>
                <i-lucide-folder class="h-4 w-4 text-primary" />
                <form
                  v-if="isEditing('category', category.id)"
                  class="flex min-w-0 flex-1 items-center gap-2"
                  @submit.prevent="submitEdit"
                >
                  <input
                    v-model="editTitle"
                    type="text"
                    class="input input-xs input-bordered min-w-0 flex-1"
                    autofocus
                  />
                  <button type="submit" class="btn btn-primary btn-xs btn-square">
                    <i-lucide-check class="h-3.5 w-3.5" />
                  </button>
                  <button type="button" class="btn btn-ghost btn-xs btn-square" @click="cancelEdit">
                    <i-lucide-x class="h-3.5 w-3.5" />
                  </button>
                </form>
                <span v-else class="min-w-0 flex-1 truncate text-xs font-bold">
                  {{ category.title }}
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  :disabled="isAddingCategory"
                  @click.stop="startAddCategory(category.id)"
                >
                  <i-lucide-plus class="h-3.5 w-3.5" />
                </button>
              </div>

              <form
                v-if="
                  isCategoryExpanded(category.id) &&
                  isAddingCategory &&
                  addingCategoryParentId === category.id
                "
                class="ml-5 mt-1 flex items-center gap-2 border-l-2 border-primary/20 pl-3"
                @submit.prevent="submitNewCategory"
              >
                <i-lucide-folder-plus class="h-4 w-4 shrink-0 text-primary" />
                <input
                  v-model="newCategoryTitle"
                  type="text"
                  class="input input-sm input-bordered min-w-0 flex-1"
                  placeholder="하위 카테고리명"
                  autofocus
                />
                <button type="submit" class="btn btn-primary btn-sm btn-square">
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
                v-if="isCategoryExpanded(category.id)"
                v-model="category.children"
                :animation="180"
                handle=".category-handle"
                item-key="id"
                class="ml-5 mt-1 space-y-1 border-l-2 border-primary/20 pl-3"
              >
                <div v-for="child in category.children" :key="child.id">
                  <div
                    class="relative flex h-8 items-center gap-2 rounded-md border border-base-300 bg-base-100 px-3"
                    @click.stop
                    @contextmenu.prevent.stop="
                      openActionContextMenu($event, getCategoryTarget(child))
                    "
                  >
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-square"
                      @click="toggleCategory(child.id)"
                    >
                      <i-lucide-chevron-down
                        v-if="isCategoryExpanded(child.id)"
                        class="h-3.5 w-3.5 text-base-content/50"
                      />
                      <i-lucide-chevron-right v-else class="h-3.5 w-3.5 text-base-content/50" />
                    </button>
                    <i-lucide-folder class="h-3.5 w-3.5 text-primary" />
                    <form
                      v-if="isEditing('category', child.id)"
                      class="flex min-w-0 flex-1 items-center gap-2"
                      @submit.prevent="submitEdit"
                    >
                      <input
                        v-model="editTitle"
                        type="text"
                        class="input input-xs input-bordered min-w-0 flex-1"
                        autofocus
                      />
                      <button type="submit" class="btn btn-primary btn-xs btn-square">
                        <i-lucide-check class="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-square"
                        @click="cancelEdit"
                      >
                        <i-lucide-x class="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <span v-else class="min-w-0 flex-1 truncate text-xs font-semibold">
                      {{ child.title }}
                    </span>
                  </div>

                  <VueDraggable
                    v-if="isCategoryExpanded(child.id)"
                    v-model="child.items"
                    :animation="180"
                    :group="categoryGroup"
                    item-key="id"
                    class="ml-5 mt-1 space-y-1 border-l-2 border-base-300 pl-3"
                    @add="onCategoryItemAdd(child.items, $event)"
                  >
                    <div
                      v-for="item in child.items"
                      :key="item.id"
                      class="relative flex h-8 items-center gap-2 rounded-md border border-base-300 bg-base-100 px-3"
                      @click.stop
                      @contextmenu.prevent.stop="openActionContextMenu($event, getItemTarget(item))"
                    >
                      <i-lucide-file-text class="h-3.5 w-3.5 text-primary/70" />
                      <form
                        v-if="isEditing('item', item.id)"
                        class="flex min-w-0 flex-1 items-center gap-2"
                        @submit.prevent="submitEdit"
                      >
                        <input
                          v-model="editTitle"
                          type="text"
                          class="input input-xs input-bordered min-w-0 flex-1"
                          autofocus
                        />
                        <button type="submit" class="btn btn-primary btn-xs btn-square">
                          <i-lucide-check class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs btn-square"
                          @click="cancelEdit"
                        >
                          <i-lucide-x class="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <span v-else class="min-w-0 flex-1 truncate text-xs">{{ item.title }}</span>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-square"
                        @click.stop="openDocumentDetail(item)"
                      >
                        <i-lucide-eye class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </VueDraggable>
                </div>
              </VueDraggable>

              <VueDraggable
                v-if="isCategoryExpanded(category.id)"
                v-model="category.items"
                :animation="180"
                :group="categoryGroup"
                item-key="id"
                class="ml-5 mt-1 space-y-1 border-l-2 border-primary/20 pl-3"
                :class="{
                  'min-h-8 rounded-md border border-dashed border-primary/20 bg-primary/5 py-1':
                    !category.items.length
                }"
                @add="onCategoryItemAdd(category.items, $event)"
              >
                <div
                  v-for="item in category.items"
                  :key="item.id"
                  class="relative flex h-8 items-center gap-2 rounded-md border border-base-300 bg-base-100 px-3"
                  @click.stop
                  @contextmenu.prevent.stop="openActionContextMenu($event, getItemTarget(item))"
                >
                  <i-lucide-chevron-right class="h-3.5 w-3.5 text-base-content/50" />
                  <i-lucide-file-text class="h-3.5 w-3.5 text-primary/70" />
                  <form
                    v-if="isEditing('item', item.id)"
                    class="flex min-w-0 flex-1 items-center gap-2"
                    @submit.prevent="submitEdit"
                  >
                    <input
                      v-model="editTitle"
                      type="text"
                      class="input input-xs input-bordered min-w-0 flex-1"
                      autofocus
                    />
                    <button type="submit" class="btn btn-primary btn-xs btn-square">
                      <i-lucide-check class="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-square"
                      @click="cancelEdit"
                    >
                      <i-lucide-x class="h-3.5 w-3.5" />
                    </button>
                  </form>
                  <span v-else class="min-w-0 flex-1 truncate text-xs">{{ item.title }}</span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square"
                    @click.stop="openDocumentDetail(item)"
                  >
                    <i-lucide-eye class="h-3.5 w-3.5" />
                  </button>
                </div>
              </VueDraggable>
            </div>
          </VueDraggable>
        </div>
      </section>

      <section
        class="order-1 flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-base-300 bg-base-200"
      >
        <div class="border-b border-base-300 px-6 py-5">
          <h2 class="text-sm font-bold">워크스페이스 문서 목록</h2>
          <p class="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <i-lucide-info class="h-3.5 w-3.5" />
            워크스페이스 전체 또는 문서를 드래그하여 산출물 카테고리에 배치하세요.
          </p>
        </div>

        <div class="shrink-0 border-b border-base-300 bg-base-200 px-6 py-3">
          <div class="flex items-center justify-end">
            <label class="input input-sm w-72">
              <i-lucide-search class="h-3.5 w-3.5 opacity-45" />
              <input type="search" placeholder="문서 검색..." />
            </label>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-scroll p-6">
          <div
            v-if="isLoadingWorkspaces"
            class="flex h-32 items-center justify-center text-sm text-base-content/50"
          >
            <i-lucide-loader-circle class="mr-2 h-4 w-4 animate-spin" />
            워크스페이스 문서를 불러오는 중입니다
          </div>

          <div
            v-else-if="workspaces.length === 0"
            class="flex h-32 items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 text-sm text-base-content/50"
          >
            워크스페이스 문서가 없습니다
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              class="rounded-xl border border-base-300 bg-base-100 shadow-sm"
            >
              <VueDraggable
                v-model="workspace.bundleItems"
                :animation="180"
                :group="sourceGroup"
                :clone="cloneStructureItem"
                item-key="id"
                :sort="false"
              >
                <div
                  v-for="bundle in workspace.bundleItems"
                  :key="bundle.id"
                  class="flex cursor-grab items-center gap-2 border-b border-base-200 px-4 py-3"
                >
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square cursor-pointer"
                    @click.stop="toggleWorkspace(workspace.id)"
                  >
                    <i-lucide-chevron-down
                      v-if="isWorkspaceExpanded(workspace.id)"
                      class="h-4 w-4 text-base-content/60"
                    />
                    <i-lucide-chevron-right v-else class="h-4 w-4 text-base-content/60" />
                  </button>
                  <i-lucide-folder-open class="h-4 w-4 text-primary" />
                  <span class="min-w-0 flex-1 truncate text-xs font-bold">
                    {{ workspace.name }}</span
                  >
                  <span class="text-[11px] text-base-content/45">
                    {{ getDocumentCount(workspace) }}개
                  </span>
                </div>
              </VueDraggable>

              <VueDraggable
                v-if="isWorkspaceExpanded(workspace.id)"
                v-model="workspace.items"
                :animation="180"
                :group="sourceGroup"
                :clone="cloneStructureItem"
                item-key="id"
                :sort="false"
                class="space-y-2 p-3"
              >
                <div
                  v-for="item in workspace.items"
                  :key="item.id"
                  class="flex items-center gap-3 rounded-lg border border-base-300 px-3 py-3"
                  :class="
                    isItemPlaced(item)
                      ? 'bg-base-200/70 text-base-content/40 opacity-70'
                      : 'bg-base-100'
                  "
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    :class="
                      isItemPlaced(item)
                        ? 'bg-base-300 text-base-content/40'
                        : item.kind === 'workspace'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-base-200 text-base-content/50'
                    "
                  >
                    <i-lucide-folder-open v-if="item.kind === 'workspace'" class="h-4 w-4" />
                    <i-lucide-file-text v-else class="h-4 w-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-xs font-bold">{{ item.title }}</div>
                    <div class="mt-1 text-[11px] text-base-content/50">
                      {{ item.meta }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square"
                    @click.stop="openDocumentDetail(item)"
                  >
                    <i-lucide-eye class="h-4 w-4" />
                  </button>
                </div>
              </VueDraggable>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="actionMenu.visible"
      class="menu fixed z-[1000] w-32 rounded-box border border-base-300 bg-base-100 p-1.5 text-xs shadow-xl"
      :style="{ left: `${actionMenu.x}px`, top: `${actionMenu.y}px` }"
      @click.stop
      @contextmenu.prevent.stop
    >
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

    <ModalAlert ref="modalAlertRef" />
  </div>
</template>

<script setup lang="ts">
import {
  deliverableStructureCategories,
  type StructureCategory,
  type StructureItem,
  type StructureWorkspace
} from '@/assets/dummy/data'
import { getDocList, getWorkspaces } from '@/database'
import { useContextMenu } from '@renderer/composables/useContextMenu'
import type { Doc, Workspace } from '@database/dto'
import { VueDraggable } from 'vue-draggable-plus'
import { useRoute, useRouter } from 'vue-router'

type ActionTargetKind = 'category' | 'item'

interface ActionTarget {
  kind: ActionTargetKind
  id: string
  title: string
}

interface DragAddEvent {
  newIndex?: number
}

interface StructureWorkspaceView extends StructureWorkspace {
  bundleItems: StructureItem[]
}

const route = useRoute()
const router = useRouter()
const categoryGroup = { name: 'deliverable-structure' }
const sourceGroup = { name: 'deliverable-structure', pull: 'clone' as const, put: false }
const autoSaveStatus = ref<'saving' | 'saved'>('saved')
let autoSaveTimer: number | null = null
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)
const modalAlertRef = ref<ComponentRef<'ModalAlert'> | null>(null)
const {
  contextMenu: actionMenu,
  selectedItem: selectedActionTarget,
  openContextMenu: openActionMenu,
  closeContextMenu: closeActionMenu
} = useContextMenu<ActionTarget>()

const cloneStructureItem = (item: StructureItem): StructureItem => ({
  ...item,
  id: `${item.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
})

const getDocumentCount = (workspace: StructureWorkspace): number =>
  workspace.items.filter((item) => item.kind === 'document').length

const cloneCategories = (): StructureCategory[] => deliverableStructureCategories.map(cloneCategory)

const cloneCategory = (category: StructureCategory): StructureCategory => ({
  ...category,
  items: category.items.map((item) => ({ ...item })),
  children: category.children.map(cloneCategory)
})

const formatDocMeta = (doc: Doc): string => {
  const updatedAt = doc.updated_at ? new Date(doc.updated_at) : null
  const formattedDate =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      : '-'

  return `수정일: ${formattedDate}`
}

const mapDocToStructureItem = (doc: Doc): StructureItem => ({
  id: String(doc.id),
  kind: 'document',
  title: doc.title,
  meta: formatDocMeta(doc),
  badge: doc.status ?? ''
})

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

const createWorkspaceBundleItem = (workspace: StructureWorkspace): StructureItem => ({
  id: `workspace-bundle-${workspace.id}`,
  kind: 'workspace',
  title: workspace.name,
  meta: '워크스페이스 문서 전체',
  badge: ''
})

const cloneWorkspaces = (): StructureWorkspaceView[] => []

const categories = ref<StructureCategory[]>(cloneCategories())
const workspaces = ref<StructureWorkspaceView[]>(cloneWorkspaces())
const isLoadingWorkspaces = ref(false)
const isAddingCategory = ref(false)
const addingCategoryParentId = ref<string | null>(null)
const newCategoryTitle = ref('')
const categorySearchQuery = ref('')
const editTarget = ref<ActionTarget | null>(null)
const editTitle = ref('')
const deleteTarget = ref<ActionTarget | null>(null)

const collectCategoryIds = (categoryList: StructureCategory[]): string[] =>
  categoryList.flatMap((category) => [category.id, ...collectCategoryIds(category.children)])

const expandedCategoryIds = ref(new Set(collectCategoryIds(categories.value)))
const expandedWorkspaceIds = ref(new Set(workspaces.value.map((workspace) => workspace.id)))

const createCategoryId = (): string =>
  `category-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const getDefaultCategoryTitle = (): string =>
  `${String(categories.value.length + 1).padStart(2, '0')}. 새 카테고리`

const matchesCategorySearch = (category: StructureCategory, query: string): boolean =>
  category.title.toLowerCase().includes(query) ||
  category.items.some((item) => item.title.toLowerCase().includes(query)) ||
  category.children.some((child) => matchesCategorySearch(child, query))

const filteredCategories = computed(() => {
  const query = categorySearchQuery.value.trim().toLowerCase()

  if (!query) return categories.value

  return categories.value.filter((category) => matchesCategorySearch(category, query))
})

const findCategory = (
  targetId: string,
  categoryList: StructureCategory[] = categories.value
): StructureCategory | undefined => {
  for (const category of categoryList) {
    if (category.id === targetId) return category

    const child = findCategory(targetId, category.children)
    if (child) return child
  }

  return undefined
}

const findCategoryList = (
  targetId: string,
  categoryList: StructureCategory[] = categories.value
): StructureCategory[] | undefined => {
  if (categoryList.some((category) => category.id === targetId)) return categoryList

  for (const category of categoryList) {
    const childList = findCategoryList(targetId, category.children)
    if (childList) return childList
  }

  return undefined
}

const findItem = (
  targetId: string,
  categoryList: StructureCategory[] = categories.value
): StructureItem | undefined => {
  for (const category of categoryList) {
    const item = category.items.find((categoryItem) => categoryItem.id === targetId)
    if (item) return item

    const childItem = findItem(targetId, category.children)
    if (childItem) return childItem
  }

  return undefined
}

const findItemList = (
  targetId: string,
  categoryList: StructureCategory[] = categories.value
): StructureItem[] | undefined => {
  for (const category of categoryList) {
    if (category.items.some((item) => item.id === targetId)) return category.items

    const childItems = findItemList(targetId, category.children)
    if (childItems) return childItems
  }

  return undefined
}

const getDefaultChildCategoryTitle = (parentId: string): string => {
  const parent = findCategory(parentId)
  const nextOrder = (parent?.children.length ?? 0) + 1
  const parentNumber = parent?.title.match(/^(\d{2})\./)?.[1]

  return parentNumber
    ? `${parentNumber}-${nextOrder}. 새 하위 카테고리`
    : `${nextOrder}. 새 하위 카테고리`
}

const isCategoryExpanded = (categoryId: string): boolean =>
  expandedCategoryIds.value.has(categoryId)

const toggleCategory = (categoryId: string): void => {
  const nextIds = new Set(expandedCategoryIds.value)

  if (nextIds.has(categoryId)) {
    nextIds.delete(categoryId)
  } else {
    nextIds.add(categoryId)
  }

  expandedCategoryIds.value = nextIds
}

const isWorkspaceExpanded = (workspaceId: string): boolean =>
  expandedWorkspaceIds.value.has(workspaceId)

const toggleWorkspace = (workspaceId: string): void => {
  const nextIds = new Set(expandedWorkspaceIds.value)

  if (nextIds.has(workspaceId)) {
    nextIds.delete(workspaceId)
  } else {
    nextIds.add(workspaceId)
  }

  expandedWorkspaceIds.value = nextIds
}

const getCategoryTarget = (category: StructureCategory): ActionTarget => ({
  kind: 'category',
  id: category.id,
  title: category.title
})

const getItemTarget = (item: StructureItem): ActionTarget => ({
  kind: 'item',
  id: item.id,
  title: item.title
})

const openActionContextMenu = (event: MouseEvent, target: ActionTarget): void => {
  openActionMenu(event, target)
}

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

const startAddCategory = (parentId: string | null = null): void => {
  isAddingCategory.value = true
  addingCategoryParentId.value = parentId
  newCategoryTitle.value = parentId
    ? getDefaultChildCategoryTitle(parentId)
    : getDefaultCategoryTitle()
}

const cancelAddCategory = (): void => {
  isAddingCategory.value = false
  addingCategoryParentId.value = null
  newCategoryTitle.value = ''
}

const submitNewCategory = (): void => {
  const title = newCategoryTitle.value.trim()

  if (!title) return

  const newCategory: StructureCategory = {
    id: createCategoryId(),
    title,
    dotClass: 'bg-primary/20',
    items: [],
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

const isEditing = (kind: ActionTargetKind, id: string): boolean =>
  editTarget.value?.kind === kind && editTarget.value.id === id

const startEditCategory = (category: StructureCategory): void => {
  editTarget.value = { kind: 'category', id: category.id, title: category.title }
  editTitle.value = category.title
  closeActionMenu()
}

const startEditItem = (item: StructureItem): void => {
  editTarget.value = { kind: 'item', id: item.id, title: item.title }
  editTitle.value = item.title
  closeActionMenu()
}

const startEditSelected = (): void => {
  const target = selectedActionTarget.value
  if (!target) return

  if (target.kind === 'category') {
    const category = findCategory(target.id)
    if (category) startEditCategory(category)
  } else {
    const item = findItem(target.id)
    if (item) startEditItem(item)
  }
}

const cancelEdit = (): void => {
  editTarget.value = null
  editTitle.value = ''
}

const submitEdit = (): void => {
  const title = editTitle.value.trim()
  if (!editTarget.value || !title) return

  if (editTarget.value.kind === 'category') {
    const category = findCategory(editTarget.value.id)
    if (category) category.title = title
  } else {
    const item = findItem(editTarget.value.id)
    if (item) item.title = title
  }

  cancelEdit()
}

const requestDeleteSelected = (): void => {
  const target = selectedActionTarget.value
  if (!target) return

  deleteTarget.value = { ...target }
  closeActionMenu()
  modalConfirmRef.value?.onOpen()
}

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
    const itemIndex = itemList?.findIndex((item) => item.id === deleteTarget.value?.id)

    if (itemList && itemIndex !== undefined && itemIndex >= 0) {
      itemList.splice(itemIndex, 1)
    }
  }

  deleteTarget.value = null
}

const getOriginalItemId = (itemId: string): string => itemId.split('-copy-')[0]

const getWorkspaceIdFromBundleId = (itemId: string): string | null => {
  const originalId = getOriginalItemId(itemId)
  const prefix = 'workspace-bundle-'

  return originalId.startsWith(prefix) ? originalId.slice(prefix.length) : null
}

const countPlacedItems = (
  originalItemId: string,
  categoryList: StructureCategory[] = categories.value
): number =>
  categoryList.reduce((count, category) => {
    const categoryItemCount = category.items.filter(
      (item) => getOriginalItemId(item.id) === originalItemId
    ).length

    return count + categoryItemCount + countPlacedItems(originalItemId, category.children)
  }, 0)

const isItemPlaced = (item: StructureItem): boolean =>
  countPlacedItems(getOriginalItemId(item.id)) > 0

const findSourceWorkspaceId = (item: StructureItem): string | undefined => {
  const originalItemId = getOriginalItemId(item.id)

  return workspaces.value.find((workspace) =>
    workspace.items.some((workspaceItem) => workspaceItem.id === originalItemId)
  )?.id
}

const openDocumentDetail = (item: StructureItem): void => {
  const workspaceId = findSourceWorkspaceId(item)

  if (!workspaceId) {
    modalAlertRef.value?.onOpen('문서 상세 화면을 찾을 수 없습니다.')
    return
  }

  void router.push({
    name: 'docs-index',
    params: {
      id: workspaceId,
      docId: getOriginalItemId(item.id)
    },
    query: {
      from: 'deliverable-structure',
      projectId: String(route.params.id),
      deliverableId: String(route.params.deliverableId)
    }
  })
}

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

const cloneDocumentForCategory = (item: StructureItem): StructureItem => ({
  ...item,
  id: `${item.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
})

const expandWorkspaceBundle = (targetItems: StructureItem[], itemIndex: number): boolean => {
  const bundleItem = targetItems[itemIndex]
  const workspaceId = getWorkspaceIdFromBundleId(bundleItem.id)
  if (!workspaceId) return false

  const workspace = workspaces.value.find((item) => item.id === workspaceId)
  const availableItems =
    workspace?.items.filter((item) => countPlacedItems(getOriginalItemId(item.id)) === 0) ?? []

  targetItems.splice(itemIndex, 1, ...availableItems.map(cloneDocumentForCategory))

  if (availableItems.length !== workspace?.items.length) {
    modalAlertRef.value?.onOpen(
      availableItems.length > 0
        ? '이미 옮긴 문서를 제외하고 추가했습니다.'
        : '이미 옮긴 문서입니다.'
    )
  }

  return true
}

const onCategoryItemAdd = (targetItems: StructureItem[], event: DragAddEvent): void => {
  if (event.newIndex === undefined) return

  const addedItem = targetItems[event.newIndex]
  if (!addedItem) return

  if (expandWorkspaceBundle(targetItems, event.newIndex)) return

  const originalItemId = getOriginalItemId(addedItem.id)
  if (countPlacedItems(originalItemId) <= 1) return

  targetItems.splice(event.newIndex, 1)
  modalAlertRef.value?.onOpen('이미 옮긴 문서입니다.')
}

const isAutoSaving = computed(() => autoSaveStatus.value === 'saving')
const autoSaveMessage = computed(() =>
  autoSaveStatus.value === 'saving' ? '저장 중' : '방금 전 자동저장'
)

const showAutoSaveFeedback = (): void => {
  autoSaveStatus.value = 'saving'
  if (autoSaveTimer) window.clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(() => {
    autoSaveStatus.value = 'saved'
  }, 700)
}

watch(categories, showAutoSaveFeedback, { deep: true })

onMounted(() => {
  void loadProjectWorkspaces()
})

onUnmounted(() => {
  if (autoSaveTimer) window.clearTimeout(autoSaveTimer)
})
</script>
