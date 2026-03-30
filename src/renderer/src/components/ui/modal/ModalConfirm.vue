<script setup lang="ts">
import { ref } from 'vue'
const emits = defineEmits(['onConfirm'])

const message = ref<string>('')
const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const onOpen = (inputMessage: string): void => {
  message.value = inputMessage
  modalRef.value?.onOpen()
}

const onConfirm = (): void => {
  modalRef.value?.onClose()
  emits('onConfirm')
}

defineExpose({
  onOpen
})
</script>

<template>
  <ModalBase
    ref="modalRef"
    width="w-full max-w-sm rounded-3xl bg-white p-0 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
    :closeOnBackdrop="false"
  >
    <div class="px-6 pt-7 pb-2">
      <p class="text-center text-base font-semibold leading-7 text-slate-700">{{ message }}</p>
    </div>

    <template #footer="{ close }">
      <div class="flex w-full items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          class="btn min-w-20 border-0 bg-slate-100 px-5 text-slate-600 shadow-none hover:bg-slate-200"
          @click="close"
        >
          취소
        </button>
        <button
          type="button"
          class="btn min-w-20 border-0 bg-[#5f59c6] px-5 text-white shadow-none hover:bg-[#5550b7]"
          @click="onConfirm"
        >
          확인
        </button>
      </div>
    </template>
  </ModalBase>
</template>
