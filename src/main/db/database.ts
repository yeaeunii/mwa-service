import Database from 'better-sqlite3'
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, extname, join } from 'path'
import type {
  AnnotationRecord,
  CaptureRecord,
  FolderRecord,
  ProjectRecord,
  ProjectWorkspaceRecord
} from '../../interfaces/db.schema'
import schemaSql from './schema.sql?raw'

import { selectOne, selectList, runQuery, transaction } from './connector'

const CAPTURE_ROOT_DIR = 'screenshots'
const CAPTURE_AREA_DIR = '캡쳐폴더'
const DOCUMENT_AREA_DIR = '문서폴더'

const getProjectIdByCaptureId = (captureId: string): string | null => {
  const row = selectOne<{ project_id: string }>(`SELECT project_id FROM captures WHERE id = ?`, [
    captureId
  ])
  return row?.project_id ?? null
}

const calculateProjectProgress = (
  projectId: string
): {
  progress: number
  status: ProjectRecord['status']
} => {
  const row = selectOne<{
    capture_count: number | null
    selected_count: number | null
    annotated_selected_count: number | null
  }>(
    `
    SELECT
          COUNT(c.id) AS capture_count,
          SUM(CASE WHEN c.is_selected = 1 THEN 1 ELSE 0 END) AS selected_count,
          SUM(
            CASE
              WHEN c.is_selected = 1
               AND EXISTS (
                 SELECT 1
                 FROM annotations a
                 WHERE a.capture_id = c.id
                   AND a.tool_type = 'number'
                   AND trim(a.description) <> ''
               )
              THEN 1
              ELSE 0
            END
          ) AS annotated_selected_count
        FROM captures c
        INNER JOIN folders f
          ON f.id = c.folder_id
         AND f.delete_yn = 'N'
        WHERE c.project_id = ?
  `,
    [projectId]
  ) as
    | {
        capture_count: number | null
        selected_count: number | null
        annotated_selected_count: number | null
      }
    | undefined

  const captureCount = Number(row?.capture_count ?? 0)
  const selectedCount = Number(row?.selected_count ?? 0)
  const annotatedSelectedCount = Number(row?.annotated_selected_count ?? 0)

  if (captureCount === 0) {
    return { progress: 0, status: 'draft' }
  }

  if (selectedCount === 0) {
    return { progress: 33, status: 'in_progress' }
  }

  if (annotatedSelectedCount === selectedCount) {
    return { progress: 100, status: 'completed' }
  }

  return { progress: 66, status: 'in_progress' }
}

const refreshProjectProgress = (projectId: string): void => {
  const { progress, status } = calculateProjectProgress(projectId)

  runQuery(`UPDATE projects SET progress = ?, status = ?, delete_yn = 'N' WHERE id = ?`, [
    progress,
    status,
    projectId
  ])
}

export const upsertProject = (payload: {
  id: string
  name: string
  description?: string
  sourceUrl?: string
}): void => {
  runQuery(
    `
      INSERT INTO projects (id, name, description, source_url, status, progress, delete_yn)
      VALUES (@id, @name, @description, @sourceUrl, 'draft', 0, 'N')
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        source_url = excluded.source_url,
        delete_yn = 'N'
    `,
    {
      id: payload.id,
      name: payload.name,
      description: payload.description ?? '',
      sourceUrl: payload.sourceUrl ?? ''
    }
  )
}

export const updateProject = (payload: {
  id: string
  name: string
  description?: string
}): void => {
  runQuery(
    `
      UPDATE projects
      SET name = @name, description = @description, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id AND delete_yn = 'N'
    `,
    {
      id: payload.id,
      name: payload.name,
      description: payload.description ?? ''
    }
  )
}

export const listProjects = (): ProjectRecord[] => {
  return selectList<ProjectRecord>(
    `
      SELECT id, name, description, status, source_url, progress, delete_yn, created_at, updated_at
      FROM projects
      WHERE delete_yn = 'N'
      ORDER BY updated_at DESC, created_at DESC
    `
  )
}

export const getProjectById = (projectId: string): ProjectRecord | null => {
  return selectOne<ProjectRecord>(
    `
      SELECT id, name, description, status, source_url, progress, delete_yn, created_at, updated_at
      FROM projects
      WHERE id = ? AND delete_yn = 'N'
    `,
    [projectId]
  )
}

export const deleteProject = (projectId: string): void => {
  runQuery(
    `
      UPDATE projects
      SET delete_yn = 'Y', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [projectId]
  )
}

export const upsertFolder = (payload: {
  id: string
  projectId: string
  title: string
  path?: string
  description?: string
  sortOrder?: number
  areaType?: 'capture' | 'document'
}): void => {
  runQuery(
    `
      INSERT INTO folders (id, project_id, title, path, description, area_type, sort_order, delete_yn)
      VALUES (@id, @projectId, @title, @path, @description, @areaType, @sortOrder, 'N')
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        title = excluded.title,
        path = excluded.path,
        description = excluded.description,
        area_type = excluded.area_type,
        sort_order = excluded.sort_order,
        delete_yn = 'N'
    `,
    {
      id: payload.id,
      projectId: payload.projectId,
      title: payload.title,
      path: payload.path ?? '',
      description: payload.description ?? '',
      areaType: payload.areaType ?? 'capture',
      sortOrder: payload.sortOrder ?? 0
    }
  )
}

export const markDeletedFolders = (
  projectId: string,
  activeFolderIds: string[],
  areaType?: 'capture' | 'document'
): void => {
  const activeIds = activeFolderIds.filter(Boolean)
  const areaCondition = areaType ? ` AND area_type = ?` : ''
  const conditionParams = areaType ? [areaType] : []

  if (activeIds.length === 0) {
    runQuery(`UPDATE folders SET delete_yn = 'Y' WHERE project_id = ?${areaCondition}`, [
      projectId,
      ...conditionParams
    ])
    refreshProjectProgress(projectId)
    return
  }

  const placeholders = activeIds.map(() => '?').join(', ')
  runQuery(
    `UPDATE folders SET delete_yn = 'Y' WHERE project_id = ?${areaCondition} AND id NOT IN (${placeholders})`,
    [projectId, ...conditionParams, ...activeIds]
  )

  refreshProjectProgress(projectId)
}

export const listFoldersByProject = (projectId: string): FolderRecord[] => {
  return selectList<FolderRecord>(
    `
      SELECT id, project_id, title, path, description, area_type, sort_order, created_at, updated_at
      FROM folders
      WHERE project_id = ?
        AND delete_yn = 'N'
      ORDER BY area_type ASC, sort_order ASC, created_at ASC
    `,
    [projectId]
  )
}

export const insertCapture = (payload: {
  id: string
  projectId: string
  folderId: string
  fileName: string
  imagePath: string
  sourceUrl?: string
  pageTitle?: string
  menuPath?: string
  screenDescription?: string
  functionalityDescription?: string
  writerName?: string
  pageNo?: number
}): void => {
  const sortRow = selectOne<{ next_sort_order: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM captures WHERE folder_id = ?`,
    [payload.folderId]
  )

  runQuery(
    `
      INSERT INTO captures (
        id, project_id, folder_id, file_name, image_path, source_url, page_title,
        menu_path, screen_description, functionality_description, writer_name, page_no, sort_order, is_selected
      )
      VALUES (
        @id, @projectId, @folderId, @fileName, @imagePath, @sourceUrl, @pageTitle,
        @menuPath, @screenDescription, @functionalityDescription, @writerName, @pageNo, @sortOrder, 0
      )
    `,
    {
      id: payload.id,
      projectId: payload.projectId,
      folderId: payload.folderId,
      fileName: payload.fileName,
      imagePath: payload.imagePath,
      sourceUrl: payload.sourceUrl ?? '',
      pageTitle: payload.pageTitle ?? '',
      menuPath: payload.menuPath ?? '',
      screenDescription: payload.screenDescription ?? '',
      functionalityDescription: payload.functionalityDescription ?? '',
      writerName: payload.writerName ?? '',
      pageNo: payload.pageNo ?? (sortRow?.next_sort_order ?? 0) + 1,
      sortOrder: sortRow?.next_sort_order ?? 0
    }
  )

  refreshProjectProgress(payload.projectId)
}

const sanitizeFileSegment = (value: string): string =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default'

export const copyCapturesToFolder = (payload: {
  projectId: string
  targetFolderId: string
  projectName: string
  folderTitle: string
  folderPath?: string
  folderDescription?: string
  captureIds: string[]
}): CaptureRecord[] => {
  const sourceIds = [...new Set(payload.captureIds.filter(Boolean))]
  console.log('[db/import] start', {
    ...payload,
    sourceCount: sourceIds.length
  })

  if (sourceIds.length === 0) {
    console.warn('[db/import] no source ids')
    return []
  }

  const placeholders = sourceIds.map(() => '?').join(', ')
  const sourceRows = selectList<CaptureRecord>(
    `
      SELECT
        c.id,
        c.folder_id,
        c.file_name,
        c.image_path,
        c.source_url,
        c.page_title,
        c.menu_path,
        c.screen_description,
        c.functionality_description,
        c.writer_name,
        c.page_no,
        c.sort_order,
        c.is_selected,
        c.created_at
        FROM captures c
        INNER JOIN folders f
          ON f.id = c.folder_id
         AND f.delete_yn = 'N'
        WHERE c.project_id = ?
          AND c.id IN (${placeholders})
        ORDER BY c.sort_order ASC, c.created_at ASC
    `,
    [payload.projectId, ...sourceIds]
  )

  if (sourceRows.length === 0) {
    console.warn('[db/import] no source rows found', sourceIds)
    return []
  }

  console.log('[db/import] source rows', {
    rowCount: sourceRows.length,
    sourceRows
  })

  const nextSortOrderRow = selectOne<{ next_sort_order: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM captures WHERE folder_id = ?`,
    [payload.targetFolderId]
  )

  const insertStatement = db.prepare(
    `
      INSERT INTO captures (
        id, project_id, folder_id, file_name, image_path, source_url, page_title,
        menu_path, screen_description, functionality_description, writer_name, page_no, sort_order, is_selected
      )
      VALUES (
        @id, @projectId, @folderId, @fileName, @imagePath, @sourceUrl, @pageTitle,
        @menuPath, @screenDescription, @functionalityDescription, @writerName, @pageNo, @sortOrder, 1
      )
    `
  )

  let nextSortOrder = nextSortOrderRow?.next_sort_order ?? 0
  const insertedRows: CaptureRecord[] = []

  const transaction = db.transaction(() => {
    const targetDir = join(
      app.getPath('userData'),
      CAPTURE_ROOT_DIR,
      sanitizeFileSegment(payload.projectName),
      DOCUMENT_AREA_DIR,
      sanitizeFileSegment(payload.folderTitle)
    )

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    console.log('[db/import] target dir', targetDir)

    sourceRows.forEach((row) => {
      const captureId = `capture-${randomUUID()}`
      const extension = extname(row.image_path) || '.png'
      const fileName = `${captureId}${extension}`
      const imagePath = join(targetDir, fileName)

      console.log('[db/import] copy', {
        from: row.image_path,
        to: imagePath,
        captureId
      })
      copyFileSync(row.image_path, imagePath)

      insertStatement.run({
        id: captureId,
        projectId: payload.projectId,
        folderId: payload.targetFolderId,
        fileName,
        imagePath,
        sourceUrl: row.source_url,
        pageTitle: payload.folderTitle,
        menuPath: payload.folderPath ?? row.menu_path ?? row.page_title,
        screenDescription: payload.folderDescription ?? row.screen_description,
        functionalityDescription: row.functionality_description,
        writerName: row.writer_name,
        pageNo: nextSortOrder + 1,
        sortOrder: nextSortOrder
      })

      insertedRows.push({
        id: captureId,
        folder_id: payload.targetFolderId,
        file_name: fileName,
        image_path: imagePath,
        source_url: row.source_url,
        page_title: payload.folderTitle,
        menu_path: payload.folderPath ?? row.menu_path ?? row.page_title,
        screen_description: payload.folderDescription ?? row.screen_description,
        functionality_description: row.functionality_description,
        writer_name: row.writer_name,
        page_no: nextSortOrder + 1,
        sort_order: nextSortOrder,
        is_selected: 1,
        created_at: new Date().toISOString()
      })

      nextSortOrder += 1
    })
  })

  transaction()
  console.log('[db/import] inserted rows', {
    rowCount: insertedRows.length,
    insertedRows
  })
  refreshProjectProgress(payload.projectId)

  return insertedRows
}

export const deleteCapture = (captureId: string): void => {
  const db = getDatabase()
  const projectId = getProjectIdByCaptureId(captureId)

  db.prepare(`DELETE FROM captures WHERE id = ?`).run(captureId)

  if (projectId) {
    refreshProjectProgress(projectId)
  }
}

export const listCapturesByProject = (projectId: string): CaptureRecord[] => {
  const db = getDatabase()

  return db
    .prepare(
      `
        SELECT
          c.id,
          c.folder_id,
          c.file_name,
          c.image_path,
          c.source_url,
          c.page_title,
          c.menu_path,
          c.screen_description,
          c.functionality_description,
          c.writer_name,
          c.page_no,
          c.sort_order,
          c.is_selected,
          c.created_at
        FROM captures c
        INNER JOIN folders f
          ON f.id = c.folder_id
         AND f.delete_yn = 'N'
        WHERE c.project_id = ?
        ORDER BY f.sort_order ASC, c.sort_order ASC, c.created_at ASC
      `
    )
    .all(projectId) as CaptureRecord[]
}

export const updateCaptureSelections = (projectId: string, selectedCaptureIds: string[]): void => {
  const db = getDatabase()
  const activeIds = selectedCaptureIds.filter(Boolean)

  db.prepare(`UPDATE captures SET is_selected = 0 WHERE project_id = ?`).run(projectId)

  if (activeIds.length > 0) {
    const placeholders = activeIds.map(() => '?').join(', ')
    db.prepare(
      `
        UPDATE captures
        SET is_selected = 1
        WHERE project_id = ?
          AND id IN (${placeholders})
      `
    ).run(projectId, ...activeIds)
  }

  refreshProjectProgress(projectId)
}

export const updateCaptureSortOrders = (folderId: string, orderedCaptureIds: string[]): void => {
  const db = getDatabase()
  const updateStatement = db.prepare(
    `
      UPDATE captures
      SET sort_order = @sortOrder
      WHERE id = @captureId
        AND folder_id = @folderId
    `
  )

  const transaction = db.transaction((captureIds: string[]) => {
    captureIds.forEach((captureId, index) => {
      updateStatement.run({
        captureId,
        folderId,
        sortOrder: index
      })
    })
  })

  transaction(orderedCaptureIds)
}

export const updateCaptureMetadata = (payload: {
  captureId: string
  pageTitle?: string
  menuPath?: string
  screenDescription?: string
  functionalityDescription?: string
  writerName?: string
  pageNo?: number
}): void => {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE captures
      SET
        page_title = @pageTitle,
        menu_path = @menuPath,
        screen_description = @screenDescription,
        functionality_description = @functionalityDescription,
        writer_name = @writerName,
        page_no = @pageNo
      WHERE id = @captureId
    `
  ).run({
    captureId: payload.captureId,
    pageTitle: payload.pageTitle ?? '',
    menuPath: payload.menuPath ?? '',
    screenDescription: payload.screenDescription ?? '',
    functionalityDescription: payload.functionalityDescription ?? '',
    writerName: payload.writerName ?? '',
    pageNo: payload.pageNo ?? 1
  })
}

export const listAnnotationsByCaptureId = (captureId: string): AnnotationRecord[] => {
  const db = getDatabase()

  return db
    .prepare(
      `
        SELECT id, capture_id, tool_type, marker_no, x, y, width, height, description
        FROM annotations
        WHERE capture_id = ?
        ORDER BY marker_no ASC, created_at ASC
      `
    )
    .all(captureId) as AnnotationRecord[]
}

export const replaceCaptureAnnotations = (
  captureId: string,
  annotations: Array<{
    id: string
    toolType: 'number' | 'box'
    markerNo: number | null
    x: number
    y: number
    width?: number | null
    height?: number | null
    description?: string
  }>
): void => {
  const db = getDatabase()
  const projectId = getProjectIdByCaptureId(captureId)
  const deleteStatement = db.prepare(`DELETE FROM annotations WHERE capture_id = ?`)
  const insertStatement = db.prepare(
    `
      INSERT INTO annotations (
        id,
        capture_id,
        tool_type,
        marker_no,
        x,
        y,
        width,
        height,
        description
      )
      VALUES (
        @id,
        @captureId,
        @toolType,
        @markerNo,
        @x,
        @y,
        @width,
        @height,
        @description
      )
    `
  )

  const transaction = db.transaction(() => {
    deleteStatement.run(captureId)

    annotations.forEach((annotation) => {
      insertStatement.run({
        id: annotation.id,
        captureId,
        toolType: annotation.toolType,
        markerNo: annotation.markerNo,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width ?? null,
        height: annotation.height ?? null,
        description: annotation.description ?? ''
      })
    })
  })

  transaction()

  if (projectId) {
    refreshProjectProgress(projectId)
  }
}

export const getProjectWorkspace = (projectId: string): ProjectWorkspaceRecord => {
  const project = getProjectById(projectId)
  const folders = listFoldersByProject(projectId)
  const captures = listCapturesByProject(projectId)

  return {
    project,
    folders: folders.map((folder) => ({
      ...folder,
      screenshots: captures
        .filter((capture) => capture.folder_id === folder.id)
        .map((capture) => ({
          ...capture,
          annotations: listAnnotationsByCaptureId(capture.id)
        }))
    }))
  }
}
