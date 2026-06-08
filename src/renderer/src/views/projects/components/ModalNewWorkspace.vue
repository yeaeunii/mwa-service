<script setup lang="ts">
export interface WorkspacePayload {
  id?: number
  name: string
  thumbnail: string | null
}

const emits = defineEmits<{
  onSubmit: [WorkspacePayload]
}>()

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const editingId = ref<number | null>(null)
const wsName = ref('')
const wsThumbnail = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const onOpen = (): void => {
  editingId.value = null
  wsName.value = ''
  wsThumbnail.value = null
  modalRef.value?.onOpen()
}

const onOpenEdit = (payload: { id: number; name: string; thumbnail?: string | null }): void => {
  editingId.value = payload.id
  wsName.value = payload.name
  wsThumbnail.value = payload.thumbnail ?? null
  modalRef.value?.onOpen()
}

const onClose = (): void => {
  modalRef.value?.onClose()
}

const onSubmit = (): void => {
  emits('onSubmit', {
    id: editingId.value ?? undefined,
    name: wsName.value.trim(),
    thumbnail: wsThumbnail.value
  })
  onClose()
}

const onClickThumbnail = (): void => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event): void => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    wsThumbnail.value = reader.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const onRemoveThumbnail = (): void => {
  wsThumbnail.value = null
}

defineExpose({ onOpen, onOpenEdit, onClose })
</script>

<template>
  <ModalBase
    ref="modalRef"
    width="w-full max-w-[26rem] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl"
    :closeOnBackdrop="false"
  >
    <template #header>
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 pt-6 pb-5">
        <div class="space-y-1.5">
          <h2 class="text-xl font-extrabold tracking-tight text-slate-900">
            {{ editingId != null ? '워크스페이스 수정' : '새 워크스페이스' }}
          </h2>
          <p class="text-sm font-medium text-slate-500">
            {{
              editingId != null
                ? '워크스페이스 정보를 수정하세요.'
                : '새로운 워크스페이스를 생성하세요.'
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

    <div class="space-y-5 px-6 py-6">
      <!-- Thumbnail -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-bold text-slate-700">썸네일 (선택 사항)</span>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />
        <div v-if="wsThumbnail" class="group relative overflow-hidden rounded-xl">
          <img
            :src="wsThumbnail"
            alt="thumbnail preview"
            class="h-36 w-full rounded-xl object-cover"
          />
          <div
            class="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-colors group-hover:bg-black/40"
          >
            <button
              type="button"
              class="btn btn-sm border-none bg-white/90 text-slate-700 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              @click="onClickThumbnail"
            >
              <i-lucide-image-plus class="h-4 w-4" />
              변경
            </button>
            <button
              type="button"
              class="btn btn-sm border-none bg-white/90 text-error shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              @click="onRemoveThumbnail"
            >
              <i-lucide-trash-2 class="h-4 w-4" />
              삭제
            </button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary/40 hover:bg-primary/5"
          @click="onClickThumbnail"
        >
          <i-lucide-image-plus class="h-7 w-7 text-slate-300" />
          <span class="text-xs font-medium text-slate-400">클릭하여 이미지를 선택하세요</span>
        </button>
      </div>

      <!-- Name -->
      <label class="flex flex-col gap-2">
        <span class="text-sm font-bold text-slate-700">워크스페이스 이름 *</span>
        <input
          v-model="wsName"
          type="text"
          class="input input-bordered h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-slate-800 shadow-none outline-none focus:border-blue-400 focus:outline-none"
          placeholder="ex) AI 솔루션 화면"
        />
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
          class="btn btn-primary min-w-28 rounded-xl border-0 px-5 shadow-none disabled:bg-slate-200 disabled:text-slate-400"
          :disabled="wsName.trim().length === 0"
          @click="onSubmit"
        >
          {{ editingId != null ? '변경사항 저장' : '생성' }}
        </button>
      </div>
    </template>
  </ModalBase>
</template>
