import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView
    },
    {
      path: '/',
      name: 'capture-index',
      component: CaptureIndex
    }
  ]
})

export default router
