export interface Project {
  id: number
  name: string
  description: string
  status: string
  serv_url: string
  delete_yn: number
  created_at: string
  updated_at: string
}

export interface DocGroup {
  id: number
  title: string
  description: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  draw_img_src: string
  orgn_img_src: string
  sort_order: number
  created_at: string
  updated_at: string
  group_id: number
}

export interface Doc {
  id: number
  title: string
  description: string
  doc_meta_json: string
  content_json: string
  annotation_json: string
  draw_img_src: string
  orgn_img_src: string
  sort_order: number
  created_at: string
  updated_at: string
  group_id: number
}

export interface CaptureGroup {
  id: number
  name: string
  sort_order: number
  latest_src_url: string
  created_at: string
  updated_at: string
  project_id: number
}

export interface CaptureImg {
  id: number
  group_id: number
  img_path: string
  created_at: string
}

export interface UsedCaptureImg {
  capture_img_id: number
  doc_id: number
}
