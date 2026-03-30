import Database from 'better-sqlite3'
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, extname, join } from 'path'
import schemaSql from './schema.sql?raw'

let database: Database.Database | null = null
const CAPTURE_ROOT_DIR = 'screenshots'
const CAPTURE_AREA_DIR = '캡쳐폴더'
const DOCUMENT_AREA_DIR = '문서폴더'
const SCHEMA_VERSION = 6

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

export const getDatabasePath = (): string => join(app.getPath('userData'), 'miso-mwa.db')

const migrateDatabase = (db: Database.Database, currentSchemaVersion: number): void => {
  if (currentSchemaVersion === 0) {
    db.exec(schemaSql)
    return
  }

  if (currentSchemaVersion < 4) {
    db.exec(`
      ALTER TABLE folders ADD COLUMN path TEXT NOT NULL DEFAULT '';
      ALTER TABLE folders ADD COLUMN description TEXT NOT NULL DEFAULT '';
    `)
  }

  if (currentSchemaVersion < 5) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      ALTER TABLE folders RENAME TO folders_legacy;

      CREATE TABLE folders (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        path TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        area_type TEXT NOT NULL DEFAULT 'capture'
          CHECK (area_type IN ('capture', 'document')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        delete_yn TEXT NOT NULL DEFAULT 'N'
          CHECK (delete_yn IN ('Y', 'N')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      INSERT INTO folders (
        id,
        project_id,
        title,
        path,
        description,
        area_type,
        sort_order,
        delete_yn,
        created_at,
        updated_at
      )
      SELECT
        id,
        project_id,
        title,
        COALESCE(path, ''),
        COALESCE(description, ''),
        area_type,
        sort_order,
        delete_yn,
        created_at,
        updated_at
      FROM folders_legacy;

      DROP TABLE folders_legacy;

      CREATE INDEX idx_folders_project_id
        ON folders(project_id);

      CREATE INDEX idx_folders_project_delete_yn
        ON folders(project_id, delete_yn);

      CREATE UNIQUE INDEX uq_folders_project_area_title_active
        ON folders(project_id, area_type, title)
        WHERE delete_yn = 'N';

      CREATE TRIGGER trg_folders_updated_at
      AFTER UPDATE ON folders
      FOR EACH ROW
      BEGIN
        UPDATE folders
        SET updated_at = datetime('now')
        WHERE id = NEW.id;
      END;

      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 5;
    `)
  }

  if (currentSchemaVersion < 6) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE captures_new (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        source_url TEXT NOT NULL DEFAULT '',
        page_title TEXT NOT NULL DEFAULT '',
        menu_path TEXT NOT NULL DEFAULT '',
        screen_description TEXT NOT NULL DEFAULT '',
        functionality_description TEXT NOT NULL DEFAULT '',
        writer_name TEXT NOT NULL DEFAULT '',
        page_no INTEGER NOT NULL DEFAULT 1,
        mime_type TEXT NOT NULL DEFAULT 'image/png',
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_selected INTEGER NOT NULL DEFAULT 0
          CHECK (is_selected IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      INSERT INTO captures_new (
        id,
        project_id,
        folder_id,
        file_name,
        image_path,
        source_url,
        page_title,
        menu_path,
        screen_description,
        functionality_description,
        writer_name,
        page_no,
        mime_type,
        width,
        height,
        file_size,
        sort_order,
        is_selected,
        created_at,
        updated_at
      )
      SELECT
        id,
        project_id,
        folder_id,
        file_name,
        image_path,
        source_url,
        page_title,
        menu_path,
        screen_description,
        functionality_description,
        writer_name,
        page_no,
        COALESCE(mime_type, 'image/png'),
        width,
        height,
        file_size,
        sort_order,
        is_selected,
        created_at,
        updated_at
      FROM captures;

      DROP TABLE captures;

      ALTER TABLE captures_new RENAME TO captures;

      CREATE INDEX idx_captures_project_folder
        ON captures(project_id, folder_id);

      CREATE INDEX idx_captures_selected
        ON captures(project_id, is_selected);

      CREATE INDEX idx_captures_image_path
        ON captures(image_path);

      CREATE TRIGGER trg_captures_updated_at
      AFTER UPDATE ON captures
      FOR EACH ROW
      BEGIN
        UPDATE captures
        SET updated_at = datetime('now')
        WHERE id = NEW.id;
      END;

      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 6;
    `)
  }
}

export const initDatabase = (): Database.Database => {
  if (database) return database

  const dbPath = getDatabasePath()
  const dbDir = dirname(dbPath)

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  database = new Database(dbPath)
  database.pragma('foreign_keys = ON')
  const currentSchemaVersion = Number(database.pragma('user_version', { simple: true }) ?? 0)

  if (currentSchemaVersion < SCHEMA_VERSION) {
    migrateDatabase(database, currentSchemaVersion)
  }

  return database
}

export const getDatabase = (): Database.Database => {
  if (!database) {
    return initDatabase()
  }

  return database
}

export const closeDatabase = (): void => {
  if (!database) return

  database.close()
  database = null
}

const getProjectIdByCaptureId = (captureId: string): string | null => {
  const db = getDatabase()
  const row = db
    .prepare(`SELECT project_id FROM captures WHERE id = ?`)
    .get(captureId) as { project_id: string } | undefined

  return row?.project_id ?? null
}

const calculateProjectProgress = (
  projectId: string
): {
  progress: number
  status: ProjectRecord['status']
} => {
  const db = getDatabase()

  const counts = db
    .prepare(
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
      `
    )
    .get(projectId) as
    | {
        capture_count: number | null
        selected_count: number | null
        annotated_selected_count: number | null
      }
    | undefined

  const captureCount = Number(counts?.capture_count ?? 0)
  const selectedCount = Number(counts?.selected_count ?? 0)
  const annotatedSelectedCount = Number(counts?.annotated_selected_count ?? 0)

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
  const db = getDatabase()
  const { progress, status } = calculateProjectProgress(projectId)

  db.prepare(
    `
      UPDATE projects
      SET progress = ?, status = ?, delete_yn = 'N'
      WHERE id = ?
    `
  ).run(progress, status, projectId)
}

export const upsertProject = (payload: {
  id: string
  name: string
  description?: string
  sourceUrl?: string
}): void => {
  const db = getDatabase()

  db.prepare(
    `
      INSERT INTO projects (id, name, description, source_url, status, progress, delete_yn)
      VALUES (@id, @name, @description, @sourceUrl, 'draft', 0, 'N')
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        source_url = excluded.source_url,
        delete_yn = 'N'
    `
  ).run({
    id: payload.id,
    name: payload.name,
    description: payload.description ?? '',
    sourceUrl: payload.sourceUrl ?? ''
  })
}

export const updateProject = (payload: {
  id: string
  name: string
  description?: string
}): void => {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE projects
      SET
        name = @name,
        description = @description,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
        AND delete_yn = 'N'
    `
  ).run({
    id: payload.id,
    name: payload.name,
    description: payload.description ?? ''
  })
}

export const listProjects = (): ProjectRecord[] => {
  const db = getDatabase()

  return db
    .prepare(
      `
        SELECT id, name, description, status, source_url, progress, delete_yn, created_at, updated_at
        FROM projects
        WHERE delete_yn = 'N'
        ORDER BY updated_at DESC, created_at DESC
      `
    )
    .all() as ProjectRecord[]
}

export const getProjectById = (projectId: string): ProjectRecord | null => {
  const db = getDatabase()

  return (
    (db
      .prepare(
        `
          SELECT id, name, description, status, source_url, progress, delete_yn, created_at, updated_at
          FROM projects
          WHERE id = ?
            AND delete_yn = 'N'
        `
      )
      .get(projectId) as ProjectRecord | undefined) ?? null
  )
}

export const deleteProject = (projectId: string): void => {
  const db = getDatabase()

  db.prepare(
    `
      UPDATE projects
      SET
        delete_yn = 'Y',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(projectId)
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
  const db = getDatabase()

  db.prepare(
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
    `
  ).run({
    id: payload.id,
    projectId: payload.projectId,
    title: payload.title,
    path: payload.path ?? '',
    description: payload.description ?? '',
    areaType: payload.areaType ?? 'capture',
    sortOrder: payload.sortOrder ?? 0
  })
}

export const markDeletedFolders = (
  projectId: string,
  activeFolderIds: string[],
  areaType?: 'capture' | 'document'
): void => {
  const db = getDatabase()
  const activeIds = activeFolderIds.filter(Boolean)
  const areaCondition = areaType ? ` AND area_type = ?` : ''
  const conditionParams = areaType ? [areaType] : []

  if (activeIds.length === 0) {
    db.prepare(`UPDATE folders SET delete_yn = 'Y' WHERE project_id = ?${areaCondition}`).run(
      projectId,
      ...conditionParams
    )
    refreshProjectProgress(projectId)
    return
  }

  const placeholders = activeIds.map(() => '?').join(', ')
  db.prepare(
    `UPDATE folders SET delete_yn = 'Y' WHERE project_id = ?${areaCondition} AND id NOT IN (${placeholders})`
  ).run(projectId, ...conditionParams, ...activeIds)

  refreshProjectProgress(projectId)
}

export const listFoldersByProject = (projectId: string): FolderRecord[] => {
  const db = getDatabase()

  return db
    .prepare(
      `
        SELECT id, project_id, title, path, description, area_type, sort_order, created_at, updated_at
        FROM folders
        WHERE project_id = ?
          AND delete_yn = 'N'
        ORDER BY area_type ASC, sort_order ASC, created_at ASC
      `
    )
    .all(projectId) as FolderRecord[]
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
  const db = getDatabase()
  const sortRow = db
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM captures WHERE folder_id = ?`)
    .get(payload.folderId) as { next_sort_order: number } | undefined

  db.prepare(
    `
      INSERT INTO captures (
        id, project_id, folder_id, file_name, image_path, source_url, page_title,
        menu_path, screen_description, functionality_description, writer_name, page_no, sort_order, is_selected
      )
      VALUES (
        @id, @projectId, @folderId, @fileName, @imagePath, @sourceUrl, @pageTitle,
        @menuPath, @screenDescription, @functionalityDescription, @writerName, @pageNo, @sortOrder, 0
      )
    `
  ).run({
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
  })

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
  const db = getDatabase()
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
  const sourceRows = db
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
          AND c.id IN (${placeholders})
        ORDER BY c.sort_order ASC, c.created_at ASC
      `
    )
    .all(payload.projectId, ...sourceIds) as CaptureRecord[]

  if (sourceRows.length === 0) {
    console.warn('[db/import] no source rows found', sourceIds)
    return []
  }

  console.log('[db/import] source rows', {
    rowCount: sourceRows.length,
    sourceRows
  })

  const nextSortOrderRow = db
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM captures WHERE folder_id = ?`)
    .get(payload.targetFolderId) as { next_sort_order: number } | undefined

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
