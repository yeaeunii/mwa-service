import { selectList, runQuery } from './conn'
import { Project } from './dto'

export const getProjectList = (params?: Record<string, unknown>): Project[] => {
  const defParams = {
    delete_yn: 0,
    order_by: 'updated_at DESC',
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
    WHERE delete_yn = @delete_yn
    ORDER BY @order_by
    LIMIT @limit
    OFFSET @offset
  `
  return selectList<Project>(query, queryParams) as Project[]
}

export const createProject = (project: Record<string, unknown>): void => {
  const query = `
    INSERT INTO t_project (name, description, status, serv_url, delete_yn, created_at, updated_at)
    VALUES (@name, @description, @status, @serv_url, @delete_yn, @created_at, @updated_at)
  `
  runQuery(query, project)
}
