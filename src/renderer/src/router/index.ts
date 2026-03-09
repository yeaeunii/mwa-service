import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/main/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
import EditorIndex from '@/views/editor/EditorIndex.vue'

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
      path: '/editor',
      name: 'editor-index',
      component: EditorIndex
    }
  ]
})

export default router
