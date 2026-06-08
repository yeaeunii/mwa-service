<template>
  <div class="min-w-0">
    <div
      class="category-handle relative flex h-9 min-w-0 cursor-grab items-center gap-2 border border-indigo-200 bg-indigo-100/80 px-2 text-indigo-950"
      @click.stop
      @contextmenu.prevent.stop="$emit('open-menu', $event, getCategoryTarget(category))"
    >
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square"
        @click="$emit('toggle-category', category.id)"
      >
        <i-lucide-chevron-down v-if="isExpanded" class="h-3.5 w-3.5 text-indigo-500" />
        <i-lucide-chevron-right v-else class="h-3.5 w-3.5 text-indigo-500" />
      </button>
      <i-fluent-folder-open-16-filled class="h-4 w-4 shrink-0 text-indigo-500" />
      <form
        v-if="isEditing('category', category.id)"
        class="flex min-w-0 flex-1 items-center gap-2"
        @submit.prevent="$emit('submit-edit')"
      >
        <input
          :value="editTitle"
          type="text"
          class="input input-xs input-bordered min-w-0 flex-1"
          autofocus
          @input="$emit('update:edit-title', ($event.target as HTMLInputElement).value)"
        />
        <button type="submit" class="btn btn-primary btn-xs btn-square">
          <i-lucide-check class="h-3.5 w-3.5" />
        </button>
        <button type="button" class="btn btn-ghost btn-xs btn-square" @click="$emit('cancel-edit')">
          <i-lucide-x class="h-3.5 w-3.5" />
        </button>
      </form>
      <span v-else class="min-w-0 flex-1 truncate text-xs font-bold">
        {{ category.name }}
      </span>
    </div>

    <form
      v-if="isExpanded && isAddingCategory && addingCategoryParentId === category.id"
      class="ml-5 mt-1 flex items-center gap-2 border-l-2 border-primary/20 pl-3"
      @submit.prevent="$emit('submit-new-category')"
    >
      <i-fluent-folder-open-16-filled class="h-4 w-4 shrink-0 text-indigo-500" />
      <input
        :value="newCategoryTitle"
        type="text"
        class="input input-sm input-bordered min-w-0 flex-1"
        placeholder="하위 카테고리명"
        autofocus
        @input="$emit('update:new-category-title', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="submit"
        class="btn btn-sm btn-square border-indigo-200 bg-indigo-100/80 text-indigo-950 hover:border-indigo-300 hover:bg-indigo-200"
      >
        <i-lucide-check class="h-4 w-4" />
      </button>
      <button type="button" class="btn btn-ghost btn-sm btn-square" @click="$emit('cancel-add')">
        <i-lucide-x class="h-4 w-4" />
      </button>
    </form>

    <VueDraggable
      v-if="isExpanded"
      :model-value="category.docs"
      :animation="180"
      :group="categoryGroup"
      item-key="doc_id"
      class="ml-5 min-w-0 overflow-hidden border-l-2 border-indigo-200/60 pl-3"
      :class="{
        'min-h-2 border-b border-dashed border-slate-200/50 py-0.5': !category.docs.length
      }"
      @update:model-value="$emit('update-items', category.id, $event)"
      @add="$emit('item-add', category.id, $event)"
    >
      <div
        v-for="item in category.docs"
        :key="item.doc_id"
        class="relative flex h-7 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden border-b border-slate-200 px-2 text-slate-950"
        :class="
          isSelectedDoc(item) ? 'border-l-4 border-yellow-200 bg-yellow-50 text-yellow-950' : ''
        "
        @click.stop
        @contextmenu.prevent.stop="$emit('open-menu', $event, getItemTarget(item))"
      >
        <form
          v-if="isEditing('item', item.doc_id)"
          class="flex min-w-0 flex-1 items-center gap-2"
          @submit.prevent="$emit('submit-edit')"
        >
          <input
            :value="editTitle"
            type="text"
            class="input input-xs input-bordered min-w-0 flex-1"
            autofocus
            @input="$emit('update:edit-title', ($event.target as HTMLInputElement).value)"
          />
          <button type="submit" class="btn btn-primary btn-xs btn-square">
            <i-lucide-check class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square"
            @click="$emit('cancel-edit')"
          >
            <i-lucide-x class="h-3.5 w-3.5" />
          </button>
        </form>
        <template v-else>
          <i-fluent-document-bullet-list-20-filled
            class="h-3.5 w-3.5 shrink-0 text-base-content/45"
          />
          <span class="block min-w-0 flex-1 basis-0 truncate text-xs font-semibold">
            {{ getDocumentTitle(item) }}
          </span>
        </template>
      </div>
    </VueDraggable>

    <VueDraggable
      v-if="isExpanded"
      :model-value="category.children"
      :animation="180"
      :group="categoryTreeGroup"
      handle=".category-handle"
      item-key="id"
      class="ml-5 min-w-0 overflow-hidden border-l-2 border-indigo-200/60 pl-3"
      @update:model-value="$emit('update-children', category.id, $event)"
    >
      <DeliverableCategoryNode
        v-for="child in category.children"
        :key="child.id"
        v-model:new-category-title="newCategoryTitleProxy"
        v-model:edit-title="editTitleProxy"
        :category="child"
        :category-group="categoryGroup"
        :category-tree-group="categoryTreeGroup"
        :is-adding-category="isAddingCategory"
        :adding-category-parent-id="addingCategoryParentId"
        :is-category-expanded="isCategoryExpanded"
        :is-editing="isEditing"
        :selected-original-doc-id="selectedOriginalDocId"
        :depth="depth + 1"
        @open-menu="(event, target) => $emit('open-menu', event, target)"
        @toggle-category="$emit('toggle-category', $event)"
        @submit-new-category="$emit('submit-new-category')"
        @cancel-add="$emit('cancel-add')"
        @submit-edit="$emit('submit-edit')"
        @cancel-edit="$emit('cancel-edit')"
        @update-children="(categoryId, children) => $emit('update-children', categoryId, children)"
        @update-items="(categoryId, items) => $emit('update-items', categoryId, items)"
        @item-add="(categoryId, event) => $emit('item-add', categoryId, event)"
      />
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import type { SectionDocInput, SectionTreeInput } from '@database/dto'
import { VueDraggable } from 'vue-draggable-plus'

type ActionTargetKind = 'category' | 'item'

interface ActionTarget {
  kind: ActionTargetKind
  id: string
  title: string
}

interface DragAddEvent {
  newIndex?: number
}

defineOptions({
  name: 'DeliverableCategoryNode'
})

const props = defineProps<{
  category: SectionTreeInput
  categoryGroup: { name: string }
  categoryTreeGroup: { name: string }
  isAddingCategory: boolean
  addingCategoryParentId: string | null
  newCategoryTitle: string
  editTitle: string
  isCategoryExpanded: (categoryId: string) => boolean
  isEditing: (kind: ActionTargetKind, id: string) => boolean
  selectedOriginalDocId: string | null
  depth: number
}>()

const emit = defineEmits<{
  'update:new-category-title': [value: string]
  'update:edit-title': [value: string]
  'open-menu': [event: MouseEvent, target: ActionTarget]
  'toggle-category': [categoryId: string]
  'submit-new-category': []
  'cancel-add': []
  'submit-edit': []
  'cancel-edit': []
  'update-children': [categoryId: string, children: SectionTreeInput[]]
  'update-items': [categoryId: string, items: SectionDocInput[]]
  'item-add': [categoryId: string, event: DragAddEvent]
}>()

const newCategoryTitleProxy = computed({
  get: () => props.newCategoryTitle,
  set: (value: string) => emit('update:new-category-title', value)
})

const editTitleProxy = computed({
  get: () => props.editTitle,
  set: (value: string) => emit('update:edit-title', value)
})

const isExpanded = computed(() => props.isCategoryExpanded(props.category.id))

const getOriginalItemId = (itemId: string): string => itemId.split('-copy-')[0]

const getDocumentTitle = (item: SectionDocInput): string =>
  item.doc_title.trim() || '제목이 없는 문서'

const isSelectedDoc = (item: SectionDocInput): boolean =>
  props.selectedOriginalDocId === getOriginalItemId(item.doc_id)

const getCategoryTarget = (category: SectionTreeInput): ActionTarget => ({
  kind: 'category',
  id: category.id,
  title: category.name
})

const getItemTarget = (item: SectionDocInput): ActionTarget => ({
  kind: 'item',
  id: item.doc_id,
  title: item.doc_title
})
</script>
