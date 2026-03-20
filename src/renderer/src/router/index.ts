import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/main/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
import EditorView from '@/views/editor/EditorView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import SelectView from '@/views/select/SelectView.vue'

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
      path: '/editor',
      name: 'editor-index',
      component: EditorView
    }
  ]
})

export default router
