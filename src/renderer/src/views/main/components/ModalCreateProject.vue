<script setup lang="ts">
const emits = defineEmits<{
  onSubmit: [{ id?: string; name: string; description: string }]
}>()

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const editingProjectId = ref<string | null>(null)
const projectName = ref('')
const projectDescription = ref('')


const onOpen = (): void => {
  editingProjectId.value = null
  projectName.value = ''
  projectDescription.value = ''
  modalRef.value?.onOpen()
}

const onOpenEdit = (payload: { id: string; name: string; description?: string }): void => {
  editingProjectId.value = payload.id
  projectName.value = payload.name
  projectDescription.value = payload.description ?? ''
  modalRef.value?.onOpen()
}


const onClose = (): void => {
  modalRef.value?.onClose()
}

const onSubmit = (): void => {
  emits('onSubmit', {
    id: editingProjectId.value ?? undefined,
    name: projectName.value.trim(),
    description: projectDescription.value.trim()
  })
  onClose()
}

defineExpose({
  onOpen,
  onOpenEdit,
  onClose
})
</script>

<template>
  <ModalBase
    ref="modalRef"
    width="w-full max-w-[28rem] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl"
    :closeOnBackdrop="false"
  >
    <template #header>
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 pt-6 pb-5">
        <div class="space-y-1.5">
          <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">
            {{ editingProjectId ? '프로젝트 수정' : '새 프로젝트 생성' }}
          </h2>
          <p class="text-sm font-medium text-slate-500">
            {{
              editingProjectId
                ? '프로젝트 이름과 설명을 수정하세요.'
                : '매뉴얼 제작을 위한 새로운 프로젝트를 시작하세요.'
            }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle border-0 bg-transparent text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
          @click="onClose"
        >
          <i-lucide-x class="text-lg" />
        </button>
      </div>
    </template>

    
    <div class="space-y-6 px-6 py-6">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-bold text-slate-700">프로젝트 이름 *</span>
        <input
          v-model="projectName"
          type="text"
          class="input input-bordered h-12 w-full rounded-xl border-slate-200 bg-slate-50 text-slate-800 shadow-none outline-none focus:border-blue-400 focus:outline-none"
          placeholder="예: 시스템 매뉴얼"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="text-sm font-bold text-slate-700">프로젝트 설명 (선택 사항)</span>
        <textarea
          v-model="projectDescription"
          rows="5"
          class="textarea textarea-bordered w-full rounded-xl border-slate-200 bg-slate-50 text-slate-800 shadow-none outline-none focus:border-blue-400 focus:outline-none"
          placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
        ></textarea>
      </label>
    </div>

    <template #footer="{ close }">
      
      <div class="flex w-full items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          class="btn btn-ghost min-w-20 border-0 bg-transparent px-5 text-slate-500 shadow-none hover:bg-slate-100"
          @click="close"
        >
          취소
        </button>
        <button
          type="button"
          class="btn btn-primary min-w-32 rounded-xl border-0 px-5 shadow-none disabled:bg-slate-200 disabled:text-slate-400"
          :disabled="projectName.trim().length === 0"
          @click="onSubmit"
        >
          {{ editingProjectId ? '변경사항 저장' : '프로젝트 생성' }}
        </button>
      </div>
    </template>
  </ModalBase>
</template>
