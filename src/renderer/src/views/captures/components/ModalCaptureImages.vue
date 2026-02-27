<template>
  <!-- Confirm 스타일 -->
  <ModalBase ref="modalRef" width="w-11/12 max-w-5xl" @close="onClose">
    <div class="text-lg font-bold mb-4">
      공지사항 메뉴얼
      <div class="badge badge-error">{{ props.captureImageItems.length }}</div>
    </div>
    <div class="h-[60vh] max-h-150">
      <div class="w-full h-full rounded-md bg-base-300 overflow-y-auto p-3">
        <div v-if="selectedZoomImage" class="h-full relative group">
          <div
            class="absolute top-0 left-0 h-full w-full flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-300"
          >
            <button
              class="btn btn-sm btn-circle tooltip tooltip-bottom"
              data-tip="닫기"
              @click="selectedZoomImage = null"
            >
              <i-lucide-x />
            </button>
          </div>
          <img :src="selectedZoomImage" alt="Capture Image" class="h-full rounded-md mx-auto" />
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
                    class="btn btn-sm btn-circle tooltip tooltip-bottom"
                    data-tip="삭제"
                    @click="removeImageId = item.id"
                  >
                    <i-lucide-trash />
                  </button>
                  <button
                    class="btn btn-sm btn-circle tooltip tooltip-bottom"
                    data-tip="확대"
                    @click="selectedZoomImage = item.dataUrl"
                  >
                    <i-lucide-expand />
                  </button>
                </div>
              </div>
              <div
                v-if="removeImageId === item.id"
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
import { ref } from 'vue'
const emits = defineEmits(['onRemoveImage'])

const modalRef = ref<ComponentRef<'ModalBase'> | null>(null)
const props = defineProps<{
  captureImageItems: import('@/types').CaptureImage[]
}>()

const selecteImageId = ref<string | null>(null)

const removeImageId = ref<string | null>(null)
const selectedZoomImage = ref<string | null>(null)

const onOpen = (): void => {
  modalRef.value?.onOpen()
}

const onClose = (): void => {
  selecteImageId.value = null
  removeImageId.value = null
  selectedZoomImage.value = null
}

defineExpose({
  onOpen
})
</script>
