<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['open', 'close'])

const isOpen = ref(false)

const props = defineProps({
  id: {
    type: String,
    default: () => `modal-${Date.now()}-${Math.random().toString(36).slice(2)}`
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: 'w-96' // Tailwind width class
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  closeOnEscape: {
    type: Boolean,
    default: true
  }
})

const onOpen = (): void => {
  isOpen.value = true
  emit('open')
}

const onClose = (): void => {
  isOpen.value = false
}

const onKeydown = (e: KeyboardEvent): void => {
  if (!isOpen.value) return

  if (e.key === 'Escape' && props.closeOnEscape) {
    onClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ onOpen, onClose, isOpen })

watch(isOpen, (newVal, oldVal) => {
  //닫힐때 이벤트 발생
  if (oldVal && !newVal) {
    emit('close')
  }
})
</script>

<template>
  <div>
    <input type="checkbox" :id="props.id" v-model="isOpen" class="modal-toggle" />
    <div class="modal" role="dialog">
      <div class="modal-box" :class="props.width">
        <!-- Header -->
        <div v-if="props.title || $slots.header" class="mb-4">
          <slot name="header">
            <h3 class="text-lg font-bold">{{ props.title }}</h3>
          </slot>
        </div>

        <!-- Content -->
        <div class="modal-content">
          <slot></slot>
        </div>

        <!-- Footer / Actions -->
        <div v-if="$slots.footer" class="modal-action">
          <slot name="footer" :close="onClose"></slot>
        </div>
      </div>
      <label v-if="props.closeOnBackdrop" class="modal-backdrop" :for="props.id">Close</label>
      <div v-else class="modal-backdrop"></div>
    </div>
  </div>
</template>

<style scoped></style>
