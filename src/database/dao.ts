import { app } from 'electron'
import type Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { selectList, selectOne, runQuery, transaction } from './conn'
import { Doc, Project, Workspace, type ProjectExportData, type SectionTreeInput } from './dto'
import dayjs from 'dayjs'
import { randomBytes } from 'crypto'

const makeHash = (): string => randomBytes(4).toString('hex')

const saveThumbnail = (
  target: 'project' | 'workspace',
  id: string | number,
  dataUrl: unknown
): string | null => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null

  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  if (!base64Data) return null

  const thumbnailsDir = path.join(app.getPath('userData'), 'FILE', 'Thumbnails')
  mkdirSync(thumbnailsDir, { recursive: true })

  const thumbnailName = `thumbnail_${target}_${makeHash()}_${id}.png`
  const thumbnailAbsPath = path.join(thumbnailsDir, thumbnailName)
  const thumbnailPath = path.join('FILE', 'Thumbnails', thumbnailName).replace(/\\/g, '/')

  writeFileSync(thumbnailAbsPath, Buffer.from(base64Data, 'base64'))
  return thumbnailPath
}

const resolveStoredFilePath = (filePath: string | null | undefined): string | null => {
  if (!filePath) return null

  const fileRootDir = path.join(app.getPath('userData'), 'FILE')
  const relativePath = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const absPath = path.resolve(app.getPath('userData'), relativePath)
  const resolvedBase = path.resolve(fileRootDir)
  const normalizedBase = resolvedBase + path.sep
  const isInsideBase = absPath === resolvedBase || absPath.startsWith(normalizedBase)

  if (!isInsideBase) {
    throw new Error(`Forbidden file path: ${filePath}`)
  }

  return absPath
}

const deleteStoredFile = (filePath: string | null | undefined): void => {
  const absPath = resolveStoredFilePath(filePath)
  if (absPath && existsSync(absPath)) {
    unlinkSync(absPath)
  }
}

const deleteStoredFiles = (filePaths: Array<string | null | undefined>): void => {
  Array.from(new Set(filePaths.filter(Boolean))).forEach((filePath) => deleteStoredFile(filePath))
}

const touchProject = (db: Database, projectId: string | number, updatedAt: string): void => {
  db.prepare(
    `
      UPDATE t_project
      SET updated_at = @updated_at
      WHERE id = @projectId
    `
  ).run({ projectId, updated_at: updatedAt })
}

const touchWorkspaceAndProject = (
  db: Database,
  workspaceId: string | number,
  updatedAt: string
): void => {
  db.prepare(
    `
      UPDATE t_workspace
      SET updated_at = @updated_at
      WHERE id = @workspaceId
    `
  ).run({ workspaceId, updated_at: updatedAt })

  db.prepare(
    `
      UPDATE t_project
      SET updated_at = @updated_at
      WHERE id = (
        SELECT project_id
        FROM t_workspace
        WHERE id = @workspaceId
      )
    `
  ).run({ workspaceId, updated_at: updatedAt })
}

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
      thumbnail_path,
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

export const getProjectExportData = (id: string | number): ProjectExportData | null => {
  return transaction((db) => {
    const project = db
      .prepare(
        `
          SELECT *
          FROM t_project
          WHERE id = @id
        `
      )
      .get({ id }) as Record<string, unknown> | undefined

    if (!project) return null

    const workspaces = db
      .prepare(
        `
          SELECT *
          FROM t_workspace
          WHERE project_id = @id
          ORDER BY id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    const captures = db
      .prepare(
        `
          SELECT c.*
          FROM t_capture c
          JOIN t_workspace w ON w.id = c.workspace_id
          WHERE w.project_id = @id
          ORDER BY c.id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    const docs = db
      .prepare(
        `
          SELECT d.*
          FROM t_doc d
          JOIN t_workspace w ON w.id = d.workspace_id
          WHERE w.project_id = @id
          ORDER BY d.workspace_id, d.sort_order, d.id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    const deliverables = db
      .prepare(
        `
          SELECT *
          FROM t_deliverable
          WHERE project_id = @id
          ORDER BY id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    const sections = db
      .prepare(
        `
          SELECT s.*
          FROM t_section s
          JOIN t_deliverable d ON d.id = s.deliverable_id
          WHERE d.project_id = @id
          ORDER BY s.deliverable_id, s.parent_id, s.sort_order, s.id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    const sectionDocs = db
      .prepare(
        `
          SELECT sd.*
          FROM t_section_doc sd
          JOIN t_section s ON s.id = sd.section_id
          JOIN t_deliverable d ON d.id = s.deliverable_id
          WHERE d.project_id = @id
          ORDER BY sd.section_id, sd.sort_order, sd.id
        `
      )
      .all({ id }) as Record<string, unknown>[]

    return {
      exported_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      project,
      workspaces,
      captures,
      docs,
      deliverables,
      sections,
      section_docs: sectionDocs
    }
  })
}
// 프로젝트 생성
export const createProject = (project: Record<string, unknown>): number => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const query = `
    INSERT INTO t_project (
      name,
      description,
      status,
      serv_url,
      thumbnail_path,
      delete_yn,
      created_at,
      updated_at
    )
    VALUES (
      @name,
      @description,
      @status,
      @serv_url,
      @thumbnail_path,
      @delete_yn,
      @created_at,
      @updated_at
    )
  `

  const payload = {
    status: '진행중',
    serv_url: '',
    thumbnail_path: '',
    delete_yn: '0',
    created_at: now,
    updated_at: now,
    ...project
  }

  const result = runQuery(query, payload)
  const projectId = Number(result.lastInsertRowid)
  const thumbnailPath = saveThumbnail('project', projectId, project.thumbnail)

  if (thumbnailPath) {
    runQuery(
      `
        UPDATE t_project
        SET thumbnail_path = @thumbnailPath,
            updated_at = @updated_at
        WHERE id = @id
      `,
      {
        id: projectId,
        thumbnailPath,
        updated_at: now
      }
    )
  }

  return projectId
}

// 프로젝트 수정
export const updateProject = (project: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const thumbnailPath =
    project.thumbnail === null
      ? ''
      : saveThumbnail('project', project.id as string | number, project.thumbnail)

  const payload = {
    updated_at: now,
    thumbnailPath,
    ...project
  }

  transaction((db) => {
    db.prepare(
      `
        UPDATE t_project
        SET
          name = @name,
          description = @description,
          serv_url = @serv_url,
          thumbnail_path = CASE
            WHEN @thumbnailPath IS NULL THEN thumbnail_path
            ELSE @thumbnailPath
          END,
          updated_at = @updated_at
        WHERE id = @id
      `
    ).run(payload)

    db.prepare(
      `
        UPDATE t_workspace
        SET
          latest_src_url = @serv_url,
          updated_at = @updated_at
        WHERE project_id = @id
          AND NOT EXISTS (
            SELECT 1
            FROM t_capture
            WHERE t_capture.workspace_id = t_workspace.id
          )
      `
    ).run(payload)
  })
}

export const updateProjectStatus = (project: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  runQuery(
    `
      UPDATE t_project
      SET
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `,
    {
      id: project.id,
      status: project.status,
      updated_at: now
    }
  )
}

// 프로젝트 삭제
export const deleteProject = (id: string | number): void => {
  const filePaths: string[] = []
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    const project = db
      .prepare(
        `
          SELECT thumbnail_path
          FROM t_project
          WHERE id = @id
        `
      )
      .get({ id }) as { thumbnail_path: string | null } | undefined
    if (project?.thumbnail_path) filePaths.push(project.thumbnail_path)

    const workspaces = db
      .prepare(
        `
          SELECT thumbnail_path, video_path
          FROM t_workspace
          WHERE project_id = @id
        `
      )
      .all({ id }) as Array<{ thumbnail_path: string | null; video_path: string | null }>
    workspaces.forEach((workspace) => {
      if (workspace.thumbnail_path) filePaths.push(workspace.thumbnail_path)
      if (workspace.video_path) filePaths.push(workspace.video_path)
    })

    const captures = db
      .prepare(
        `
          SELECT c.img_path
          FROM t_capture c
          JOIN t_workspace w ON w.id = c.workspace_id
          WHERE w.project_id = @id
        `
      )
      .all({ id }) as Array<{ img_path: string | null }>
    captures.forEach((capture) => {
      if (capture.img_path) filePaths.push(capture.img_path)
    })

    const docs = db
      .prepare(
        `
          SELECT d.orgn_img_path, d.draw_img_path
          FROM t_doc d
          JOIN t_workspace w ON w.id = d.workspace_id
          WHERE w.project_id = @id
        `
      )
      .all({ id }) as Array<{ orgn_img_path: string | null; draw_img_path: string | null }>
    docs.forEach((doc) => {
      if (doc.orgn_img_path) filePaths.push(doc.orgn_img_path)
      if (doc.draw_img_path) filePaths.push(doc.draw_img_path)
    })

    db.prepare(
      `
        DELETE FROM t_deliverable
        WHERE project_id = @id
      `
    ).run({ id })

    db.prepare(
      `
        DELETE FROM t_workspace
        WHERE project_id = @id
      `
    ).run({ id })

    db.prepare(
      `
        UPDATE t_project
        SET
          delete_yn = '1',
          updated_at = @updated_at
        WHERE id = @id
      `
    ).run({
      id,
      updated_at: now
    })
  })

  deleteStoredFiles(filePaths)
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
      video_path,
      video_origin_name,
      thumbnail_path,
      created_at,
      updated_at
    FROM t_workspace
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
  const project = selectOne<Project>(
    `
      SELECT
        id,
        name,
        description,
        status,
        serv_url,
        thumbnail_path,
        delete_yn,
        created_at,
        updated_at
      FROM t_project
      WHERE id = @id
    `,
    { id: workspace.project_id }
  )

  const query = `
    INSERT INTO t_workspace (
      project_id,
      name,
      latest_src_url,
      thumbnail_path,
      created_at,
      updated_at
    )
    VALUES (
      @project_id,
      @name,
      @latest_src_url,
      @thumbnail_path,
      @created_at,
      @updated_at
    )
  `

  const payload = {
    latest_src_url: project?.serv_url || '',
    thumbnail_path: '',
    created_at: now,
    updated_at: now,
    ...workspace
  }

  const workspaceId = transaction((db) => {
    const result = db.prepare(query).run(payload)
    const newWorkspaceId = Number(result.lastInsertRowid)
    const thumbnailPath = saveThumbnail('workspace', newWorkspaceId, workspace.thumbnail)

    if (thumbnailPath) {
      db.prepare(
        `
          UPDATE t_workspace
          SET thumbnail_path = @thumbnailPath,
              updated_at = @updated_at
          WHERE id = @id
        `
      ).run({
        id: newWorkspaceId,
        thumbnailPath,
        updated_at: now
      })
    }

    touchProject(db, workspace.project_id as string | number, now)
    return newWorkspaceId
  })

  return workspaceId
}

// 워크스페이스 수정
export const updateWorkspace = (workspace: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const thumbnailPath =
    workspace.thumbnail === null
      ? ''
      : saveThumbnail('workspace', workspace.id as string | number, workspace.thumbnail)
  const query = `
    UPDATE t_workspace
    SET
      name = @name,
      thumbnail_path = CASE
        WHEN @thumbnailPath IS NULL THEN thumbnail_path
        ELSE @thumbnailPath
      END,
      updated_at = @updated_at
    WHERE id = @id
  `

  const payload = {
    updated_at: now,
    thumbnailPath,
    ...workspace
  }

  transaction((db) => {
    db.prepare(query).run(payload)
    db.prepare(
      `
        UPDATE t_project
        SET updated_at = @updated_at
        WHERE id = (
          SELECT project_id
          FROM t_workspace
          WHERE id = @id
        )
      `
    ).run({ id: workspace.id, updated_at: now })
  })
}

export const updateWorkspaceVideo = (workspace: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE t_workspace
    SET video_path = @videoPath,
        video_origin_name = @videoOriginName,
        updated_at = @updated_at
    WHERE id = @id
  `

  transaction((db) => {
    db.prepare(query).run({
      id: workspace.id,
      videoPath: workspace.videoPath ?? '',
      videoOriginName: workspace.videoOriginName ?? '',
      updated_at: now
    })
    db.prepare(
      `
        UPDATE t_project
        SET updated_at = @updated_at
        WHERE id = (
          SELECT project_id
          FROM t_workspace
          WHERE id = @id
        )
      `
    ).run({ id: workspace.id, updated_at: now })
  })
}

// 워크스페이스 삭제
export const deleteWorkspace = (id: string | number): void => {
  const filePaths: string[] = []
  let projectId: number | null = null
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    const workspace = db
      .prepare(
        `
          SELECT project_id, thumbnail_path, video_path
          FROM t_workspace
          WHERE id = @id
        `
      )
      .get({ id }) as
      | { project_id: number; thumbnail_path: string | null; video_path: string | null }
      | undefined
    projectId = workspace?.project_id ?? null
    if (workspace?.thumbnail_path) filePaths.push(workspace.thumbnail_path)
    if (workspace?.video_path) filePaths.push(workspace.video_path)

    const captures = db
      .prepare(
        `
          SELECT img_path
          FROM t_capture
          WHERE workspace_id = @id
        `
      )
      .all({ id }) as Array<{ img_path: string | null }>
    captures.forEach((capture) => {
      if (capture.img_path) filePaths.push(capture.img_path)
    })

    const docs = db
      .prepare(
        `
          SELECT orgn_img_path, draw_img_path
          FROM t_doc
          WHERE workspace_id = @id
        `
      )
      .all({ id }) as Array<{ orgn_img_path: string | null; draw_img_path: string | null }>
    docs.forEach((doc) => {
      if (doc.orgn_img_path) filePaths.push(doc.orgn_img_path)
      if (doc.draw_img_path) filePaths.push(doc.draw_img_path)
    })

    db.prepare(
      `
        DELETE FROM t_doc
        WHERE workspace_id = @id
      `
    ).run({ id })

    db.prepare(
      `
        DELETE FROM t_capture
        WHERE workspace_id = @id
      `
    ).run({ id })

    db.prepare(
      `
        DELETE FROM t_workspace
        WHERE id = @id
      `
    ).run({ id })

    if (projectId) {
      touchProject(db, projectId, now)
    }
  })

  deleteStoredFiles(filePaths)
}

//프로젝트명 워크스페이스명 조회
export const getWorkspaceDetail = (id: string | number): Record<string, unknown> | null => {
  const query = `
    SELECT
      w.id,
      w.name,
      w.project_id,
      w.latest_src_url,
      w.video_path,
      w.video_origin_name,
      w.thumbnail_path,
      p.name as project_name
    FROM t_workspace w
    JOIN t_project p ON p.id = w.project_id
    WHERE w.id = @id
`

  return selectOne(query, { id })
}

//캡쳐 이미지 조회
export const getCaptureList = (params: Record<string, unknown>): Record<string, unknown>[] => {
  const query = `
    SELECT
      id,
      workspace_id,
      name,
      img_path,
      source_type,
      created_at
    FROM t_capture
    WHERE workspace_id = @workspaceId
      AND (@sourceType IS NULL OR source_type = @sourceType)
    ORDER BY id DESC
  `

  return selectList(query, {
    sourceType: null,
    ...params
  })
}

//캡쳐이미지 local & DB 저장
export const createCaptureWithImage = async (
  capture: Record<string, unknown>
): Promise<{ id: number; imgPath: string }> => {
  const workspaceId = String(capture.workspaceId ?? '')
  const name = String(capture.name ?? '')
  const dataUrl = String(capture.dataUrl ?? '')
  const currentUrl = String(capture.currentUrl ?? '')
  const sourceType = capture.sourceType === 'video' ? 'video' : 'web'
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const insertQuery = `
    INSERT INTO t_capture (workspace_id, name, img_path, source_type, created_at)
    VALUES (@workspaceId, @name, @imgPath, @sourceType, @created_at)
  `
  const insertResult = runQuery(insertQuery, {
    workspaceId,
    name,
    imgPath: null,
    sourceType,
    created_at: now
  })
  const captureId = Number(insertResult.lastInsertRowid)

  const capturesDir = path.join(app.getPath('userData'), 'FILE', 'CAPTURES')
  if (!existsSync(capturesDir)) {
    mkdirSync(capturesDir, { recursive: true })
  }

  const imgName = `captures_${makeHash()}_${captureId}.png`
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
  transaction((db) => {
    if (sourceType === 'web') {
      db.prepare(
        `
          UPDATE t_workspace
          SET latest_src_url = @latest_src_url,
              updated_at = @updated_at
          WHERE id = @id
        `
      ).run({
        id: workspaceId,
        latest_src_url: currentUrl,
        updated_at: now
      })
    }
    touchWorkspaceAndProject(db, workspaceId, now)
  })

  return {
    id: captureId,
    imgPath
  }
}

//캡쳐이름 수정
export const updateCaptureName = (capture: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE t_capture
    SET name = @name
    WHERE id = @id
  `

  transaction((db) => {
    db.prepare(query).run(capture)
    const row = db
      .prepare(
        `
          SELECT workspace_id
          FROM t_capture
          WHERE id = @id
        `
      )
      .get({ id: capture.id }) as { workspace_id: number } | undefined
    if (row?.workspace_id) {
      touchWorkspaceAndProject(db, row.workspace_id, now)
    }
  })
}

//캡쳐 삭제
export const deleteCapture = async (capture: Record<string, unknown>): Promise<void> => {
  const id = capture.id as string | number
  let imgPath = (capture.imgPath as string | null | undefined) ?? null
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    DELETE FROM t_capture
    WHERE id = @id
  `

  transaction((db) => {
    const row = db
      .prepare(
        `
          SELECT workspace_id, img_path
          FROM t_capture
          WHERE id = @id
        `
      )
      .get({ id }) as { workspace_id: number; img_path: string | null } | undefined
    imgPath = imgPath ?? row?.img_path ?? null

    db.prepare(query).run({ id })

    if (row?.workspace_id) {
      touchWorkspaceAndProject(db, row.workspace_id, now)
    }
  })

  deleteStoredFile(imgPath)
}

//문서 생성
export const createDoc = (doc: Record<string, unknown>): { id: number; orgnImgPath: string } => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    INSERT INTO t_doc (
      workspace_id,
      title,
      description,
      status,
      doc_meta_json,
      content_json,
      annotation_json,
      orgn_img_path,
      draw_img_path,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      @workspaceId,
      @title,
      @description,
      @status,
      @docMetaJson,
      @contentJson,
      @annotationJson,
      @orgnImgPath,
      @drawImgPath,
      @sortOrder,
      @created_at,
      @updated_at
    )
  `

  const payload = {
    description: '',
    status: '작업대기',
    docMetaJson: JSON.stringify({
      writer: '담당자',
      entry_path: ''
    }),
    contentJson: '[]',
    annotationJson: '[]',
    orgnImgPath: '',
    drawImgPath: '',
    sortOrder: 0,
    created_at: now,
    updated_at: now,
    ...doc
  } as Record<string, unknown>

  const result = runQuery(query, payload)
  const docId = Number(result.lastInsertRowid)
  const sourceImgPath = String(payload.orgnImgPath ?? '')
  let orgnImgPath = sourceImgPath

  if (sourceImgPath) {
    const fileRootDir = path.join(app.getPath('userData'), 'FILE')
    const docsDir = path.join(fileRootDir, 'DOCS')
    const relativePath = sourceImgPath.replace(/\\/g, '/').replace(/^\/+/, '')
    const sourceAbsPath = path.resolve(app.getPath('userData'), relativePath)
    const resolvedBase = path.resolve(fileRootDir)
    const normalizedBase = resolvedBase + path.sep
    const isInsideBase = sourceAbsPath === resolvedBase || sourceAbsPath.startsWith(normalizedBase)

    if (!isInsideBase) {
      throw new Error(`Forbidden file path: ${sourceImgPath}`)
    }

    if (existsSync(sourceAbsPath)) {
      if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true })
      }

      const docImgName = `orgnImg_${makeHash()}_${docId}.png`
      const docImgAbsPath = path.join(docsDir, docImgName)
      const docImgPath = path.join('FILE', 'DOCS', docImgName).replace(/\\/g, '/')

      copyFileSync(sourceAbsPath, docImgAbsPath)
      orgnImgPath = docImgPath
      runQuery(
        `
          UPDATE t_doc
          SET orgn_img_path = @orgnImgPath,
              updated_at = @updated_at
          WHERE id = @id
        `,
        {
          id: docId,
          orgnImgPath: docImgPath,
          updated_at: now
        }
      )
    }
  }

  transaction((db) => {
    touchWorkspaceAndProject(db, payload.workspaceId as string | number, now)
  })

  return {
    id: docId,
    orgnImgPath
  }
}

//문서 조회
export const getDocList = (params: Record<string, unknown>): Doc[] => {
  const queryParams = {
    id: null,
    workspaceId: null,
    ...params
  }

  const query = `
    SELECT
      id,
      workspace_id,
      title,
      description,
      status,
      doc_meta_json,
      content_json,
      annotation_json,
      orgn_img_path,
      draw_img_path,
      sort_order,
      created_at,
      updated_at
    FROM t_doc
    WHERE (@workspaceId IS NULL OR workspace_id = @workspaceId)
      AND (@id IS NULL OR id = @id)
    ORDER BY sort_order ASC, id ASC
  `

  return selectList<Doc>(query, queryParams)
}

//문서 내용 수정
export const updateDoc = (doc: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE t_doc
    SET title = @title,
        description = @description,
        doc_meta_json = @docMetaJson,
        updated_at = @updated_at
    WHERE id = @id
  `

  transaction((db) => {
    db.prepare(query).run({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      docMetaJson: doc.docMetaJson,
      updated_at: now
    })

    const row = db
      .prepare(
        `
          SELECT workspace_id
          FROM t_doc
          WHERE id = @id
        `
      )
      .get({ id: doc.id }) as { workspace_id: number } | undefined
    if (row?.workspace_id) {
      touchWorkspaceAndProject(db, row.workspace_id, now)
    }
  })
}

export const updateDocStatus = (doc: Record<string, unknown>): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE t_doc
    SET status = @status,
        updated_at = @updated_at
    WHERE id = @id
  `

  transaction((db) => {
    db.prepare(query).run({
      id: doc.id,
      status: doc.status,
      updated_at: now
    })

    const row = db
      .prepare(
        `
          SELECT workspace_id
          FROM t_doc
          WHERE id = @id
        `
      )
      .get({ id: doc.id }) as { workspace_id: number } | undefined
    if (row?.workspace_id) {
      touchWorkspaceAndProject(db, row.workspace_id, now)
    }
  })
}

const saveDrawImage = async (docId: number, drawDataUrl: string): Promise<string | null> => {
  const base64Data = drawDataUrl.replace(/^data:image\/\w+;base64,/, '')
  if (!base64Data) return null

  const docsDir = path.join(app.getPath('userData'), 'FILE', 'DOCS')
  mkdirSync(docsDir, { recursive: true })

  const drawImgName = `drawImg_${makeHash()}_${docId}.png`
  const drawImgAbsPath = path.join(docsDir, drawImgName)
  await writeFile(drawImgAbsPath, Buffer.from(base64Data, 'base64'))

  return path.join('FILE', 'DOCS', drawImgName).replace(/\\/g, '/')
}

//문서 어노테이션/기능 내용 수정
export const updateDocAnnotation = async (doc: Record<string, unknown>): Promise<void> => {
  const docId = Number(doc.id)
  const drawDataUrl = typeof doc.drawDataUrl === 'string' ? doc.drawDataUrl : ''
  const drawImgPath = drawDataUrl ? await saveDrawImage(docId, drawDataUrl) : null
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE t_doc
    SET content_json = @contentJson,
        annotation_json = @annotationJson,
        draw_img_path = COALESCE(@drawImgPath, draw_img_path),
        updated_at = @updated_at
    WHERE id = @id
  `

  transaction((db) => {
    db.prepare(query).run({
      id: docId,
      contentJson: doc.contentJson,
      annotationJson: doc.annotationJson,
      drawImgPath,
      updated_at: now
    })

    const row = db
      .prepare(
        `
          SELECT workspace_id
          FROM t_doc
          WHERE id = @id
        `
      )
      .get({ id: docId }) as { workspace_id: number } | undefined
    if (row?.workspace_id) {
      touchWorkspaceAndProject(db, row.workspace_id, now)
    }
  })
}

//문서 삭제
export const deleteDoc = (id: string | number): void => {
  let workspaceId: number | null = null
  const filePaths: string[] = []
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    DELETE FROM t_doc
    WHERE id = @id
  `

  transaction((db) => {
    const row = db
      .prepare(
        `
          SELECT workspace_id, orgn_img_path, draw_img_path
          FROM t_doc
          WHERE id = @id
        `
      )
      .get({ id }) as
      | { workspace_id: number; orgn_img_path: string | null; draw_img_path: string | null }
      | undefined
    workspaceId = row?.workspace_id ?? null
    if (row?.orgn_img_path) filePaths.push(row.orgn_img_path)
    if (row?.draw_img_path) filePaths.push(row.draw_img_path)

    db.prepare(query).run({ id })

    if (workspaceId) {
      touchWorkspaceAndProject(db, workspaceId, now)
    }
  })

  deleteStoredFiles(filePaths)
}

//문서 정렬 순서 수정
export const updateDocSortOrders = (docs: Array<{ id: number; sortOrder: number }>): void => {
  const query = `
    UPDATE t_doc
    SET sort_order = @sortOrder,
        updated_at = @updated_at
    WHERE id = @id
  `
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    const touchedWorkspaceIds = new Set<number>()

    for (const doc of docs) {
      db.prepare(query).run({
        id: doc.id,
        sortOrder: doc.sortOrder,
        updated_at: now
      })

      const row = db
        .prepare(
          `
            SELECT workspace_id
            FROM t_doc
            WHERE id = @id
          `
        )
        .get({ id: doc.id }) as { workspace_id: number } | undefined
      if (row?.workspace_id) touchedWorkspaceIds.add(row.workspace_id)
    }

    touchedWorkspaceIds.forEach((workspaceId) => {
      touchWorkspaceAndProject(db, workspaceId, now)
    })
  })
}

const copyDocFile = (docId: number, imgPath: string, prefix: 'orgnImg' | 'drawImg'): string => {
  if (!imgPath) return ''

  const fileRootDir = path.join(app.getPath('userData'), 'FILE')
  const docsDir = path.join(fileRootDir, 'DOCS')
  const relativePath = imgPath.replace(/\\/g, '/').replace(/^\/+/, '')
  const sourceAbsPath = path.resolve(app.getPath('userData'), relativePath)
  const resolvedBase = path.resolve(fileRootDir)
  const normalizedBase = resolvedBase + path.sep
  const isInsideBase = sourceAbsPath === resolvedBase || sourceAbsPath.startsWith(normalizedBase)

  if (!isInsideBase) {
    throw new Error(`Forbidden file path: ${imgPath}`)
  }

  if (!existsSync(sourceAbsPath)) return ''
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true })
  }

  const copiedName = `${prefix}_${makeHash()}_${docId}.png`
  const copiedAbsPath = path.join(docsDir, copiedName)
  const copiedPath = path.join('FILE', 'DOCS', copiedName).replace(/\\/g, '/')

  copyFileSync(sourceAbsPath, copiedAbsPath)
  return copiedPath
}

export const moveDocs = (params: { docIds: number[]; workspaceId: number }): void => {
  const docIds = Array.isArray(params.docIds) ? params.docIds.map(Number).filter(Boolean) : []
  const workspaceId = Number(params.workspaceId)
  if (!docIds.length || !workspaceId) return

  transaction((db) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const oldWorkspaceIds = db
      .prepare(
        `
          SELECT DISTINCT workspace_id
          FROM t_doc
          WHERE id IN (${docIds.map(() => '?').join(',')})
        `
      )
      .all(...docIds) as Array<{ workspace_id: number }>
    db.prepare(
      `
        UPDATE t_doc
        SET sort_order = sort_order + @offset
        WHERE workspace_id = @workspaceId
      `
    ).run({
      workspaceId,
      offset: docIds.length
    })

    const update = db.prepare(`
      UPDATE t_doc
      SET workspace_id = @workspaceId,
          sort_order = @sortOrder,
          updated_at = @updated_at
      WHERE id = @id
    `)

    docIds.forEach((id, index) => {
      update.run({
        id,
        workspaceId,
        sortOrder: index + 1,
        updated_at: now
      })
    })

    oldWorkspaceIds.forEach((row) => {
      if (row.workspace_id) touchWorkspaceAndProject(db, row.workspace_id, now)
    })
    touchWorkspaceAndProject(db, workspaceId, now)
  })
}

export const copyDocs = (params: { docIds: number[]; workspaceId: number }): void => {
  const docIds = Array.isArray(params.docIds) ? params.docIds.map(Number).filter(Boolean) : []
  const workspaceId = Number(params.workspaceId)
  if (!docIds.length || !workspaceId) return

  transaction((db) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare(
      `
        UPDATE t_doc
        SET sort_order = sort_order + @offset
        WHERE workspace_id = @workspaceId
      `
    ).run({
      workspaceId,
      offset: docIds.length
    })

    const selectDoc = db.prepare(`
      SELECT
        id,
        workspace_id,
        title,
        description,
        status,
        doc_meta_json,
        content_json,
        annotation_json,
        orgn_img_path,
        draw_img_path,
        sort_order,
        created_at,
        updated_at
      FROM t_doc
      WHERE id = @id
    `)

    const insertDoc = db.prepare(`
      INSERT INTO t_doc (
        workspace_id,
        title,
        description,
        status,
        doc_meta_json,
        content_json,
        annotation_json,
        orgn_img_path,
        draw_img_path,
        sort_order,
        created_at,
        updated_at
      )
      VALUES (
        @workspaceId,
        @title,
        @description,
        @status,
        @docMetaJson,
        @contentJson,
        @annotationJson,
        '',
        '',
        @sortOrder,
        @created_at,
        @updated_at
      )
    `)

    const updateImages = db.prepare(`
      UPDATE t_doc
      SET orgn_img_path = @orgnImgPath,
          draw_img_path = @drawImgPath,
          updated_at = @updated_at
      WHERE id = @id
    `)

    docIds.forEach((id, index) => {
      const doc = selectDoc.get({ id }) as Doc | undefined
      if (!doc) return

      const result = insertDoc.run({
        workspaceId,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        docMetaJson: doc.doc_meta_json,
        contentJson: doc.content_json,
        annotationJson: doc.annotation_json,
        sortOrder: index + 1,
        created_at: now,
        updated_at: now
      })

      const newDocId = Number(result.lastInsertRowid)
      const orgnImgPath = copyDocFile(newDocId, doc.orgn_img_path, 'orgnImg')
      const drawImgPath = copyDocFile(newDocId, doc.draw_img_path, 'drawImg')

      updateImages.run({
        id: newDocId,
        orgnImgPath,
        drawImgPath,
        updated_at: now
      })
    })

    touchWorkspaceAndProject(db, workspaceId, now)
  })
}

// 산출물 목록 조회
export const getDeliverableList = (params: { projectId: number }): Record<string, unknown>[] => {
  const query = `
    SELECT
      id,
      project_id,
      title,
      created_at,
      updated_at
    FROM t_deliverable
    WHERE project_id = @projectId
    ORDER BY updated_at DESC, id DESC
  `

  return selectList(query, params)
}

// 산출물 생성
export const createDeliverable = (params: {
  projectId: number
  title: string
  sourceDeliverableId?: number
}): number => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const result = transaction((db) => {
    const insertResult = db
      .prepare(
        `
        INSERT INTO t_deliverable (
          project_id,
          title,
          created_at,
          updated_at
        )
        VALUES (
          @projectId,
          @title,
          @created_at,
          @updated_at
        )
      `
      )
      .run({
        projectId: params.projectId,
        title: params.title,
        created_at: now,
        updated_at: now
      })

    const newDeliverableId = Number(insertResult.lastInsertRowid)
    const sourceDeliverableId = Number(params.sourceDeliverableId ?? 0)

    if (sourceDeliverableId) {
      const sourceSections = db
        .prepare(
          `
            SELECT id, parent_id, name, sort_order
            FROM t_section
            WHERE deliverable_id = @sourceDeliverableId
            ORDER BY parent_id IS NOT NULL ASC, sort_order ASC, id ASC
          `
        )
        .all({ sourceDeliverableId }) as Array<{
        id: number
        parent_id: number | null
        name: string
        sort_order: number
      }>

      const insertSection = db.prepare(
        `
          INSERT INTO t_section (
            deliverable_id,
            parent_id,
            name,
            sort_order,
            created_at,
            updated_at
          )
          VALUES (
            @deliverableId,
            @parentId,
            @name,
            @sortOrder,
            @created_at,
            @updated_at
          )
        `
      )

      const insertSectionDoc = db.prepare(
        `
          INSERT INTO t_section_doc (
            section_id,
            doc_id,
            sort_order,
            created_at
          )
          VALUES (
            @sectionId,
            @docId,
            @sortOrder,
            @created_at
          )
        `
      )

      const sectionIdMap = new Map<number, number>()
      const insertCopiedSections = (
        parentId: number | null,
        copiedParentId: number | null
      ): void => {
        sourceSections
          .filter((section) => section.parent_id === parentId)
          .forEach((section) => {
            const sectionResult = insertSection.run({
              deliverableId: newDeliverableId,
              parentId: copiedParentId,
              name: section.name,
              sortOrder: section.sort_order,
              created_at: now,
              updated_at: now
            })
            const copiedSectionId = Number(sectionResult.lastInsertRowid)

            sectionIdMap.set(section.id, copiedSectionId)
            insertCopiedSections(section.id, copiedSectionId)
          })
      }

      insertCopiedSections(null, null)

      const sourceSectionDocs = db
        .prepare(
          `
            SELECT sd.section_id, sd.doc_id, sd.sort_order
            FROM t_section_doc sd
            JOIN t_section s ON s.id = sd.section_id
            WHERE s.deliverable_id = @sourceDeliverableId
            ORDER BY sd.sort_order ASC, sd.id ASC
          `
        )
        .all({ sourceDeliverableId }) as Array<{
        section_id: number
        doc_id: number
        sort_order: number
      }>

      sourceSectionDocs.forEach((sectionDoc) => {
        const copiedSectionId = sectionIdMap.get(sectionDoc.section_id)
        if (!copiedSectionId) return

        insertSectionDoc.run({
          sectionId: copiedSectionId,
          docId: sectionDoc.doc_id,
          sortOrder: sectionDoc.sort_order,
          created_at: now
        })
      })
    }

    touchProject(db, params.projectId, now)
    return insertResult
  })

  return Number(result.lastInsertRowid)
}

// 산출물 제목 수정
export const updateDeliverableTitle = (params: { id: number; title: string }): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    db.prepare(
      `
        UPDATE t_deliverable
        SET title = @title,
            updated_at = @updated_at
        WHERE id = @id
      `
    ).run({
      id: params.id,
      title: params.title,
      updated_at: now
    })

    const row = db
      .prepare(
        `
          SELECT project_id
          FROM t_deliverable
          WHERE id = @id
        `
      )
      .get({ id: params.id }) as { project_id: number } | undefined
    if (row?.project_id) {
      touchProject(db, row.project_id, now)
    }
  })
}

// 산출물 삭제
export const deleteDeliverable = (id: number): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    const row = db
      .prepare(
        `
          SELECT project_id
          FROM t_deliverable
          WHERE id = @id
        `
      )
      .get({ id }) as { project_id: number } | undefined

    db.prepare(
      `
        DELETE FROM t_deliverable
        WHERE id = @id
      `
    ).run({ id })

    if (row?.project_id) {
      touchProject(db, row.project_id, now)
    }
  })
}

// 산출물 상세 조회
export const getDeliverableDetail = (id: number): Record<string, unknown> | null => {
  return selectOne(
    `
      SELECT
        id,
        project_id,
        title,
        created_at,
        updated_at
      FROM t_deliverable
      WHERE id = @id
    `,
    { id }
  )
}

// 산출물 카테고리/문서 배치 조회
export const getDeliverableStructure = (params: {
  deliverableId: number
}): { sections: Record<string, unknown>[]; sectionDocs: Record<string, unknown>[] } => {
  const sections = selectList(
    `
      SELECT
        id,
        deliverable_id,
        parent_id,
        name,
        sort_order,
        created_at,
        updated_at
      FROM t_section
      WHERE deliverable_id = @deliverableId
      ORDER BY sort_order ASC, id ASC
    `,
    params
  )

  const sectionDocs = selectList(
    `
      SELECT
        sd.id,
        sd.section_id,
        sd.doc_id,
        sd.sort_order,
        sd.created_at,
        d.workspace_id,
        d.title,
        d.description,
        d.status,
        d.doc_meta_json,
        d.content_json,
        d.annotation_json,
        d.orgn_img_path,
        d.draw_img_path,
        d.updated_at
      FROM t_section_doc sd
      JOIN t_doc d ON d.id = sd.doc_id
      JOIN t_section s ON s.id = sd.section_id
      WHERE s.deliverable_id = @deliverableId
      ORDER BY sd.sort_order ASC, sd.id ASC
    `,
    params
  )

  return { sections, sectionDocs }
}

const getOriginalDocId = (id: string): number => {
  const originalId = id.split('-copy-')[0]
  return Number(originalId)
}

// 산출물 카테고리/문서 배치 저장
export const saveDeliverableStructure = (params: {
  deliverableId: number
  sections: SectionTreeInput[]
}): void => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  transaction((db) => {
    db.prepare(
      `
        DELETE FROM t_section_doc
        WHERE section_id IN (
          SELECT id
          FROM t_section
          WHERE deliverable_id = @deliverableId
        )
      `
    ).run({ deliverableId: params.deliverableId })

    db.prepare(
      `
        DELETE FROM t_section
        WHERE deliverable_id = @deliverableId
      `
    ).run({ deliverableId: params.deliverableId })

    const insertSection = db.prepare(
      `
        INSERT INTO t_section (
          deliverable_id,
          parent_id,
          name,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (
          @deliverableId,
          @parentId,
          @name,
          @sortOrder,
          @created_at,
          @updated_at
        )
      `
    )

    const insertSectionDoc = db.prepare(
      `
        INSERT INTO t_section_doc (
          section_id,
          doc_id,
          sort_order,
          created_at
        )
        VALUES (
          @sectionId,
          @docId,
          @sortOrder,
          @created_at
        )
      `
    )

    const insertCategories = (sections: SectionTreeInput[], parentId: number | null): void => {
      sections.forEach((section, sectionIndex) => {
        const result = insertSection.run({
          deliverableId: params.deliverableId,
          parentId,
          name: section.name,
          sortOrder: sectionIndex + 1,
          created_at: now,
          updated_at: now
        })
        const sectionId = Number(result.lastInsertRowid)

        section.docs.forEach((doc, docIndex) => {
          if (doc.kind !== 'document') return

          const docId = getOriginalDocId(doc.doc_id)
          if (!docId) return

          insertSectionDoc.run({
            sectionId,
            docId,
            sortOrder: docIndex + 1,
            created_at: now
          })
        })

        insertCategories(section.children ?? [], sectionId)
      })
    }

    insertCategories(params.sections, null)

    db.prepare(
      `
        UPDATE t_deliverable
        SET updated_at = @updated_at
        WHERE id = @id
      `
    ).run({
      id: params.deliverableId,
      updated_at: now
    })

    const row = db
      .prepare(
        `
          SELECT project_id
          FROM t_deliverable
          WHERE id = @id
        `
      )
      .get({ id: params.deliverableId }) as { project_id: number } | undefined
    if (row?.project_id) {
      touchProject(db, row.project_id, now)
    }
  })
}
