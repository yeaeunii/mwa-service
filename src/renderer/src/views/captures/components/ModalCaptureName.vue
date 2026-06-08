
<template>
  <ModalBase ref="modalRef" :title="modalTitle" width="w-80">
    <form ref="formRef" @submit.prevent="onClickConfirm">
      <input
        ref="inputNameRef"
        v-model.trim="inputName"
        type="text"
        class="input input-bordered w-full text-center mb-4 validator"
        placeholder="캡쳐 이미지명"
        required
      />
      <div class="text-center">
        <button type="submit" class="btn btn-sm btn-ghost mx-auto">
          <i-lucide-check /> {{ confirmText }}
        </button>
      </div>
    </form>
  </ModalBase>
</template>

<style scoped></style>


<script setup lang="ts">
const emits = defineEmits(['onConfirm'])

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const inputName = ref('')
const inputNameRef = ref<HTMLInputElement | null>(null)
const formRef = ref<HTMLFormElement | null>(null)
const modalTitle = ref('캡쳐 이미지명을 입력하세요')
const confirmText = ref('확인')

const onOpen = (
  options?: {
    initialName?: string
    title?: string
    confirmText?: string
  }
): void => {
  formRef.value?.reset()
  inputName.value = options?.initialName ?? ''
  modalTitle.value = options?.title ?? '캡쳐 이미지명을 입력하세요'
  confirmText.value = options?.confirmText ?? '확인'
  modalRef.value?.onOpen()
  nextTick(() => {
    inputNameRef.value?.focus()
    inputNameRef.value?.select()
  })
}

const onClickConfirm = (): void => {
  if (inputName.value === '') return
  modalRef.value?.onClose()
  emits('onConfirm', inputName.value)
}

defineExpose({ onOpen })
</script>