import sampleImage from '@/assets/dummy/images/case-1.png'
import sampleImage2 from '@/assets/dummy/images/image.png'
import sampleImage3 from '@/assets/dummy/images/image2.png'

export type DummyProjectStatus = '진행중' | '완료'

export interface DummyProjectCard {
  id: string
  title: string
  updatedAt: string
  progress: number
  description: string
  status: DummyProjectStatus
  filter: DummyProjectStatus
}

export interface DummyDashboardProject {
  title: string
  description: string
  progress: number
}

export interface DummyEditorAnnotation {
  id: string
  number: number
  x: number
  y: number
  description: string
}

export interface DummyEditorScreenshot {
  id: string
  image: string
  annotations: DummyEditorAnnotation[]
}

export interface DummyEditorFolder {
  id: number
  title: string
  path: string
  description: string
  screenshots: DummyEditorScreenshot[]
}

export const manualCaseItems: {
  id: number
  title: string
  description: string
  images: string[]
}[] = [
  {
    id: 1,
    title: '메인 화면',
    description: '메인 랜딩 화면',
    images: [sampleImage]
  },
  {
    id: 2,
    title: '로그인 화면',
    description: '사용자 로그인 화면',
    images: [sampleImage]
  }
]

// Backward-compatible alias for existing imports in the app.
export const menualCaseItems = manualCaseItems

export const projectCards: DummyProjectCard[] = [
  {
    id: 'shopping-ui-research',
    title: '쇼핑몰 UI 분석 리서치',
    updatedAt: '2026.03.19',
    progress: 66,
    description: '국내 주요 쇼핑몰의 메인 페이지 및 장바구니 UI 캡처 및 분석 프로젝트',
    status: '진행중',
    filter: '진행중'
  },
  {
    id: 'admin-flow-guide',
    title: '관리자 플로우 점검',
    updatedAt: '2026.03.14',
    progress: 100,
    description: '관리자 페이지 주요 작업 흐름을 수집하고 문서화한 프로젝트',
    status: '완료',
    filter: '완료'
  }
]

export const dashboardProjectMap: Record<string, DummyDashboardProject> = {
  'shopping-ui-research': {
    title: '쇼핑몰 UI 분석 리서치',
    description: '국내 주요 쇼핑몰의 메인 페이지 및 장바구니 UI 캡처 및 분석 프로젝트',
    progress: 66
  },
  'admin-flow-guide': {
    title: '관리자 플로우 점검',
    description: '관리자 페이지 주요 작업 흐름을 수집하고 문서화한 프로젝트',
    progress: 100
  }
}

export const editorDummyFolders: DummyEditorFolder[] = [
  {
    id: 1,
    title: '메인 홈',
    path: '메인 > 홈',
    description: '메인 홈 화면 설명',
    screenshots: [
      {
        id: 'a-shot-1',
        image: sampleImage,
        annotations: [
          { id: 'a-1', number: 1, x: 0.28, y: 0.66, description: '메인 CTA 영역입니다.' },
          { id: 'a-2', number: 2, x: 0.73, y: 0.62, description: '' }
        ]
      },
      {
        id: 'a-shot-2',
        image: sampleImage,
        annotations: [{ id: 'a-3', number: 1, x: 0.52, y: 0.44, description: '' }]
      },
      {
        id: 'a-shot-3',
        image: sampleImage2,
        annotations: []
      },
      {
        id: 'a-shot-4',
        image: sampleImage3,
        annotations: []
      }
    ]
  },
  {
    id: 2,
    title: '로그인 화면',
    path: '사용자 > 로그인',
    description: '로그인 화면 설명',
    screenshots: [
      {
        id: 'b-shot-1',
        image: sampleImage,
        annotations: [{ id: 'b-1', number: 1, x: 0.5, y: 0.48, description: '' }]
      },
      {
        id: 'b-shot-2',
        image: sampleImage,
        annotations: []
      },
      {
        id: 'b-shot-3',
        image: sampleImage2,
        annotations: []
      },
      {
        id: 'b-shot-4',
        image: sampleImage3,
        annotations: []
      }
    ]
  }
]
