<template>
  <div
    v-if="mode === 'preview'"
    draggable="true"
    class="group relative cursor-move overflow-hidden rounded-[4px] border border-[#d9d6cf] bg-[#f7f5f1] text-left shadow-[0_10px_20px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(15,23,42,0.16)]"
    :class="[dragOver ? 'ring-2 ring-blue-400/60' : '', viewMode === 'spread' ? 'min-h-[760px]' : 'min-h-[470px]']"
    @dragstart="$emit('dragstart')"
    @dragover.prevent="$emit('dragover')"
    @drop.prevent="$emit('drop')"
    @dragend="$emit('dragend')"
  >
    <button
      type="button"
      class="absolute right-2 top-10 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-rose-300/40 bg-slate-900/85 text-rose-300 opacity-0 transition-opacity hover:bg-rose-950/70 group-hover:opacity-100"
      @click.stop="$emit('remove')"
    >
      <i-lucide-trash-2 class="text-xs" />
    </button>
    <button
      type="button"
      class="flex h-full w-full flex-col text-left"
      @click="$emit('open')"
    >
      <div class="border-b border-[#d7d1c9] bg-white px-2.5 py-2 text-[#22252d]">
        <div class="-mx-3 -mt-2 mb-2 flex items-center justify-between gap-2 bg-[#2c313d] px-3 py-2 text-[8px] font-semibold text-white">
          <span class="truncate text-white/85">클릭하면 편집 화면으로 이동</span>
          <span class="shrink-0 rounded-full bg-[#252b39] px-2.5 py-1 text-[9px] font-bold text-white">
            PAGE {{ pageLabel }}
          </span>
        </div>

        <div class="grid grid-cols-[46px_minmax(0,1fr)] border border-[#cfcac2] text-[7px]">
          <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-1 py-1.5 font-bold">시스템명</div>
          <div class="truncate px-1 py-1.5 font-semibold">
            {{ displayPageTitle }}
          </div>
          <div class="col-span-2 grid grid-cols-[46px_minmax(0,1fr)_46px_minmax(0,1fr)] border-t border-[#cfcac2]">
            <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-1 py-1.5 font-bold">작성일자</div>
            <div class="border-r border-[#cfcac2] px-1 py-1.5 font-semibold">{{ formatCardDate }}</div>
            <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-1 py-1.5 font-bold">작성자</div>
            <div class="px-1 py-1.5 font-semibold">
              {{ displayWriterName }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-1 flex-col bg-white px-2.5 pb-3 text-[#2a2e36]">
        <div class="pt-1.5">
          <div class="flex items-start gap-2">
            <div class="mt-0.5 h-4 w-1 rounded-full bg-[#6a63d9]"></div>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-2 text-[10px] font-black leading-4 text-[#1f2430]">
                {{ screenshotPageNumber }}. {{ displayPageTitle }}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1 text-[7px] font-semibold text-[#746fc8]">
                <span class="rounded bg-[#ece9ff] px-1.5 py-0.5">경로</span>
                <span class="truncate text-[#5f6674]">{{ displayMenuPath }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-2 flex flex-1 flex-col space-y-2">
          <div>
            <div class="mb-1 bg-[#ece9e4] px-1.5 py-1 text-[8px] font-bold text-[#3d4048]">
              화면 설명
            </div>
            <div class="px-1 text-[8px] leading-4 text-[#525762]" :class="viewMode === 'spread' ? 'line-clamp-3 min-h-[44px]' : 'line-clamp-2 min-h-[32px]'">
              {{ displayScreenDescription }}
            </div>
          </div>

          <div>
            <div class="mb-1 bg-[#ece9e4] px-1.5 py-1 text-[8px] font-bold text-[#3d4048]">
              화면 캡쳐
            </div>
            <div class="overflow-hidden rounded-[4px] border border-[#d6dde7] bg-[#eff4f8]">
              <img
                :src="screenshot.image"
                alt=""
                class="w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                :class="viewMode === 'spread' ? 'h-80' : 'h-32'"
              />
            </div>
          </div>

          <div>
            <div class="mb-1 bg-[#ece9e4] px-1.5 py-1 text-[8px] font-bold text-[#3d4048]">
              기능 설명
            </div>
            <div class="px-1 text-[8px] leading-4 text-[#525762]" :class="viewMode === 'spread' ? 'min-h-[72px]' : 'min-h-[48px]'">
              <template v-if="functionalityItems.length > 0">
                <div
                  v-for="item in functionalityItems.slice(0, viewMode === 'spread' ? 4 : 2)"
                  :key="`${screenshot.id}-${item.number}-${item.text}`"
                  class="mb-1 flex items-start gap-1.5"
                >
                  <div class="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold text-white">
                    {{ item.number }}
                  </div>
                  <div class="line-clamp-1 flex-1">{{ item.text }}</div>
                </div>
              </template>
              <template v-else>등록된 기능 설명이 없습니다.</template>
            </div>
          </div>
        </div>
      </div>
    </button>
  </div>

  <div
    v-else
    class="overflow-hidden rounded-[22px] border border-[#d9d6cf] bg-[#f7f5f1] text-left shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
  >
    <div class="border-b border-[#d7d1c9] bg-white px-6 py-5 text-[#22252d]">
      <div class="-mx-6 -mt-5 mb-5 flex items-center justify-between gap-3 bg-[#2c313d] px-6 py-3 text-[12px] font-semibold text-white">
        <span class="truncate text-white/85">작업 목록 카드 상세 화면</span>
        <span class="shrink-0 rounded-full bg-[#252b39] px-3 py-1.5 text-[11px] font-bold text-white">
          PAGE {{ pageLabel }}
        </span>
      </div>

      <div class="grid grid-cols-[120px_minmax(0,1fr)] border border-[#cfcac2] text-[14px]">
        <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-4 py-3 text-center font-bold">시스템명</div>
        <div class="px-4 py-3">
          <input
            :value="editorPageTitle"
            type="text"
            class="w-full border-0 bg-transparent p-0 font-semibold outline-none"
            placeholder="페이지 제목을 입력하세요"
            @input="$emit('update:pageTitle', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="col-span-2 grid grid-cols-[120px_minmax(0,1fr)_120px_minmax(0,1fr)] border-t border-[#cfcac2]">
          <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-4 py-3 text-center font-bold">작성일자</div>
          <div class="border-r border-[#cfcac2] px-4 py-3 font-semibold">{{ formatCardDate }}</div>
          <div class="border-r border-[#cfcac2] bg-[#ece9e4] px-4 py-3 text-center font-bold">작성자</div>
          <div class="px-4 py-3">
            <input
              :value="editorWriterName"
              type="text"
              class="w-full border-0 bg-transparent p-0 font-semibold outline-none"
              placeholder="작성자를 입력하세요"
              @input="$emit('update:writerName', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white px-6 pb-6 text-[#2a2e36]">
      <div class="pt-2">
        <div class="flex items-start gap-2">
          <div class="mt-1 h-8 w-1.5 rounded-full bg-[#6a63d9]"></div>
          <div class="min-w-0 flex-1">
            <div class="line-clamp-2 text-[30px] font-black leading-[1.25] text-[#1f2430]">
              {{ pageLabel }}. {{ editorPageTitle || folderTitle }}
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3 text-[14px] font-semibold text-[#746fc8]">
              <span class="rounded bg-[#ece9ff] px-2.5 py-1">메뉴 경로</span>
              <input
                :value="editorPath"
                type="text"
                class="min-w-[320px] flex-1 border-0 bg-transparent px-0 py-0 font-semibold text-[#5f6674] outline-none"
                placeholder="메뉴 경로를 입력하세요"
                @input="$emit('update:path', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-5">
        <div>
          <div class="mb-2 bg-[#ece9e4] px-3 py-2 text-[18px] font-bold text-[#3d4048]">
            화면 설명
          </div>
          <textarea
            :value="editorDescription"
            rows="2"
            class="min-h-[64px] w-full resize-none border-0 bg-transparent px-2 text-[18px] leading-8 text-[#525762] outline-none"
            placeholder="화면 설명을 입력하세요"
            @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>

        <div>
          <div class="mb-2 bg-[#ece9e4] px-3 py-2 text-[18px] font-bold text-[#3d4048]">
            화면 캡쳐
          </div>
          <div class="relative overflow-hidden rounded-[16px] border border-[#d6dde7] bg-[#eff4f8]">
            <button
              type="button"
              class="absolute right-4 top-4 z-10 rounded-full bg-slate-900/85 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!screenshot.id"
              @click="$emit('editImage')"
            >
              화면 캡쳐 편집
            </button>
            <img
              :src="screenshot.image"
              alt=""
              class="max-h-[520px] w-full object-contain"
            />
          </div>
        </div>

        <div>
          <div class="mb-2 bg-[#ece9e4] px-3 py-2 text-[18px] font-bold text-[#3d4048]">
            기능 설명
          </div>
          <div
            class="space-y-2 rounded-lg border border-[#e4ddd2] bg-[#fbfaf7] px-3 py-3"
          >
            <template v-if="editorFunctionalityItems.length > 0">
              <div
                v-for="item in editorFunctionalityItems"
                :key="item.number"
                class="flex items-center gap-3"
              >
                <div class="flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-500 px-1 text-[12px] font-bold text-white">
                  {{ item.number }}
                </div>
                <input
                  :value="item.text"
                  type="text"
                  class="w-full border-0 bg-transparent px-0 text-[16px] leading-7 text-[#525762] outline-none"
                  placeholder="기능 설명을 입력하세요"
                  @input="$emit('update:functionalityItem', { number: item.number, text: ($event.target as HTMLInputElement).value })"
                />
              </div>
            </template>
            <template v-else>
              <div class="px-1 py-1 text-[16px] leading-7 text-[#8a90a0]">
                등록된 기능 설명이 없습니다.
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end border-t border-[#ddd7cd] pt-4">
        <button
          type="button"
          class="btn border-0 bg-blue-700 px-6 text-white shadow-none hover:bg-blue-700 disabled:bg-slate-400"
          :disabled="!hasPendingChanges"
          @click="$emit('save')"
        >
          <i-lucide-save class="text-sm" />
          저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspaceScreenshot } from '@/utils/manualWorkspace'

interface FunctionalityItem {
  number: number
  text: string
}

const props = withDefaults(
  defineProps<{
    mode: 'preview' | 'editor'
    screenshot: WorkspaceScreenshot
    index?: number
    folderTitle: string
    folderPath?: string
    folderDescription?: string
    formatCardDate: string
    cardAuthor?: string
    viewMode?: 'grid' | 'spread'
    dragOver?: boolean
    editorPageTitle?: string
    editorWriterName?: string
    editorPath?: string
    editorDescription?: string
    editorFunctionalityItems?: FunctionalityItem[]
    hasPendingChanges?: boolean
    pageLabel?: string
  }>(),
  {
    index: 0,
    folderPath: '',
    folderDescription: '',
    cardAuthor: '담당자',
    viewMode: 'grid',
    dragOver: false,
    editorPageTitle: '',
    editorWriterName: '',
    editorPath: '',
    editorDescription: '',
    editorFunctionalityItems: () => [],
    hasPendingChanges: false,
    pageLabel: '01'
  }
)

defineEmits<{
  open: []
  remove: []
  dragstart: []
  dragover: []
  drop: []
  dragend: []
  save: []
  editImage: []
  'update:pageTitle': [value: string]
  'update:writerName': [value: string]
  'update:path': [value: string]
  'update:description': [value: string]
  'update:functionalityItem': [{ number: number; text: string }]
}>()

const functionalityItems = computed(() =>
  (props.screenshot.functionalityDescription ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const matched = line.match(/^(\d+)\.\s*(.*)$/)
      return {
        number: Number(matched?.[1] ?? index + 1),
        text: matched?.[2]?.trim() || line
      }
    })
)

const displayPageTitle = computed(() => props.screenshot.pageTitle || props.folderTitle)
const displayWriterName = computed(() => props.screenshot.writerName || props.cardAuthor)
const screenshotPageNumber = computed(() => props.screenshot.pageNo ?? props.index + 1)
const displayMenuPath = computed(() => props.screenshot.menuPath || props.folderPath || '-')
const displayScreenDescription = computed(
  () => props.screenshot.screenDescription || props.folderDescription || '화면 설명이 아직 작성되지 않았습니다.'
)
</script>
