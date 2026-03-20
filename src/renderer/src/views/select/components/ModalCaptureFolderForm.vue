<template>
  <ModalBase
    ref="modalRef"
    width="w-full max-w-[18rem] rounded-2xl border border-slate-600 bg-slate-900 p-0 text-white shadow-2xl"
    :closeOnBackdrop="false"
  >
    <template #header>
      <div class="flex items-start justify-between gap-3 border-b border-slate-700 px-5 pb-4 pt-5">
        <h3 class="text-xl font-extrabold text-white">
          {{ editingFolderId ? '폴더 수정' : '폴더 생성' }}
        </h3>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle border-0 bg-transparent text-slate-400 shadow-none hover:bg-slate-800 hover:text-white"
          @click="modalRef?.onClose()"
        >
          <i-lucide-x />
        </button>
      </div>
    </template>

    <div class="space-y-4 px-5 py-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-slate-300">폴더명</span>
        <input
          v-model="folderForm.title"
          type="text"
          class="input input-bordered h-11 w-full rounded-xl border-slate-600 bg-slate-800 text-white shadow-none placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          placeholder="새 폴더"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-slate-300">화면 경로</span>
        <input
          v-model="folderForm.path"
          type="text"
          class="input input-bordered h-11 w-full rounded-xl border-slate-600 bg-slate-800 text-white shadow-none placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          placeholder="메인>로그인"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-slate-300">화면 설명</span>
        <textarea
          v-model="folderForm.description"
          rows="5"
          class="textarea textarea-bordered w-full rounded-xl border-slate-600 bg-slate-800 text-white shadow-none placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
          placeholder="화면 설명을 입력하세요"
        ></textarea>
      </label>
    </div>

    <template #footer>
      <div class="w-full border-t border-slate-700 px-5 py-4">
        <button
          type="button"
          class="btn w-full border-0 bg-blue-900 text-white shadow-none hover:bg-blue-900"
          :disabled="folderForm.title.trim().length === 0"
          @click="onSave"
        >
          {{ editingFolderId ? '변경사항 저장' : '저장' }}
        </button>
      </div>
    </template>
  </ModalBase>
</template>

<script setup lang="ts">
const emits = defineEmits<{
  onSave: [{ id: number | null; title: string; path: string; description: string }]
}>()

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const editingFolderId = ref<number | null>(null)
const folderForm = ref({
  title: '',
  path: '',
  description: ''
})

const resetFolderForm = (): void => {
  editingFolderId.value = null
  folderForm.value = {
    title: '',
    path: '',
    description: ''
  }
}

const onOpenCreate = (nextIndex: number): void => {
  resetFolderForm()
  folderForm.value.title = `새 폴더 ${nextIndex}`
  modalRef.value?.onOpen()
}

const onOpenEdit = (payload: {
  id: number
  title: string
  path: string
  description: string
}): void => {
  editingFolderId.value = payload.id
  folderForm.value = {
    title: payload.title,
    path: payload.path,
    description: payload.description
  }
  modalRef.value?.onOpen()
}

const onSave = (): void => {
  const title = folderForm.value.title.trim()
  if (!title) return

  emits('onSave', {
    id: editingFolderId.value,
    title,
    path: folderForm.value.path.trim(),
    description: folderForm.value.description.trim()
  })

  modalRef.value?.onClose()
  resetFolderForm()
}

defineExpose({
  onOpenCreate,
  onOpenEdit
})
</script>
