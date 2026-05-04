import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/main/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
// import DashboardIndex from '@/views/dashboard/DashboardIndex.vue'
import WorkspaceDetail from '@/views/workspace/WorkspaceDetail.vue'
import ProjectIndex from '@/views/projects/ProjectIndex.vue'
import DocsIndex from '@/views/documents/DocsIndex.vue'
import DocsAnnotation from '@/views/documents/DocsAnnotation.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/projects/:id',
      name: 'projects-index',
      component: ProjectIndex
    },
    {
      path: '/capture/:workspaceId',
      name: 'capture-index',
      component: CaptureIndex
    },
    // {
    //   path: '/dashboard',
    //   name: 'dashboard-index',
    //   component: DashboardIndex
    // },
    {
      path: '/workspace/:id',
      name: 'workspace-detail',
      component: WorkspaceDetail
    },
    {
      path: '/workspace/:id/documents/:docId?',
      name: 'docs-index',
      component: DocsIndex
    },
    {
      path: '/documents/:docId/annotation',
      name: 'docs-annotation',
      component: DocsAnnotation
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/errors/NotFound.vue')
    }
  ]
})

export default router
