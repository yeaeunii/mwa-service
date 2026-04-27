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
