import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { unlink, writeFile } from 'fs/promises'
import path from 'path'
import { selectList,selectOne,  runQuery } from './conn'
import { Project, Workspace } from './dto'
import dayjs from 'dayjs'

// 프로젝트 조회
export const getProjectList = (params?: Record<string, unknown>): Project[] => {
  const defParams = {
    id: null,
    delete_yn: '0',
    limit: 10,
    offset: 0
  }

  const queryParams = { ...defParams, ...(params || {}) }

  const query = `
    SELECT
      id,
      name,
      description,
      status,
      serv_url,
      delete_yn,
      created_at,
      updated_at
    FROM t_project
    WHERE delete_yn = CAST(@delete_yn AS TEXT)
      AND (@id IS NULL OR id = @id)
    LIMIT @limit
    OFFSET @offset
  `

  return selectList<Project>(query, queryParams) as Project[]
}
// 프로젝트 생성
export const createProject = (project: Record<string, unknown>): number => {

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const query = `
    INSERT INTO t_project (name, description, status, serv_url, delete_yn, created_at, updated_at)
    VALUES (@name, @description, @status, @serv_url, @delete_yn, @created_at, @updated_at)
  `

  const payload = {
    status: '진행중',
    serv_url: '',
    delete_yn: '0',
    created_at: now,
    updated_at: now,
    ...project
  }

  const result = runQuery(query, payload)
  return Number(result.lastInsertRowid)
}

// 프로젝트 수정
export const updateProject = (project: Record<string, unknown>): void => {
  const query = `
    UPDATE t_project
    SET
      name = @name,
      description = @description,
      serv_url = @serv_url,
      updated_at = @updated_at
    WHERE id = @id
  `

  const payload = {
    updated_at: new Date().toISOString(),
    ...project
  }

  runQuery(query, payload)
}

// 프로젝트 삭제
export const deleteProject = (id: string | number): void => {
  const query = `
    UPDATE t_project
    SET
      delete_yn = '1',
      updated_at = @updated_at
    WHERE id = @id
  `

  runQuery(query, {
    id,
    updated_at: new Date().toISOString()
  })
}

// 워크스페이스 조회
export const getWorkspaceList = (params?: Record<string, unknown>): Workspace[] => {
  const queryParams = {
    project_id: 0,
    limit: 50,
    offset: 0,
    ...(params || {})
  }

  const query = `
    SELECT
      id,
      project_id,
      name,
      latest_src_url,
      created_at,
      updated_at
    FROM t_worksapce
    WHERE project_id = @project_id
    ORDER BY updated_at DESC
    LIMIT @limit
    OFFSET @offset
  `

  return selectList<Workspace>(query, queryParams) as Workspace[]
}


// 워크스페이스 생성
export const createWorkspace = (workspace: Record<string, unknown>): number => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')


  const query = `
    INSERT INTO t_worksapce (project_id, name, latest_src_url, created_at, updated_at)
    VALUES (@project_id, @name, @latest_src_url, @created_at, @updated_at)
  `

  const payload = {
    latest_src_url: '',
    created_at: now,
    updated_at: now,
    ...workspace
  }

  const result = runQuery(query, payload)
  return Number(result.lastInsertRowid)
}



// 워크스페이스 수정
export const updateWorkspace = (project: Record<string, unknown>): void => {
  const query = `
    UPDATE t_worksapce
    SET
      name = @name,
      updated_at = @updated_at
    WHERE id = @id
  `

  const payload = {
    updated_at: new Date().toISOString(),
    ...project
  }

  runQuery(query, payload)
}

// 워크스페이스 삭제
export const deleteWorkspace = (id: string | number): void => {
  const query = `
    DELETE FROM t_worksapce
    WHERE id = @id
  `

  runQuery(query, { id })
}


//프로젝트명 워크스페이스명 조회
export const getWorkspaceDetail = (id:string | number ) => {
const query = `
    SELECT
      w.id,
      w.name,
      w.project_id,
      w.latest_src_url,
      p.name as project_name
    FROM t_worksapce w
    JOIN t_project p ON p.id = w.project_id
    WHERE w.id = @id
`

return selectOne(query, { id })
}


//캡쳐 이미지 조회
export const getCaptureList = (params: Record<string, unknown>) => {
  const query = `
    SELECT
      id,
      workspace_id,
      name,
      img_path,
      created_at
    FROM t_capture
    WHERE workspace_id = @workspaceId
    ORDER BY id DESC
  `

  return selectList(query, params)
}



//캡쳐이미지 local & DB 저장
export const createCaptureWithImage = async (
  capture: Record<string, unknown>
): Promise<{ id: number; imgPath: string }> => {
  const workspaceId = String(capture.workspaceId ?? '')
  const name = String(capture.name ?? '')
  const dataUrl = String(capture.dataUrl ?? '')
  const currentUrl = String(capture.currentUrl ?? '')
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const insertQuery = `
    INSERT INTO t_capture (workspace_id, name, img_path, created_at)
    VALUES (@workspaceId, @name, @imgPath, @created_at)
  `
  const insertResult = runQuery(insertQuery, {
    workspaceId,
    name,
    imgPath: null,
    created_at: now
  })
  const captureId = Number(insertResult.lastInsertRowid)

  const capturesDir = path.join(app.getPath('userData'), 'FILE', 'CAPTURES')
  if (!existsSync(capturesDir)) {
    mkdirSync(capturesDir, { recursive: true })
  }

  const imgName = `captures_${captureId}.png`
  const imgLocalPath = path.join(capturesDir, imgName)
  const imgPath = path.join('FILE', 'CAPTURES', imgName).replace(/\\/g, '/')
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')

  await writeFile(imgLocalPath, Buffer.from(base64Data, 'base64'))
  runQuery(
    `
      UPDATE t_capture
      SET img_path = @imgPath
      WHERE id = @id
    `,
    {
      id: captureId,
      imgPath
    }
  )
  runQuery(
    `
      UPDATE t_worksapce
      SET latest_src_url = @latest_src_url,
          updated_at = @updated_at
      WHERE id = @id
    `,
    {
      id: workspaceId,
      latest_src_url: currentUrl,
      updated_at: now
    }
  )

  return {
    id: captureId,
    imgPath
  }
}


//캡쳐이름 수정
export const updateCaptureName = (capture: Record<string, unknown>): void => {
  const query = `
    UPDATE t_capture
    SET name = @name
    WHERE id = @id
  `

  runQuery(query, capture)
}


//캡쳐 삭제
export const deleteCapture = async (capture: Record<string, unknown>): Promise<void> => {
  const id = capture.id as string | number
  const imgPath = (capture.imgPath as string | null | undefined) ?? null

  if (imgPath) {
    const fileRootDir = path.join(app.getPath('userData'), 'FILE')
    const relativePath = imgPath.replace(/\\/g, '/').replace(/^\/+/, '')
    const absPath = path.resolve(app.getPath('userData'), relativePath)
    const resolvedBase = path.resolve(fileRootDir)
    const normalizedBase = resolvedBase + path.sep
    const isInsideBase = absPath === resolvedBase || absPath.startsWith(normalizedBase)

    if (!isInsideBase) {
      throw new Error(`Forbidden file path: ${imgPath}`)
    }

    if (existsSync(absPath)) {
      await unlink(absPath)
    }
  }

  const query = `
    DELETE FROM t_capture
    WHERE id = @id
  `

  runQuery(query, { id })
}
