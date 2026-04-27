<template>
  <!-- Confirm 스타일 -->
  <ModalBase ref="modalRef" width="w-11/12 max-w-5xl" @close="onClose">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="min-w-0 flex items-center gap-2 text-lg font-bold">
        <span class="truncate">{{ modalTitle }}</span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="!props.readonly && currentZoomItem"
          class="btn btn-sm btn-error btn-outline gap-1.5"
          @click="openRemoveConfirm(currentZoomItem.id)"
        >
          <i-lucide-trash class="h-4 w-4" />
          삭제
        </button>
        <button
          class="btn btn-sm btn-circle tooltip tooltip-bottom"
          data-tip="닫기"
          @click="closeModal"
        >
          <i-lucide-x />
        </button>
      </div>
    </div>
    <div class="h-[60vh] max-h-150">
      <div class="w-full h-full rounded-md bg-base-300 overflow-y-auto p-3">
        <div v-if="currentZoomItem" class="h-full relative group">
          <button
            type="button"
            class="btn btn-sm btn-circle absolute right-3 top-3 z-30 border-primary shadow-md"
            :class="
              isSelected(currentZoomItem.id)
                ? 'btn-primary text-white'
                : 'bg-white text-primary hover:bg-primary/10'
            "
            @click="toggleSelectImage(currentZoomItem.id)"
          >
            <i-lucide-check class="h-4 w-4" />
          </button>
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
            :src="currentZoomItem.src"
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
                  selectedZoomImageId = null
                  selecteImageId = item.id
                }
              "
              @mouseleave="selecteImageId = null"
            >
              <button
                type="button"
                class="btn btn-xs btn-circle absolute right-2 top-2 z-20 border-primary shadow-md"
                :class="
                  isSelected(item.id)
                    ? 'btn-primary text-white'
                    : 'bg-white text-primary hover:bg-primary/10'
                "
                @click.stop="toggleSelectImage(item.id)"
              >
                <i-lucide-check class="h-3.5 w-3.5" />
              </button>
              <img :src="item.src" alt="Capture Image" class="w-full h-full object-cover" />
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
                    @click="openRemoveConfirm(item.id)"
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
            </div>
          </div>
        </div>
      </div>
    </div>
    <ModalConfirm ref="modalConfirmRef" ok-text="삭제" @on-confirm="confirmRemoveImage">
      <template #message>
        <div class="text-center">
          <h3 class="mb-2 text-lg font-bold">{{ removeImageItem?.name }}</h3>
          <p class="text-sm text-gray-500">캡쳐 이미지를 삭제하시겠습니까?</p>
        </div>
      </template>
    </ModalConfirm>
  </ModalBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const emits = defineEmits<{
  onRemoveImage: [id: number]
  onToggleSelectImage: [id: number]
}>()

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const props = withDefaults(
  defineProps<{
    captureImageItems: import('@/types').CaptureImage[]
    selectedImageIds?: number[]
    title?: string
    readonly?: boolean
  }>(),
  {
    selectedImageIds: () => [],
    readonly: false
  }
)

const selecteImageId = ref<number | null>(null)

const removeImageId = ref<number | null>(null)
const selectedZoomImageId = ref<number | null>(null)
const modalConfirmRef = ref<ComponentRef<'ModalConfirm'> | null>(null)

const currentZoomIndex = computed(() =>
  props.captureImageItems.findIndex((item) => item.id === selectedZoomImageId.value)
)

const currentZoomItem = computed(() => {
  const index = currentZoomIndex.value
  if (index < 0) return null
  return props.captureImageItems[index] ?? null
})

const removeImageItem = computed(
  () => props.captureImageItems.find((item) => item.id === removeImageId.value) ?? null
)

const modalTitle = computed(() => currentZoomItem.value?.name || props.title || '캡쳐 이미지')
const selectedImageIdSet = computed(() => new Set(props.selectedImageIds))

const onOpen = (zoomImageId?: number): void => {
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

const isSelected = (imageId: number): boolean => {
  return selectedImageIdSet.value.has(imageId)
}

const toggleSelectImage = (imageId: number): void => {
  emits('onToggleSelectImage', imageId)
}

const openRemoveConfirm = (imageId: number): void => {
  removeImageId.value = imageId
  modalConfirmRef.value?.onOpen()
}

const confirmRemoveImage = (): void => {
  if (removeImageId.value === null) return
  emits('onRemoveImage', removeImageId.value)
  if (selectedZoomImageId.value === removeImageId.value) {
    selectedZoomImageId.value = null
  }
  removeImageId.value = null
}

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

</script>
