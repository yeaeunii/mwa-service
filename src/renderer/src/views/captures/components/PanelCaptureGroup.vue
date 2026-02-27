<template>
  <div class="h-full w-100 p-4 bg-base-100 flex flex-col gap-4">
    <div class="flex gap-2 items-center">
      <div class="text-lg font-bold">캡쳐 그룹</div>
      <div class="badge badge-sm badge-error">+ {{ menualCaseItems.length }}</div>
    </div>
    <form ref="formRefNewGroup" @submit.prevent="onAddNewGroup">
      <div class="join w-full">
        <input
          type="text"
          class="input input-sm input-bordered w-full join-item"
          placeholder="캡쳐 그룹 이름"
          required
        />
        <button class="btn btn-sm btn-primary join-item tooltip tooltip-bottom" data-tip="추가">
          <i-lucide-plus />
        </button>
      </div>
    </form>
    <div class="bg-base-300 p-4 rounded-md grow overflow-y-auto">
      <div v-for="item of menualCaseItems" :key="item.id" class="card bg-base-100 mb-3">
        <div class="card-body p-2">
          <div class="flex gap-2 items-center">
            <div class="w-15 h-10 relative rounded-md overflow-hidden">
              <img
                src="@/assets/dummy/images/case-1.png"
                alt="image"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-0 right-0 flex items-center justify-center">
                <div class="badge badge-sm badge-error rounded-none rounded-bl-md">
                  {{ item.images.length }}
                </div>
              </div>
            </div>
            <div class="">{{ item.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { menualCaseItems } from '@/assets/dummy/data'
const formRefNewGroup = ref<HTMLFormElement | null>(null)

const onAddNewGroup = (): void => {
  console.log('onAddNewGroup')
}
</script>
