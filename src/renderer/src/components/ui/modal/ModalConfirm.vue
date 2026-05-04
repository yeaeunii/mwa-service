<script setup lang="ts">
import { ref } from 'vue'
const emits = defineEmits(['onConfirm'])

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const onOpen = (): void => {
  modalRef.value?.onOpen()
}

const onConfirm = (): void => {
  modalRef.value?.onClose()
  emits('onConfirm')
}

defineExpose({
  onOpen
})

const props = defineProps({
  okText: {
    type: String,
    default: '확인'
  },
  cancelText: {
    type: String,
    default: '취소'
  }
})
</script>

<template>
  <ModalBase ref="modalRef" :closeOnBackdrop="false">
    <div class="px-6 pt-7">
      <div class="text-center text-base font-semibold leading-7 text-slate-700">
        <slot name="message" />
      </div>
    </div>

    <template #footer="{ close }">
      <div class="flex w-full items-center justify-end gap-3 px-6">
        <button
          type="button"
          class="btn bg-transparent border-none shadow-none text-slate-500 font-medium hover:font-bold"
          @click="close"
        >
          {{ props.cancelText }}
        </button>
        <button
          type="button"
          class="btn bg-transparent border-none shadow-none text-primary font-medium hover:font-bold"
          @click="onConfirm"
        >
          {{ props.okText }}
        </button>
      </div>
    </template>
  </ModalBase>
</template>
