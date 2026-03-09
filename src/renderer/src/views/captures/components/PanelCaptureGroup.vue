<template>
  <div class="flex h-full w-80 flex-col gap-4 border-l border-white/10 bg-slate-900/85 p-4 backdrop-blur-sm">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="text-lg font-bold">화면 폴더링</div>
      </div>
      <button
        class="btn btn-sm border-0 bg-white text-blue-900 shadow-none hover:bg-sky-100 tooltip tooltip-bottom"
        data-tip="추가"
        @click="createFolder"
      >
        <i-lucide-plus />
      </button>
    </div>

    <div class="grow overflow-y-auto rounded-md bg-white/5 p-4">
      <div
        v-for="item of props.folderItems"
        :key="item.id"
        class="group card mb-3 cursor-pointer rounded-2xl border p-px shadow-sm transition-colors"
        :class="
          props.selectedFolderId === item.id
            ? 'border-white/80 bg-white/90'
            : 'border-slate-700 bg-slate-800 hover:border-slate-600'"
        @click="emits('onSelectFolder', item.id)"
      >
        <div class="card-body rounded-xl bg-slate-800 p-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="relative h-8 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-900"
              @click.stop="item.images.length > 0 && emits('onOpenCaptureModal')"
            >
              <img
                :src="getFolderThumbnail(item)"
                alt="image"
                class="h-full w-full object-cover"
              />
              <div class="absolute right-0 top-0 flex items-center justify-center">
                <div class="badge badge-sm badge-error rounded-none rounded-bl-md">
                  {{ item.images.length }}
                </div>
              </div>
            </button>
            <div class="flex min-w-0 grow items-center gap-2">
              <input
                v-if="editingFolderId === item.id"
                v-model="editingTitle"
                type="text"
                class="input input-xs h-7 w-full border-slate-600 bg-slate-700 text-xs font-semibold text-white shadow-none focus:border-slate-400 focus:outline-none"
                @click.stop
                @keydown.enter.prevent="commitFolderTitle(item.id)"
                @keydown.esc.prevent="cancelFolderEdit"
                @blur="commitFolderTitle(item.id)"
              />
              <div v-else class="truncate text-xs font-semibold text-white">
                {{ item.title }}
              </div>
            </div>
            <button
              v-if="editingFolderId === item.id"
              type="button"
              class="btn btn-ghost btn-xs tooltip tooltip-bottom h-7 min-h-0 w-7 p-0 text-white hover:bg-slate-700"
              data-tip="저장"
              @click.stop="commitFolderTitle(item.id)"
            >
              <i-lucide-save class="text-sm" />
            </button>
            <button
              v-else
              type="button"
              class="btn btn-ghost btn-xs tooltip tooltip-bottom h-6 min-h-0 w-6 p-0 text-black-600 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              data-tip="편집"
              @click.stop="startFolderEdit(item)"
            >
              <i-lucide-pencil />
            </button>
            <button
              v-if="editingFolderId !== item.id"
              type="button"
              class="btn btn-ghost btn-xs tooltip tooltip-bottom h-6 min-h-0 w-6 p-0 text-rose-500 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              data-tip="삭제"
              @click.stop="emits('onRemoveFolder', item.id)"
            >
              <i-lucide-trash-2 />
            </button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import defaultFolderImage from '@/assets/dummy/images/case-1.png'

interface FolderItem {
  id: number
  title: string
  description: string
  path: string
  images: import('@/types').CaptureImage[]
}

const props = defineProps<{
  folderItems: FolderItem[]
  selectedFolderId: number | null
}>()

const emits = defineEmits<{
  onCreateFolder: []
  onRenameFolder: [{ id: number; title: string }]
  onRemoveFolder: [id: number]
  onSelectFolder: [id: number]
  onOpenCaptureModal: []
}>()

const editingFolderId = ref<number | null>(null)
const editingTitle = ref('')

const createFolder = (): void => {
  emits('onCreateFolder')
}

const startFolderEdit = (item: FolderItem): void => {
  editingFolderId.value = item.id
  editingTitle.value = item.title
}

const cancelFolderEdit = (): void => {
  editingFolderId.value = null
  editingTitle.value = ''
}

const commitFolderTitle = (folderId: number): void => {
  const title = editingTitle.value.trim()
  if (!title) {
    cancelFolderEdit()
    return
  }

  emits('onRenameFolder', { id: folderId, title })
  cancelFolderEdit()
}

const getFolderThumbnail = (item: FolderItem): string => {
  if (item.images.length === 0) {
    return defaultFolderImage
  }

  return item.images[0].dataUrl
}
</script>
