<script setup lang="ts">
import { ref } from 'vue'

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const message = ref('')
const onOpen = (inputMessage: string): void => {
  message.value = inputMessage
  modalRef.value?.onOpen()
}

defineExpose({ onOpen })
</script>

<template>
  <!-- Alert 스타일 -->
  <ModalBase ref="modalRef" title="알림" width="w-80">
    <p class="text-center py-4">{{ message }}</p>
    <template #footer="{ close }">
      <button class="btn btn-sm btn-ghost" @click="close">
        <IconGmi name="baseline-check" /> 확인
      </button>
    </template>
  </ModalBase>
</template>

<style scoped></style>
