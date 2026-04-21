import { selectList, runQuery } from './conn'
import { Project, Workspace } from './dto'

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

  const now = new Date().toISOString()

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
  const now = new Date().toISOString()

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