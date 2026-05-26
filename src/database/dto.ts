export interface Project {
  id: number
  name: string
  description: string
  serv_url: string
  status: string
  thumbnail_path: string
  delete_yn: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: number
  project_id: number
  name: string
  latest_src_url: string
  thumbnail_path: string
  created_at: string
  updated_at: string
}

export interface Capture {
  id: number
  workspace_id: number
  name: string
  img_path: string
  created_at: string
}

export interface Doc {
  id: number
  workspace_id: number
  section_id: number
  title: string
  description: string
  status: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  orgn_img_path: string
  draw_img_path: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Deliverable {
  id: number
  project_id: number
  title: string
  created_at: string
  updated_at: string
}

export interface DeliverableSection {
  id: number
  deliverable_id: number
  parent_id: number | null
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DeliverableSectionDoc {
  id: number
  section_id: number
  doc_id: number
  sort_order: number
  created_at: string
  workspace_id: number
  title: string
  description: string
  status: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  orgn_img_path: string
  draw_img_path: string
  updated_at: string
}

export interface DeliverableStructureResponse {
  sections: DeliverableSection[]
  sectionDocs: DeliverableSectionDoc[]
}

export interface SectionDocInput {
  doc_id: string
  doc_title: string
  kind: 'workspace' | 'document'
  meta: string
  status?: string
}

export interface SectionTreeInput {
  id: string
  name: string
  docs: SectionDocInput[]
  children: SectionTreeInput[]
}
