export interface ProjectRecord {
  id: string
  name: string
  description: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  source_url: string
  progress: number
  delete_yn: 'Y' | 'N'
  created_at: string
  updated_at: string
}

export interface FolderRecord {
  id: string
  project_id: string
  title: string
  path: string
  description: string
  area_type: 'capture' | 'document'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CaptureRecord {
  id: string
  folder_id: string
  file_name: string
  image_path: string
  source_url: string
  page_title: string
  menu_path: string
  screen_description: string
  functionality_description: string
  writer_name: string
  page_no: number
  sort_order: number
  is_selected: number
  created_at: string
}

export interface AnnotationRecord {
  id: string
  capture_id: string
  tool_type: 'number' | 'box'
  marker_no: number | null
  x: number
  y: number
  width: number | null
  height: number | null
  description: string
}

export interface WorkspaceCaptureRecord extends CaptureRecord {
  annotations: AnnotationRecord[]
}

export interface WorkspaceFolderRecord extends FolderRecord {
  screenshots: WorkspaceCaptureRecord[]
}

export interface ProjectWorkspaceRecord {
  project: ProjectRecord | null
  folders: WorkspaceFolderRecord[]
}
