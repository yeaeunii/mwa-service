<template>
  <!-- Confirm 스타일 -->
  <ModalBase ref="modalRef" width="w-11/12 max-w-5xl" @close="onClose">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-lg font-bold">
        <span>{{ props.title }}</span>
        <div v-if="!props.readonly" class="badge badge-error">{{ props.captureImageItems.length }}</div>
      </div>
      <button
        class="btn btn-sm btn-circle tooltip tooltip-bottom"
        data-tip="닫기"
        @click="closeModal"
      >
        <i-lucide-x />
      </button>
    </div>
    <div class="h-[60vh] max-h-150">
      <div class="w-full h-full rounded-md bg-base-300 overflow-y-auto p-3">
        <div v-if="currentZoomItem" class="h-full relative group">
          <div
            v-if="currentZoomIndex >= 0"
            class="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-slate-700/90 px-3 py-1 text-xs font-semibold text-white"
          >
            {{ currentZoomIndex + 1 }} / {{ props.captureImageItems.length }}
          </div>
          <button
            v-if="props.captureImageItems.length > 1"
            class="btn btn-sm btn-circle absolute left-3 top-1/2 z-20 -translate-y-1/2"
            @click="showPrevImage"
          >
            <i-lucide-chevron-left />
          </button>
          <button
            v-if="props.captureImageItems.length > 1"
            class="btn btn-sm btn-circle absolute right-3 top-1/2 z-20 -translate-y-1/2"
            @click="showNextImage"
          >
            <i-lucide-chevron-right />
          </button>

          <button
            v-if="props.readonly"
            class="btn btn-sm absolute right-3 top-3 z-20 border-0 shadow-none"
            :class="isCurrentSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'"
            @click="toggleCurrentSelection"
          >
            <i-lucide-check class="text-sm" />
            {{ isCurrentSelected ? '선택됨' : '선택' }}
          </button>

          <div
            v-if="!props.readonly"
            class="absolute top-0 left-0 h-full w-full flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-300"
          >
            <button
              class="btn btn-sm btn-circle tooltip tooltip-bottom"
              data-tip="닫기"
              @click="selectedZoomImageId = null"
            >
              <i-lucide-x />
            </button>
          </div>
          <img
            :src="currentZoomItem.dataUrl"
            alt="Capture Image"
            class="mx-auto max-h-full max-w-full rounded-md object-contain"
          />
        </div>
        <div v-else class="h-full">
          <div
            v-if="props.captureImageItems.length === 0"
            class="h-full flex items-center justify-center text-center text-gray-500"
          >
            캡처된 이미지가 없습니다.
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <div
              v-for="item of props.captureImageItems"
              :key="item.id"
              class="border border-gray-300 rounded-md overflow-hidden h-70 relative"
              @mouseenter="
                () => {
                  removeImageId = null
                  selectedZoomImage = null
                  selecteImageId = item.id
                }
              "
              @mouseleave="selecteImageId = null"
            >
              <img :src="item.dataUrl" alt="Capture Image" class="w-full h-full object-cover" />
              <div
                class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300"
                :class="{
                  'opacity-100': selecteImageId === item.id && removeImageId === null
                }"
              >
                <div class="flex gap-2">
                  <button
                    v-if="!props.readonly"
                    class="btn btn-sm btn-circle tooltip tooltip-bottom"
                    data-tip="삭제"
                    @click="removeImageId = item.id"
                  >
                    <i-lucide-trash />
                  </button>
                  <button
                    class="btn btn-sm btn-circle tooltip tooltip-bottom"
                    data-tip="확대"
                    @click="selectedZoomImageId = item.id"
                  >
                    <i-lucide-expand />
                  </button>
                </div>
              </div>
              <div
                v-if="!props.readonly && removeImageId === item.id"
                class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50"
              >
                <div>
                  <div class="text-white font-bold mb-3">캡쳐된 이미지를 삭제하시겠습니까?</div>
                  <div class="flex gap-4 justify-center">
                    <button
                      class="btn btn-sm btn-primary"
                      @click="
                        () => {
                          emits('onRemoveImage', item.id)
                          removeImageId = null
                        }
                      "
                    >
                      예
                    </button>
                    <button class="btn btn-sm btn-secondary" @click="removeImageId = null">
                      아니오
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const emits = defineEmits<{
  onRemoveImage: [id: string]
  onToggleSelect: [id: string]
}>()

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const props = withDefaults(
  defineProps<{
    captureImageItems: import('@/types').CaptureImage[]
    title?: string
    readonly?: boolean
    selectedImageIds?: string[]
  }>(),
  {
    readonly: false,
    selectedImageIds: () => []
  }
)

const selecteImageId = ref<string | null>(null)

const removeImageId = ref<string | null>(null)
const selectedZoomImageId = ref<string | null>(null)

const currentZoomIndex = computed(() =>
  props.captureImageItems.findIndex((item) => item.id === selectedZoomImageId.value)
)

const currentZoomItem = computed(() => {
  const index = currentZoomIndex.value
  if (index < 0) return null
  return props.captureImageItems[index] ?? null
})

const isCurrentSelected = computed(() => {
  const id = currentZoomItem.value?.id
  if (!id) return false
  return props.selectedImageIds.includes(id)
})

const onOpen = (zoomImageId?: string): void => {
  selectedZoomImageId.value = zoomImageId ?? null
  modalRef.value?.onOpen()
}

  const onClose = (): void => {
    selecteImageId.value = null
    removeImageId.value = null
    selectedZoomImageId.value = null
  }

  const closeModal = (): void => {
    modalRef.value?.onClose()
  }

  defineExpose({
    onOpen
  })

const showPrevImage = (): void => {
  if (props.captureImageItems.length < 2 || currentZoomIndex.value < 0) return
  const prevIndex =
    (currentZoomIndex.value - 1 + props.captureImageItems.length) % props.captureImageItems.length
  selectedZoomImageId.value = props.captureImageItems[prevIndex].id
}

const showNextImage = (): void => {
  if (props.captureImageItems.length < 2 || currentZoomIndex.value < 0) return
  const nextIndex = (currentZoomIndex.value + 1) % props.captureImageItems.length
  selectedZoomImageId.value = props.captureImageItems[nextIndex].id
}

const toggleCurrentSelection = (): void => {
  const id = currentZoomItem.value?.id
  if (!id) return
  emits('onToggleSelect', id)
}
</script>
