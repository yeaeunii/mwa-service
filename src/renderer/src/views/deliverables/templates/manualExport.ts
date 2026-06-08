import {
  getDeliverableDetail,
  getDeliverableStructure,
  getProjects,
  type DeliverableSection,
  type DeliverableSectionDoc
} from '@/database'
import type { ManualModel, ManualOutlineRow } from './manualTemplate'
import type { SectionDocInput, SectionTreeInput } from '@database/dto'

// 템플릿 모델을 만들기 위해 DB 데이터를 정리한 내부 타입
interface FnItem {
  number: number
  description: string
}

interface ExportDoc extends SectionDocInput {
  description: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  orgn_img_path: string
  draw_img_path: string
  updated_at: string
}

interface ExportSection extends Omit<SectionTreeInput, 'docs' | 'children'> {
  docs: ExportDoc[]
  children: ExportSection[]
}

interface ExportEntry {
  item: ExportDoc
  phase: string
}

export interface ManualImageFile {
  path: string
  content: string
  encoding: 'base64'
}

export interface ManualExportData {
  fileName: string
  model: ManualModel
  images: ManualImageFile[]
}

// 날짜 표시 형식 변환
const formatDate = (value: string): string => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 로컬 이미지 경로를 renderer에서 접근 가능한 appimg URL로 변환
const toFileSrc = (imgPath: string, version?: string): string => {
  const normalizedPath = imgPath.replace(/\\/g, '/')
  const cacheKey = version ? `?v=${encodeURIComponent(version)}` : ''
  return `appimg:///${normalizedPath}${cacheKey}`
}

// JSON 컬럼을 안전하게 객체로 변환
const parseJsonObject = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

// content_json의 기능 설명 목록을 번호순으로 변환
const parseContentItems = (value: string): FnItem[] => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        number: Number(item?.number ?? 0),
        description: String(item?.text ?? '')
      }))
      .filter((item) => item.number > 0)
      .sort((left, right) => left.number - right.number)
  } catch {
    return []
  }
}

// 번호 어노테이션에서 가장 많이 사용된 색상 조회
const getNumberColor = (value: string): string => {
  try {
    const parsed = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return '#f87171'

    const colorCounts = new Map<string, number>()
    parsed.forEach((item) => {
      if (item?.toolType !== 'number' || typeof item?.color !== 'string') return
      colorCounts.set(item.color, (colorCounts.get(item.color) ?? 0) + 1)
    })

    return [...colorCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '#f87171'
  } catch {
    return '#f87171'
  }
}

// DB 문서 row를 산출물 템플릿 문서 데이터로 변환
const mapDoc = (doc: DeliverableSectionDoc): ExportDoc => ({
  doc_id: String(doc.doc_id),
  kind: 'document',
  doc_title: doc.title,
  meta: `수정일: ${formatDate(doc.updated_at)}`,
  status: doc.status ?? '',
  description: doc.description ?? '',
  doc_meta_json: doc.doc_meta_json ?? '{}',
  content_json: doc.content_json ?? '[]',
  annotation_json: doc.annotation_json ?? '[]',
  orgn_img_path: doc.orgn_img_path ?? '',
  draw_img_path: doc.draw_img_path ?? '',
  updated_at: doc.updated_at ?? ''
})

// flat한 section/doc 목록을 하위 카테고리 트리로 구성
const buildSections = (
  sections: DeliverableSection[],
  sectionDocs: DeliverableSectionDoc[]
): ExportSection[] => {
  const categoriesById = new Map<number, ExportSection>()
  const childrenByParentId = new Map<number | null, DeliverableSection[]>()
  const docsBySectionId = new Map<number, DeliverableSectionDoc[]>()

  sections.forEach((section) => {
    const parentId = section.parent_id ?? null
    childrenByParentId.set(parentId, [...(childrenByParentId.get(parentId) ?? []), section])
    categoriesById.set(section.id, {
      id: String(section.id),
      name: section.name,
      docs: [],
      children: []
    })
  })

  sectionDocs.forEach((doc) => {
    docsBySectionId.set(doc.section_id, [...(docsBySectionId.get(doc.section_id) ?? []), doc])
  })

  const attach = (parentId: number | null): ExportSection[] =>
    (childrenByParentId.get(parentId) ?? []).map((section) => {
      const category = categoriesById.get(section.id)!
      category.docs = (docsBySectionId.get(section.id) ?? []).map(mapDoc)
      category.children = attach(section.id)
      return category
    })

  return attach(null)
}

// 카테고리 트리를 문서 페이지 순서대로 펼침
const collectEntries = (category: ExportSection, parentTitles: string[] = []): ExportEntry[] => {
  const phaseTitles = [...parentTitles, category.name]
  const phase = phaseTitles.join(' / ')

  return [
    ...category.docs.map((item) => ({ item, phase })),
    ...category.children.flatMap((child) => collectEntries(child, phaseTitles))
  ]
}

// 좌측 목차에 표시할 카테고리/문서 row 생성
const collectOutlineRows = (
  categoryList: ExportSection[],
  parentId: string | null = null,
  depth = 0
): ManualOutlineRow[] =>
  categoryList.flatMap((category) => [
    {
      id: `category-${category.id}`,
      kind: 'category',
      title: category.name,
      depth,
      parentId
    },
    ...category.docs.map<ManualOutlineRow>((item) => ({
      id: `item-${item.doc_id}`,
      kind: 'item',
      title: item.doc_title,
      pageId: getPageElementId(item.doc_id),
      depth: depth + 1,
      parentId: `category-${category.id}`
    })),
    ...collectOutlineRows(category.children, `category-${category.id}`, depth + 1)
  ])

const getPageElementId = (itemId: string): string => `manual-page-${itemId}`

// 문서 화면 이미지 URL 조회
const getDocImageSrc = (item: ExportDoc): string => {
  const imagePath = item.draw_img_path || item.orgn_img_path
  return imagePath ? toFileSrc(imagePath, item.updated_at) : ''
}

// 사용자가 입력한 화면 경로 조회
const getDocEntryPath = (item: ExportDoc): string => {
  const docMeta = parseJsonObject(item.doc_meta_json)
  return String(docMeta.entry_path ?? '')
}

// HTML ZIP 내부에 저장할 이미지 확장자 판단
const getImageExtension = (imageSrc: string, contentType: string): string => {
  if (contentType.includes('jpeg')) return 'jpg'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'

  const pathExt = imageSrc.split('?')[0]?.split('.').pop()?.toLowerCase()
  if (pathExt && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(pathExt)) {
    return pathExt === 'jpeg' ? 'jpg' : pathExt
  }

  return 'png'
}

// ZIP 저장을 위해 이미지 binary를 base64 문자열로 변환
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

// HTML ZIP용 이미지 파일 목록 생성
const createImageFiles = async (
  entries: ExportEntry[]
): Promise<{
  imageMap: Map<string, string>
  images: ManualImageFile[]
}> => {
  const imageMap = new Map<string, string>()
  const images: ManualImageFile[] = []

  await Promise.all(
    entries.map(async (entry, index) => {
      const imageSrc = getDocImageSrc(entry.item)
      if (!imageSrc) return

      try {
        const response = await fetch(imageSrc)
        const buffer = await response.arrayBuffer()
        const extension = getImageExtension(imageSrc, response.headers.get('content-type') ?? '')
        const imagePath = `assets/images/page-${index + 1}.${extension}`

        images.push({
          path: imagePath,
          content: arrayBufferToBase64(buffer),
          encoding: 'base64'
        })
        imageMap.set(entry.item.doc_id, imagePath)
      } catch (error) {
        console.error('Failed to export manual image:', error)
      }
    })
  )

  return { imageMap, images }
}

const getSafeName = (title: string): string =>
  title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'manual'

// 산출물 다운로드에 필요한 프로젝트/카테고리/문서/이미지 데이터를 한 번에 구성
export const buildManualExport = async (
  deliverableId: number,
  options: { includeImages?: boolean } = {}
): Promise<ManualExportData | null> => {
  const [deliverable, structure] = await Promise.all([
    getDeliverableDetail(deliverableId),
    getDeliverableStructure(deliverableId)
  ])

  if (!deliverable) return null

  const projects = deliverable.project_id
    ? await getProjects({ id: deliverable.project_id, limit: 1, offset: 0 })
    : []
  const sections = buildSections(structure.sections, structure.sectionDocs)
  const entries = sections.flatMap((section) => collectEntries(section))
  const { imageMap, images } = options.includeImages
    ? await createImageFiles(entries)
    : { imageMap: new Map<string, string>(), images: [] }

  return {
    fileName: getSafeName(deliverable.title),
    images,
    model: {
      projectTitle: projects[0]?.name ?? '프로젝트명',
      deliverableTitle: deliverable.title,
      outlineRows: collectOutlineRows(sections),
      pages: entries.map((entry) => ({
        id: getPageElementId(entry.item.doc_id),
        title: entry.item.doc_title,
        phase: entry.phase,
        entryPath: getDocEntryPath(entry.item),
        description: entry.item.description,
        imageSrc: imageMap.get(entry.item.doc_id) ?? getDocImageSrc(entry.item),
        date: formatDate(entry.item.updated_at),
        functions: parseContentItems(entry.item.content_json).map((item) => ({
          ...item,
          color: getNumberColor(entry.item.annotation_json)
        }))
      }))
    }
  }
}
