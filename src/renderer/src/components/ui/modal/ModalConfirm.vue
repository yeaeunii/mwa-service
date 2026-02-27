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
  <!-- Confirm 스타일 -->
  <ModalBase ref="modalRef" width="w-80">
    <p class="text-center py-4">{{ message }}</p>
    <template #footer="{ close }">
      <button class="btn btn-sm btn-secondary" @click="close">취소</button>
      <button class="btn btn-sm btn-primary" @click="onConfirm">확인</button>
    </template>
  </ModalBase>
</template>
