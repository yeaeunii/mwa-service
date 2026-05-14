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

export interface DummyDeliverableItem {
  id: string
  title: string
  date: string
}

export interface StructureItem {
  id: string
  kind: 'workspace' | 'document'
  title: string
  meta: string
  badge: string
  dotClass?: string
}

export interface StructureCategory {
  id: string
  title: string
  dotClass: string
  items: StructureItem[]
  children: StructureCategory[]
}

export interface StructureWorkspace {
  id: string
  name: string
  items: StructureItem[]
}

export const deliverableItems: DummyDeliverableItem[] = [
  {
    id: 'deliverable-user-manual-package',
    title: '사용자 매뉴얼 산출물 패키지',
    date: '2026년 04월 15일'
  },
  {
    id: 'deliverable-admin-manual-v1-2',
    title: '관리자 운영 매뉴얼 (v1.2)',
    date: '2026년 05월 12일'
  },
  {
    id: 'deliverable-review-checklist',
    title: '매뉴얼 검수 체크리스트',
    date: '2026년 05월 01일'
  }
]

export const manualCaseItems: {
  id: number
  title: string
  description: string
  images: string[]
}[] = [
  {
    id: 1,
    title: '산출물 목록 화면',
    description: '프로젝트별 매뉴얼 산출물을 확인하는 화면',
    images: [sampleImage]
  },
  {
    id: 2,
    title: '문서 구조 편집 화면',
    description: '워크스페이스 문서를 산출물 카테고리에 배치하는 화면',
    images: [sampleImage]
  }
]

// Backward-compatible alias for existing imports in the app.
export const menualCaseItems = manualCaseItems

export const projectCards: DummyProjectCard[] = [
  {
    id: 'manual-deliverable-build',
    title: '사용자 매뉴얼 산출물 구축',
    updatedAt: '2026.03.19',
    progress: 66,
    description: '캡처 화면과 기능 설명을 정리해 사용자 매뉴얼 산출물을 구성하는 프로젝트',
    status: '진행중',
    filter: '진행중'
  },
  {
    id: 'operation-manual-review',
    title: '운영 매뉴얼 검수',
    updatedAt: '2026.03.14',
    progress: 100,
    description: '작성 완료된 운영 매뉴얼의 목차, 화면 캡처, 설명 누락 여부를 검토하는 프로젝트',
    status: '완료',
    filter: '완료'
  }
]

export const editorDummyFolders: DummyEditorFolder[] = [
  {
    id: 1,
    title: '산출물 목록',
    path: '산출물 관리 > 산출물 목록',
    description: '프로젝트 산출물 목록과 미리보기 진입 방법을 설명합니다.',
    screenshots: [
      {
        id: 'a-shot-1',
        image: sampleImage,
        annotations: [
          { id: 'a-1', number: 1, x: 0.28, y: 0.66, description: '산출물 생성 버튼입니다.' },
          { id: 'a-2', number: 2, x: 0.73, y: 0.62, description: '미리보기 진입 버튼입니다.' }
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
    title: '문서 구조 편집',
    path: '산출물 관리 > 구조 편집',
    description: '워크스페이스 문서를 산출물 카테고리 트리에 배치하는 절차를 설명합니다.',
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

const createStructureItem = (id: string, title: string): StructureItem => ({
  id,
  kind: 'document',
  title,
  meta: '매뉴얼 산출물 문서',
  badge: ''
})

export const deliverableStructureCategories: StructureCategory[] = [
  {
    id: 'deliverable-planning',
    title: '01. 로그인 화면',
    dotClass: 'bg-primary',
    items: [createStructureItem('deliverable-doc-1', '로그인 화면')],
    children: [
      {
        id: 'deliverable-planning-resource',
        title: '01-1. 회원가입 화면',
        dotClass: 'bg-primary/20',
        items: [
          createStructureItem('deliverable-doc-2', '회원가입 정보 입력 화면'),
          createStructureItem('deliverable-doc-3', '약관 동의 화면')
        ],
        children: []
      },
      {
        id: 'deliverable-planning-risk',
        title: '01-2. 계정 찾기 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-4', '아이디 찾기 및 비밀번호 재설정 화면')],
        children: []
      }
    ]
  },
  {
    id: 'deliverable-requirements',
    title: '02. 메인 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-5', '메인 대시보드 화면')],
    children: [
      {
        id: 'deliverable-requirements-user',
        title: '02-1. 알림 확인 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-6', '최근 알림 및 공지 목록 화면')],
        children: []
      }
    ]
  },
  {
    id: 'deliverable-design',
    title: '03. 프로젝트 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-7', '프로젝트 목록 화면')],
    children: [
      {
        id: 'deliverable-design-flow',
        title: '03-1. 프로젝트 상세 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-8', '프로젝트 정보 및 진행 현황 화면')],
        children: []
      }
    ]
  },
  {
    id: 'deliverable-interface',
    title: '04. 워크스페이스 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-9', '워크스페이스 목록 화면')],
    children: []
  },
  {
    id: 'deliverable-database',
    title: '05. 문서 편집 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-10', '문서 기본 정보 작성 화면')],
    children: [
      {
        id: 'deliverable-database-erd',
        title: '05-1. 캡처 편집 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-11', '이미지 주석 번호 작성 화면')],
        children: []
      }
    ]
  },
  {
    id: 'deliverable-test',
    title: '06. 산출물 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-12', '산출물 목록 화면')],
    children: []
  },
  {
    id: 'deliverable-deploy',
    title: '07. 마이페이지 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-13', '내 정보 확인 화면')],
    children: [
      {
        id: 'deliverable-mypage-password',
        title: '07-1. 비밀번호 수정 화면',
        dotClass: 'bg-primary/20',
        items: [
          createStructureItem('deliverable-doc-16', '현재 비밀번호 확인 및 새 비밀번호 입력 화면')
        ],
        children: []
      },
      {
        id: 'deliverable-mypage-phone',
        title: '07-2. 휴대폰번호 수정 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-17', '휴대폰번호 변경 및 인증번호 입력 화면')],
        children: []
      }
    ]
  },
  {
    id: 'deliverable-operation',
    title: '08. 설정 화면',
    dotClass: 'bg-primary/20',
    items: [createStructureItem('deliverable-doc-14', '환경 설정 화면')],
    children: [
      {
        id: 'deliverable-operation-monitoring',
        title: '08-1. 알림 설정 화면',
        dotClass: 'bg-primary/20',
        items: [createStructureItem('deliverable-doc-15', '알림 수신 설정 화면')],
        children: []
      }
    ]
  }
]

export const deliverablePreviewCategories = deliverableStructureCategories

export const deliverableStructureWorkspaces: StructureWorkspace[] = [
  {
    id: 'system-transfer',
    name: '사용자 매뉴얼 원본 자료',
    items: [
      {
        id: 'workspace-all-system-transfer',
        kind: 'workspace',
        title: '사용자 매뉴얼 원본 자료 전체',
        meta: '워크스페이스 전체 문서 묶음',
        badge: '전체'
      },
      {
        id: 'workspace-doc-1',
        kind: 'document',
        title: '사용자 매뉴얼 초안',
        meta: '작성일: 2026.05.14 · 작성자: 매뉴얼팀',
        badge: 'v2.0'
      },
      {
        id: 'workspace-doc-2',
        kind: 'document',
        title: '화면 캡처 정리본',
        meta: '작성일: 2026.05.13 · 작성자: 매뉴얼팀',
        badge: 'v1.1'
      }
    ]
  },
  {
    id: 'user-research',
    name: '운영 매뉴얼 검수 자료',
    items: [
      {
        id: 'workspace-all-user-research',
        kind: 'workspace',
        title: '운영 매뉴얼 검수 자료 전체',
        meta: '워크스페이스 전체 문서 묶음',
        badge: '전체'
      },
      {
        id: 'workspace-doc-3',
        kind: 'document',
        title: '검수 의견 취합표',
        meta: '작성일: 2026.05.12 · 작성자: 검수자',
        badge: 'Draft'
      },
      {
        id: 'workspace-doc-4',
        kind: 'document',
        title: '최종 배포 체크리스트',
        meta: '작성일: 2026.05.11 · 작성자: 검수자',
        badge: 'v0.9'
      }
    ]
  }
]
