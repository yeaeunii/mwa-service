import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/main/HomeView.vue'
import CaptureIndex from '@/views/captures/CaptureIndex.vue'
<<<<<<< HEAD
import EditorView from '@/views/editor/EditorView.vue'
import ImageEditorView from '@/views/editor/ImageEditorView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import WorkspaceView from '@/views/document/WorkspaceView.vue'
=======
import VideoCaptureIndex from '@/views/captures/VideoCaptureIndex.vue'
import WorkspaceDetail from '@/views/workspace/WorkspaceDetail.vue'
import ProjectIndex from '@/views/projects/ProjectIndex.vue'
import DeliverableStructure from '@/views/deliverables/DeliverableStructure.vue'
import DeliverablePreview from '@/views/deliverables/DeliverablePreview.vue'
import DocsIndex from '@/views/documents/DocsIndex.vue'
import DocsAnnotation from '@/views/documents/DocsAnnotation.vue'
>>>>>>> feature/deliverable-design

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
      path: '/projects/:id/deliverables/:deliverableId/structure',
      name: 'deliverable-structure',
      component: DeliverableStructure
    },
    {
      path: '/projects/:id/deliverables/:deliverableId/preview',
      name: 'deliverable-preview',
      component: DeliverablePreview
    },
    {
      path: '/capture/:workspaceId',
      name: 'capture-index',
      component: CaptureIndex
    },
    {
      path: '/capture/:workspaceId/video',
      name: 'video-capture-index',
      component: VideoCaptureIndex
    },
    {
<<<<<<< HEAD
      path: '/workspace',
      name: 'workspace-index',
      component: WorkspaceView
=======
      path: '/workspace/:id',
      name: 'workspace-detail',
      component: WorkspaceDetail
    },
    {
      path: '/workspace/:id/documents/:docId?',
      name: 'docs-index',
      component: DocsIndex
>>>>>>> feature/deliverable-design
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
