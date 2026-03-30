import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/main/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
import EditorView from '@/views/editor/EditorView.vue'
import ImageEditorView from '@/views/editor/ImageEditorView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import SelectView from '@/views/document/SelectImageView.vue'
import WorkspaceView from '@/views/document/WorkspaceView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/capture',
      name: 'capture-index',
      component: CaptureIndex
    },
    {
      path: '/dashboard',
      name: 'dashboard-index',
      component: DashboardView
    },
    {
      path: '/select',
      name: 'select-index',
      component: SelectView
    },
    {
      path: '/workspace',
      name: 'workspace-index',
      component: WorkspaceView
    },
    {
      path: '/editor',
      name: 'editor-index',
      component: EditorView
    },
    {
      path: '/image-editor',
      name: 'image-editor-index',
      component: ImageEditorView
    }
  ]
})

export default router
