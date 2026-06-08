export type CaptureImage = {
  id: number
  name: string
  src: string
  imgPath?: string
}

export type ToolMode = 'number' | 'strokebox' | 'filled-box' | 'dashed-box' | 'mosaic' | null

export type CanvasAnnotation = {
  id: string
  toolType: Exclude<ToolMode, null>
  color: string
  number?: number
  order?: number
  zIndex?: number
  angle?: number
  x: number
  y: number
  width?: number
  height?: number
}

export type AnnotationItem = Partial<CanvasAnnotation>

export type ContentItem = {
  number: number
  text: string
}

export type Card = {
  annotationId: string
  number: number
  order: number
  text: string
}

export type EditorDocGroup = {
  id: string
  title: string
}

export type EditorDoc = {
  id: string
  groupId: string
  drawImageSrc: string
  orgnImageSrc: string
  title: string
  description: string
  sortOrder: number
  contentMap: Record<string, ContentItem>
  annoMap: Record<string, AnnotationItem>
}

export type DownloadFormat = 'html' | 'pdf'

export type ManualExportBundle = {
  html: string
  css: string
  js: string
  images?: {
    path: string
    content: string
    encoding: 'base64'
  }[]
}

export type ExportResult = {
  canceled: boolean
  filePath?: string
}
