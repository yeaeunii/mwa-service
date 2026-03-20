<template>
  <div class="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
    <div class="flex items-center gap-3 border-b border-white/10 bg-slate-900 p-2">
      <div class="flex grow items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          @click="goHome"
        >
          <i-lucide-house class="text-lg" />
        </button>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>워크스페이스</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-white">{{ currentFolder.title }}</span>
          <i-lucide-chevron-right class="text-xs" />
          <span class="text-blue-300">{{ stepLabel }}</span>
        </div>
      </div>

      <button
        v-if="editorStep !== 'select'"
        type="button"
        class="btn border-0 bg-green-700 text-white shadow-none hover:bg-green-700"
      >
        <i-lucide-eye class="text-sm" />
        미리보기
      </button>
    </div>

    <div v-if="editorStep === 'select'" class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="text-sm font-semibold text-slate-300">폴더 목록</div>
          <button
            type="button"
            class="btn btn-xs border-0 bg-white text-blue-900 shadow-none hover:bg-sky-100"
            @click="openFolderCreateModal"
          >
            <i-lucide-plus class="text-sm" />
          </button>
        </div>
        <div class="flex-1 space-y-2 overflow-y-auto">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
            :class="
              folder.id === selectedFolderId
                ? 'border-blue-400/60 bg-slate-800'
                : 'border-white/10 bg-slate-900 hover:border-white/20'
            "
          >
            <button type="button" class="min-w-0 flex-1 text-left" @click="selectFolder(folder.id)">
              <div class="flex items-center gap-2">
                <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
                <div class="badge border-0 bg-blue-900/60 text-blue-100">
                  {{ getSelectedCount(folder.id) }}
                </div>
              </div>
              <div class="text-xs text-slate-400">
                {{ folder.screenshots.length }}개 중 {{ getSelectedCount(folder.id) }}개 선택
              </div>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs h-6 min-h-0 w-6 p-0 text-slate-300 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              @click.stop="openFolderEditModal(folder)"
            >
              <i-lucide-pencil class="text-xs" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs h-6 min-h-0 w-6 p-0 text-rose-400 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              @click.stop="removeFolder(folder.id)"
            >
              <i-lucide-trash-2 class="text-xs" />
            </button>
          </div>
        </div>

        <div class="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
            @click="goCapture"
          >
            <i-lucide-folder-plus class="text-sm" />
            캡처 화면으로
          </button>
        </div>
      </aside>
      <button
        type="button"
        class="absolute left-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
        :class="isLeftSidebarOpen ? 'translate-x-72' : 'translate-x-0'"
        @click="isLeftSidebarOpen = !isLeftSidebarOpen"
      >
        <i-lucide-chevron-left v-if="isLeftSidebarOpen" class="text-sm" />
        <i-lucide-chevron-right v-else class="text-sm" />
      </button>

      <main class="relative min-w-0 flex-1 overflow-y-auto p-6 pb-28">
        <div class="mb-5">
          <div class="text-xl font-bold text-white">1단계. 매뉴얼에 쓸 캡쳐 선택</div>
          <div class="mt-1 text-sm text-slate-400">
            필요한 화면을 선택한 뒤, 하단의 편집 시작 버튼으로 다음 단계로 이동합니다.
          </div>
        </div>

        <div
          v-if="currentFolder.screenshots.length === 0"
          class="rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          이 폴더에는 캡쳐된 화면이 없습니다.
        </div>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] justify-start gap-4"
        >
          <button
            v-for="screenshot in currentFolder.screenshots"
            :key="screenshot.id"
            type="button"
            class="group overflow-hidden rounded-2xl border-2 text-left transition-colors"
            :class="
              isScreenshotSelected(currentFolder.id, screenshot.id)
                ? 'border-blue-400 bg-slate-900'
                : 'border-white/10 bg-slate-900 hover:border-white/30'
            "
            @click="toggleScreenshotSelection(currentFolder.id, screenshot.id)"
          >
            <div class="relative h-40 w-full overflow-hidden bg-slate-950">
              <button
                type="button"
                class="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
                @click.stop="openSelectPreviewModal(screenshot.id)"
              >
                <i-lucide-expand class="text-xs" />
              </button>
              <img
                :src="screenshot.image"
                alt=""
                class="h-full w-full object-cover"
              />
              <div
                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                :class="
                  isScreenshotSelected(currentFolder.id, screenshot.id)
                    ? 'border-blue-300 bg-blue-500 text-white'
                    : 'border-white/40 bg-slate-900/80 text-slate-200'
                "
              >
                <i-lucide-check class="text-xs" />
              </div>
            </div>
            <div class="flex items-center justify-between px-3 py-2">
            </div>
          </button>
        </div>

        <div class="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-6">
          <div class="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-white">{{ selectedManualCount }}개의 화면 선택됨</div>
              <div class="text-xs text-slate-400">필요한 화면만 선택한 뒤 편집 시작을 눌러주세요.</div>
            </div>
            <button
              type="button"
              class="btn btn-sm border-0 bg-slate-700 text-white shadow-none hover:bg-slate-600"
              :disabled="selectedManualCount === 0"
              @click="clearSelectedScreenshots"
            >
              전체 선택 해제
            </button>
            <button
              type="button"
              class="btn h-11 border-0 bg-blue-700 px-6 text-base font-bold text-white shadow-none hover:bg-blue-700 disabled:bg-slate-700"
              :disabled="selectedManualCount === 0"
              @click="goWorkspace"
            >
              매뉴얼 편집 시작
              <i-lucide-arrow-right class="text-base" />
            </button>
          </div>
        </div>
      </main>
    </div>

    <div v-else class="relative flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="flex shrink-0 flex-col border-r border-white/10 bg-slate-900 p-4 transition-all duration-200"
        :class="isLeftSidebarOpen ? 'w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'"
      >
        <div class="mb-3 text-lg font-bold text-white">화면 폴더링</div>
        <div class="flex-1 space-y-2 overflow-y-auto">
          <button
            v-for="folder in selectedFolders"
            :key="folder.id"
            type="button"
            class="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors"
            :class="
              folder.id === selectedFolderId
                ? 'border-blue-400/60 bg-slate-800'
                : 'border-white/10 bg-slate-900 hover:border-white/20'
            "
            @click="selectFolder(folder.id)"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-white">{{ folder.title }}</div>
              <div class="text-xs text-slate-400">{{ folder.screenshots.length }}개 선택됨</div>
            </div>
            <div class="badge border-0 bg-rose-500 text-white">{{ folder.screenshots.length }}</div>
          </button>
        </div>

        <div class="mt-auto border-t border-white/10 pt-4">
          <div v-if="editorStep === 'workspace'" class="space-y-2">
            <button
              type="button"
              class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
              @click="goCapture"
            >
              <i-lucide-folder-plus class="text-sm" />
              캡처 화면으로
            </button>
            <button
              type="button"
              class="btn w-full border border-dashed border-white/20 bg-transparent text-slate-300 shadow-none hover:bg-slate-800"
              @click="goSelectStep"
            >
              <i-lucide-arrow-left class="text-sm" />
              선택 화면으로
            </button>
          </div>
          <button
            v-else
            type="button"
            class="btn w-full border-0 bg-slate-700 text-white shadow-none hover:bg-slate-600"
            @click="goWorkspace"
          >
            <i-lucide-layout-grid class="text-sm" />
            목록으로
          </button>
        </div>
      </aside>
      <button
        type="button"
        class="absolute left-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
        :class="isLeftSidebarOpen ? 'translate-x-72' : 'translate-x-0'"
        @click="isLeftSidebarOpen = !isLeftSidebarOpen"
      >
        <i-lucide-chevron-left v-if="isLeftSidebarOpen" class="text-sm" />
        <i-lucide-chevron-right v-else class="text-sm" />
      </button>

      <main v-if="editorStep === 'workspace'" class="min-w-0 flex-1 overflow-y-auto p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <div class="text-xl font-bold text-white">2단계. 선택된 캡쳐 작업 목록</div>
            <div class="mt-1 text-sm text-slate-400">
              편집할 화면을 클릭하면 바로 편집 화면으로 이동합니다.
            </div>
          </div>
          <div class="rounded-xl border border-blue-400/30 bg-blue-900/20 px-3 py-2 text-sm text-blue-200">
            총 {{ selectedManualCount }}개 선택됨
          </div>
        </div>

        <div
          v-if="currentFolder.screenshots.length === 0"
          class="rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center text-slate-400"
        >
          선택된 캡쳐가 없습니다.
        </div>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] justify-start gap-4"
        >
          <button
            v-for="(screenshot, index) in currentFolder.screenshots"
            :key="screenshot.id"
            type="button"
            draggable="true"
            class="group cursor-move overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-left transition-colors hover:border-blue-400/50"
            :class="workspaceDragOverIndex === index ? 'ring-2 ring-blue-400/60' : ''"
            @click="openEditorWithScreenshot(screenshot.id)"
            @dragstart="onWorkspaceDragStart(index)"
            @dragover.prevent="onWorkspaceDragOver(index)"
            @drop.prevent="onWorkspaceDrop(index)"
            @dragend="onWorkspaceDragEnd"
          >
            <div class="relative h-44 overflow-hidden bg-slate-950">
              <div class="absolute left-2 top-2 z-10 flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-700 px-2 text-sm font-bold text-white">
                {{ index + 1 }}
              </div>
              <img
                :src="screenshot.image"
                alt=""
                class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div class="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                편집
              </div>
            </div>
            <div class="space-y-1 px-3 py-2">

            </div>
          </button>
        </div>
      </main>

      <main v-else class="relative min-w-0 flex flex-1 overflow-hidden bg-slate-950">
        <section class="min-w-0 flex flex-1 flex-col overflow-hidden">
          <div v-if="isThumbnailOpen" class="shrink-0 border-b border-white/10 bg-slate-900/80 px-3 py-2">
            <div class="mb-2 flex items-start justify-between">
              <div class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                3단계. 캡쳐 편집
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
                @click="isThumbnailOpen = false"
              >
                <i-lucide-chevron-up class="text-sm" />
              </button>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                v-for="screenshot in currentFolder.screenshots"
                :key="screenshot.id"
                type="button"
                class="shrink-0 overflow-hidden rounded-xl border transition-colors"
                :class="
                  screenshot.id === selectedScreenshotId
                    ? 'border-blue-500/80'
                    : 'border-white/20 hover:border-white/40'
                "
                @click="selectScreenshot(screenshot.id)"
              >
                <img :src="screenshot.image" alt="" class="h-14 w-24 object-cover" />
              </button>
            </div>
          </div>

          <div class="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
            <button
              v-if="!isThumbnailOpen"
              type="button"
              class="tooltip tooltip-left absolute right-4 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-200 shadow-md hover:bg-slate-700"
              data-tip="캡쳐 썸네일"
              @click="isThumbnailOpen = true"
            >
              <i-lucide-chevron-down class="text-sm" />
            </button>

            <div class="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-6">
              <div class="pointer-events-auto flex flex-col items-center gap-3">
                <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2">
                  <button
                    type="button"
                    class="btn btn-sm border-0 shadow-none"
                    :class="activeTool === 'number' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'"
                    @click="activeTool = 'number'"
                  >
                    Number
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm border-0 shadow-none"
                    :class="activeTool === 'box' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'"
                    @click="activeTool = 'box'"
                  >
                    Box
                  </button>
                </div>
              </div>
            </div>

            <div
              ref="canvasRef"
              class="absolute inset-0 overflow-hidden bg-slate-950"
              @click="handleCanvasClick"
              @wheel="handleCanvasWheel"
            >
              <div
                class="relative h-full w-full"
                :style="{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center'
                }"
              >
                <img :src="currentScreenshot.image" alt="" class="h-full w-full object-contain" />

                <button
                  v-for="annotation in currentAnnotations"
                  :key="annotation.id"
                  type="button"
                  class="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-xs font-bold text-white shadow-lg"
                  :class="focusedAnnotationId === annotation.id ? 'ring-4 ring-blue-400/40' : ''"
                  :style="{
                    left: `${annotation.x * 100}%`,
                    top: `${annotation.y * 100}%`
                  }"
                  @click.stop="focusAnnotation(annotation.id)"
                  @contextmenu.prevent.stop="removeMarker(annotation.id)"
                >
                  {{ annotation.number }}
                </button>
              </div>
            </div>

            <div class="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-6">
              <div class="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 shadow-lg">
                <button
                  type="button"
                  class="btn btn-sm min-h-0 h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
                  @click="zoomOut"
                >
                  <i-lucide-minus class="text-sm" />
                </button>
                <button
                  type="button"
                  class="btn btn-sm min-h-0 h-9 border-0 bg-slate-800 px-3 text-sm text-slate-100 shadow-none hover:bg-slate-700"
                  @click="resetZoom"
                >
                  {{ zoomPercent }}%
                </button>
                <button
                  type="button"
                  class="btn btn-sm min-h-0 h-9 w-9 border-0 bg-slate-800 px-0 text-slate-200 shadow-none hover:bg-slate-700"
                  @click="zoomIn"
                >
                  <i-lucide-plus class="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside
          class="flex h-full shrink-0 flex-col border-l border-white/10 bg-slate-900/75 backdrop-blur-sm transition-all duration-200"
          :class="
            isDescriptionOpen
              ? 'w-[22rem] opacity-100'
              : 'w-0 overflow-hidden border-l-0 opacity-0'
          "
        >
            <div class="border-b border-white/10 px-5 py-4">
                <div class="mb-3 flex justify-start gap-1">
                  <div class="rounded-sm bg-[#41506d] p-0.5">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-100 transition hover:bg-[#52627e]"
                      @click="undoMarker"
                    >
                      <i-lucide-undo-2 class="text-base" />
                    </button>
                  </div>
                  <div class="rounded-sm bg-[#41506d] p-0.5">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-100 transition hover:bg-[#52627e]"
                      @click="redoMarker"
                    >
                      <i-lucide-redo-2 class="text-base" />
                    </button>
                  </div>
              </div>

              <div class="flex items-center gap-2 text-base font-bold text-white">
                <i-lucide-notebook-tabs class="text-sm text-blue-400" />
                기능 설명 리스트
              </div>
            </div>

            <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              <div class="rounded-xl border border-white/10 bg-slate-800/80 p-3">
                <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  화면 경로
                </div>
                <input
                  v-model="currentFolder.path"
                  type="text"
                  class="input input-sm w-full border border-white/10 bg-slate-900/80 text-white shadow-none"
                  placeholder="메인 > 홈"
                />

                <div class="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  화면 설명
                </div>
                <textarea
                  v-model="currentFolder.description"
                  rows="3"
                  class="textarea textarea-sm w-full border border-white/10 bg-slate-900/80 text-white shadow-none"
                  placeholder="화면 설명을 입력하세요..."
                ></textarea>
              </div>

              <div
                v-for="annotation in currentAnnotations"
                :key="annotation.id"
                :ref="setDescriptionItemRef(annotation.id)"
                class="rounded-xl border bg-slate-800/80 p-3 transition-colors"
                :class="annotation.description.trim() ? 'border-white/10' : 'border-red-300/50'"
              >
                <div class="mb-2.5 flex items-center gap-2">
                  <div class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
                    {{ annotation.number }}
                  </div>
                  <div class="text-xs font-semibold text-white">STEP {{ annotation.number }}</div>
                  <button
                    type="button"
                    class="btn btn-xs btn-ghost ml-auto text-rose-300 shadow-none hover:bg-transparent"
                    @click="removeMarker(annotation.id)"
                  >
                    <i-lucide-trash-2 class="text-xs" />
                  </button>
                </div>

                <input
                  :ref="setInputRef(annotation.id)"
                  :value="annotation.description"
                  type="text"
                  class="input input-sm w-full border bg-slate-900/80 text-white shadow-none"
                  :class="annotation.description.trim() ? 'border-white/10' : 'border-red-300/50'"
                  placeholder="기능 설명을 입력하세요..."
                  @input="updateDescription(annotation.id, ($event.target as HTMLInputElement).value)"
                  @focus="focusAnnotation(annotation.id)"
                />
              </div>
            </div>

            <div class="border-t border-white/10 p-4">
              <button
                type="button"
                class="btn w-full border-0 bg-blue-900 text-white shadow-none hover:bg-blue-900"
              >
                <i-lucide-save class="text-sm" />
                설명 저장하기
              </button>
            </div>
        </aside>
        <button
          type="button"
          class="absolute right-0 top-1/2 z-20 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-slate-900 text-slate-200 shadow-lg hover:bg-slate-800"
          :class="isDescriptionOpen ? '-translate-x-[22rem]' : 'translate-x-0'"
          @click="isDescriptionOpen = !isDescriptionOpen"
        >
          <i-lucide-chevron-right v-if="isDescriptionOpen" class="text-sm" />
          <i-lucide-chevron-left v-else class="text-sm" />
        </button>
      </main>
    </div>

    <ModalCaptureFolderForm ref="folderModalRef" @onSave="saveFolderFromModal" />
    <ModalCaptureImages
      ref="selectPreviewModalRef"
      :captureImageItems="currentFolderCaptureImages"
      :title="currentFolder.title"
      :selectedImageIds="currentFolderSelectedIds"
      readonly
      @onToggleSelect="toggleSelectionFromPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { editorDummyFolders, type DummyEditorAnnotation, type DummyEditorFolder, type DummyEditorScreenshot } from '@/assets/dummy/data'

type ToolMode = 'number' | 'box'
type EditorStep = 'select' | 'workspace' | 'edit'

type EditorAnnotation = DummyEditorAnnotation
type EditorScreenshot = DummyEditorScreenshot
type EditorFolder = DummyEditorFolder

type SelectedForManual = Record<number, string[]>

const STORAGE_KEY = 'miso-editor-selected-screenshots'

const router = useRouter()
const route = useRoute()

const createFullSelection = (folders: EditorFolder[]): SelectedForManual =>
  folders.reduce<SelectedForManual>((acc, folder) => {
    acc[folder.id] = folder.screenshots.map((shot) => shot.id)
    return acc
  }, {})

const loadSelectedForManual = (folders: EditorFolder[]): SelectedForManual | null => {
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SelectedForManual

    return folders.reduce<SelectedForManual>((acc, folder) => {
      const validIds = new Set(folder.screenshots.map((shot) => shot.id))
      acc[folder.id] = (parsed[folder.id] ?? []).filter((id) => validIds.has(id))
      return acc
    }, {})
  } catch {
    return null
  }
}

const folders = ref<EditorFolder[]>(
  editorDummyFolders.map((folder) => ({ ...folder, screenshots: [...folder.screenshots] }))
)

const selectedForManual = ref<SelectedForManual>({})
const selectedFolderId = ref(1)
const selectedScreenshotId = ref('a-shot-1')
const editorStep = ref<EditorStep>('select')
const isLeftSidebarOpen = ref(true)
const isDescriptionOpen = ref(true)
const isThumbnailOpen = ref(true)
const workspaceDragFromIndex = ref<number | null>(null)
const workspaceDragOverIndex = ref<number | null>(null)

const activeTool = ref<ToolMode>('number')
const zoomScale = ref(1)
const focusedAnnotationId = ref<string | null>(null)
const removedStack = ref<EditorAnnotation[]>([])

const canvasRef = ref<HTMLDivElement | null>(null)
const descriptionItemRefs = ref<Record<string, HTMLElement | null>>({})
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})
const folderModalRef = ref<ComponentRef<'ModalCaptureFolderForm'> | null>(null)
const selectPreviewModalRef = ref<ComponentRef<'ModalCaptureImages'> | null>(null)

const fallbackScreenshot: EditorScreenshot = {
  id: 'empty-shot',
  image: editorDummyFolders[0]?.screenshots[0]?.image ?? '',
  annotations: []
}

const fallbackFolder: EditorFolder = {
  id: -1,
  title: '선택된 폴더 없음',
  path: '',
  description: '',
  screenshots: [fallbackScreenshot]
}

const selectedFolders = computed(() =>
  folders.value
    .map((folder) => ({
      ...folder,
      screenshots: folder.screenshots.filter((shot) =>
        selectedForManual.value[folder.id]?.includes(shot.id)
      )
    }))
    .filter((folder) => folder.screenshots.length > 0)
)

const workingFolders = computed(() =>
  editorStep.value === 'select' ? folders.value : selectedFolders.value
)

const currentFolder = computed(
  () =>
    workingFolders.value.find((folder) => folder.id === selectedFolderId.value) ??
    workingFolders.value[0] ??
    fallbackFolder
)

const currentScreenshot = computed(
  () =>
    currentFolder.value.screenshots.find((shot) => shot.id === selectedScreenshotId.value) ??
    currentFolder.value.screenshots[0] ??
    fallbackScreenshot
)
const currentFolderCaptureImages = computed(() =>
  currentFolder.value.screenshots.map((screenshot) => ({
    id: screenshot.id,
    dataUrl: screenshot.image
  }))
)
const currentFolderSelectedIds = computed(() => selectedForManual.value[currentFolder.value.id] ?? [])

const currentAnnotations = computed(() => currentScreenshot.value.annotations)
const zoomPercent = computed(() => Math.round(zoomScale.value * 100))
const selectedManualCount = computed(() =>
  Object.values(selectedForManual.value).reduce((sum, ids) => sum + ids.length, 0)
)
const stepLabel = computed(() => {
  if (editorStep.value === 'select') return '캡쳐 선택'
  if (editorStep.value === 'workspace') return '선택 목록'
  return '편집'
})

const initializeSelection = (): void => {
  selectedForManual.value = folders.value.reduce<Record<number, string[]>>((acc, folder) => {
    acc[folder.id] = []
    return acc
  }, {})
}

const initializeSelectionWithAllScreenshots = (): void => {
  selectedForManual.value = folders.value.reduce<Record<number, string[]>>((acc, folder) => {
    acc[folder.id] = folder.screenshots.map((shot) => shot.id)
    return acc
  }, {})
}

initializeSelection()

const isScreenshotSelected = (folderId: number, screenshotId: string): boolean =>
  selectedForManual.value[folderId]?.includes(screenshotId) ?? false

const getSelectedCount = (folderId: number): number =>
  selectedForManual.value[folderId]?.length ?? 0

const toggleScreenshotSelection = (folderId: number, screenshotId: string): void => {
  const current = selectedForManual.value[folderId] ?? []
  selectedForManual.value = {
    ...selectedForManual.value,
    [folderId]: current.includes(screenshotId)
      ? current.filter((id) => id !== screenshotId)
      : [...current, screenshotId]
  }
}

const clearSelectedScreenshots = (): void => {
  initializeSelection()
}

const openSelectPreviewModal = (imageId: string): void => {
  selectPreviewModalRef.value?.onOpen(imageId)
}

const toggleSelectionFromPreview = (screenshotId: string): void => {
  toggleScreenshotSelection(currentFolder.value.id, screenshotId)
}

const openFolderCreateModal = (): void => {
  folderModalRef.value?.onOpenCreate(folders.value.length + 1)
}

const openFolderEditModal = (folder: EditorFolder): void => {
  folderModalRef.value?.onOpenEdit({
    id: folder.id,
    title: folder.title,
    path: folder.path,
    description: folder.description
  })
}

const removeFolder = (folderId: number): void => {
  folders.value = folders.value.filter((folder) => folder.id !== folderId)

  const nextSelected = { ...selectedForManual.value }
  delete nextSelected[folderId]
  selectedForManual.value = nextSelected

  if (selectedFolderId.value === folderId) {
    selectedFolderId.value = folders.value[0]?.id ?? -1
  }
}

const saveFolderFromModal = (payload: {
  id: number | null
  title: string
  path: string
  description: string
}): void => {
  if (payload.id === null) {
    const id = Date.now()
    folders.value = [
      ...folders.value,
      {
        id,
        title: payload.title,
        path: payload.path,
        description: payload.description,
        screenshots: []
      }
    ]
    selectedForManual.value = {
      ...selectedForManual.value,
      [id]: []
    }
    selectedFolderId.value = id
    return
  }

  folders.value = folders.value.map((folder) =>
    folder.id === payload.id
      ? {
          ...folder,
          title: payload.title,
          path: payload.path,
          description: payload.description
        }
      : folder
  )
}

const ensureCurrentSelection = (): void => {
  const folder = workingFolders.value.find((item) => item.id === selectedFolderId.value) ?? workingFolders.value[0]
  if (!folder) return
  selectedFolderId.value = folder.id

  const shotExists = folder.screenshots.some((shot) => shot.id === selectedScreenshotId.value)
  if (!shotExists) {
    selectedScreenshotId.value = folder.screenshots[0]?.id ?? fallbackScreenshot.id
  }
}

const goWorkspace = (): void => {
  if (selectedFolders.value.length === 0) return
  editorStep.value = 'workspace'
  ensureCurrentSelection()
  focusedAnnotationId.value = null
  zoomScale.value = 1
}

const goSelectStep = (): void => {
  editorStep.value = 'select'
  focusedAnnotationId.value = null
}

const openEditorWithScreenshot = (screenshotId: string): void => {
  selectedScreenshotId.value = screenshotId
  editorStep.value = 'edit'
  focusedAnnotationId.value = null
  zoomScale.value = 1
}

const applyInitialStep = (): void => {
  const routeStep = String(route.query.step ?? 'select')
  const savedSelection = loadSelectedForManual(folders.value)

  if (routeStep === 'edit') {
    selectedForManual.value = savedSelection ?? createFullSelection(folders.value)
    ensureCurrentSelection()
    selectedScreenshotId.value = currentFolder.value.screenshots[0]?.id ?? fallbackScreenshot.id
    editorStep.value = 'edit'
    focusedAnnotationId.value = null
    zoomScale.value = 1
    return
  }

  if (routeStep === 'workspace') {
    selectedForManual.value = savedSelection ?? createFullSelection(folders.value)
    ensureCurrentSelection()
    editorStep.value = 'workspace'
    focusedAnnotationId.value = null
    zoomScale.value = 1
    return
  }

  initializeSelection()
  ensureCurrentSelection()
  editorStep.value = 'select'
  focusedAnnotationId.value = null
  zoomScale.value = 1
}

applyInitialStep()

const onWorkspaceDragStart = (index: number): void => {
  workspaceDragFromIndex.value = index
  workspaceDragOverIndex.value = index
}

const onWorkspaceDragOver = (index: number): void => {
  workspaceDragOverIndex.value = index
}

const onWorkspaceDragEnd = (): void => {
  workspaceDragFromIndex.value = null
  workspaceDragOverIndex.value = null
}

const onWorkspaceDrop = (dropIndex: number): void => {
  const fromIndex = workspaceDragFromIndex.value
  if (fromIndex === null) return
  if (fromIndex === dropIndex) {
    onWorkspaceDragEnd()
    return
  }

  const sourceId = currentFolder.value.screenshots[fromIndex]?.id
  const targetId = currentFolder.value.screenshots[dropIndex]?.id
  if (!sourceId || !targetId) {
    onWorkspaceDragEnd()
    return
  }

  patchCurrentFolder((folder) => {
    const screenshots = [...folder.screenshots]
    const sourceIndex = screenshots.findIndex((shot) => shot.id === sourceId)
    const targetIndex = screenshots.findIndex((shot) => shot.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return folder

    const [moved] = screenshots.splice(sourceIndex, 1)
    screenshots.splice(targetIndex, 0, moved)

    return {
      ...folder,
      screenshots
    }
  })

  onWorkspaceDragEnd()
}

const selectFolder = (id: number): void => {
  selectedFolderId.value = id
  ensureCurrentSelection()
  focusedAnnotationId.value = null
}

const selectScreenshot = (id: string): void => {
  selectedScreenshotId.value = id
  zoomScale.value = 1
  focusedAnnotationId.value = null
}

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' })
}

const goCapture = async (): Promise<void> => {
  await router.push({ name: 'capture-index' })
}

const clampZoom = (value: number): number => Math.min(Math.max(value, 0.5), 2.5)

const zoomIn = (): void => {
  zoomScale.value = clampZoom(Number((zoomScale.value + 0.1).toFixed(2)))
}

const zoomOut = (): void => {
  zoomScale.value = clampZoom(Number((zoomScale.value - 0.1).toFixed(2)))
}

const resetZoom = (): void => {
  zoomScale.value = 1
}

const reindexAnnotations = (items: EditorAnnotation[]): EditorAnnotation[] =>
  items.map((item, index) => ({ ...item, number: index + 1 }))

const patchCurrentFolder = (updater: (folder: EditorFolder) => EditorFolder): void => {
  folders.value = folders.value.map((folder) =>
    folder.id === currentFolder.value.id ? updater(folder) : folder
  )
}

const patchCurrentScreenshot = (updater: (screenshot: EditorScreenshot) => EditorScreenshot): void => {
  patchCurrentFolder((folder) => ({
    ...folder,
    screenshots: folder.screenshots.map((shot) =>
      shot.id === currentScreenshot.value.id ? updater(shot) : shot
    )
  }))
}

const handleCanvasClick = (event: MouseEvent): void => {
  if (editorStep.value !== 'edit') return
  if (activeTool.value !== 'number') return
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const rawX = (event.clientX - rect.left) / rect.width
  const rawY = (event.clientY - rect.top) / rect.height
  const x = Math.min(Math.max((rawX - 0.5) / zoomScale.value + 0.5, 0.02), 0.98)
  const y = Math.min(Math.max(rawY / zoomScale.value, 0.02), 0.98)

  const annotation: EditorAnnotation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    number: currentAnnotations.value.length + 1,
    x,
    y,
    description: ''
  }

  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: [...screenshot.annotations, annotation]
  }))

  removedStack.value = []
  void focusAnnotation(annotation.id)
}

const handleCanvasWheel = (event: WheelEvent): void => {
  if (!event.ctrlKey) return
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
    return
  }
  zoomOut()
}

const removeMarker = (annotationId: string): void => {
  const removed = currentAnnotations.value.find((item) => item.id === annotationId)
  if (!removed) return

  removedStack.value = [...removedStack.value, removed]

  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: reindexAnnotations(screenshot.annotations.filter((item) => item.id !== annotationId))
  }))

  if (focusedAnnotationId.value === annotationId) {
    focusedAnnotationId.value = null
  }
}

const undoMarker = (): void => {
  if (currentAnnotations.value.length === 0) return
  removeMarker(currentAnnotations.value[currentAnnotations.value.length - 1].id)
}

const redoMarker = (): void => {
  const restored = removedStack.value[removedStack.value.length - 1]
  if (!restored) return
  removedStack.value = removedStack.value.slice(0, -1)

  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: reindexAnnotations([...screenshot.annotations, restored])
  }))
}

const updateDescription = (annotationId: string, description: string): void => {
  patchCurrentScreenshot((screenshot) => ({
    ...screenshot,
    annotations: screenshot.annotations.map((item) =>
      item.id === annotationId ? { ...item, description } : item
    )
  }))
}

const focusAnnotation = async (annotationId: string): Promise<void> => {
  focusedAnnotationId.value = annotationId
  await nextTick()
  descriptionItemRefs.value[annotationId]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
  inputRefs.value[annotationId]?.focus()
}

const setDescriptionItemRef =
  (annotationId: string) =>
  (element: Element | ComponentPublicInstance | null): void => {
    descriptionItemRefs.value[annotationId] = element as HTMLElement | null
  }

const setInputRef =
  (annotationId: string) =>
  (element: Element | ComponentPublicInstance | null): void => {
    inputRefs.value[annotationId] = element as HTMLInputElement | null
  }
</script>
