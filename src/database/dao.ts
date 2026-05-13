import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { unlink, writeFile } from 'fs/promises'
import path from 'path'
import { selectList, selectOne, runQuery, transaction } from './conn'
import { Doc, Project, Workspace } from './dto'
import dayjs from 'dayjs'

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

  const thumbnailName = `thumbnail_${target}_${id}.png`
  const thumbnailAbsPath = path.join(thumbnailsDir, thumbnailName)
  const thumbnailPath = path.join('FILE', 'Thumbnails', thumbnailName).replace(/\\/g, '/')

  writeFileSync(thumbnailAbsPath, Buffer.from(base64Data, 'base64'))
  return thumbnailPath
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
  const thumbnailPath =
    project.thumbnail === null
      ? ''
      : saveThumbnail('project', project.id as string | number, project.thumbnail)
  const query = `
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

  const payload = {
    updated_at: new Date().toISOString(),
    thumbnailPath,
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

  const result = runQuery(query, payload)
  const workspaceId = Number(result.lastInsertRowid)
  const thumbnailPath = saveThumbnail('workspace', workspaceId, workspace.thumbnail)

  if (thumbnailPath) {
    runQuery(
      `
        UPDATE t_workspace
        SET thumbnail_path = @thumbnailPath,
            updated_at = @updated_at
        WHERE id = @id
      `,
      {
        id: workspaceId,
        thumbnailPath,
        updated_at: now
      }
    )
  }

  return workspaceId
}

// 워크스페이스 수정
export const updateWorkspace = (workspace: Record<string, unknown>): void => {
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
    updated_at: new Date().toISOString(),
    thumbnailPath,
    ...workspace
  }

  runQuery(query, payload)
}

// 워크스페이스 삭제
export const deleteWorkspace = (id: string | number): void => {
  transaction((db) => {
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
  })
}

//프로젝트명 워크스페이스명 조회
export const getWorkspaceDetail = (id: string | number) => {
  const query = `
    SELECT
      w.id,
      w.name,
      w.project_id,
      w.latest_src_url,
      w.thumbnail_path,
      p.name as project_name
    FROM t_workspace w
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
      UPDATE t_workspace
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
  }

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

      const docImgName = `orgnImg_${docId}.png`
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

  return {
    id: docId,
    orgnImgPath
  }
}

//문서 조회
export const getDocList = (params: Record<string, unknown>) => {
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

  return selectList(query, queryParams)
}

//문서 내용 수정
export const updateDoc = (doc: Record<string, unknown>): void => {
  const query = `
    UPDATE t_doc
    SET title = @title,
        description = @description,
        doc_meta_json = @docMetaJson,
        updated_at = @updated_at
    WHERE id = @id
  `

  runQuery(query, {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    docMetaJson: doc.docMetaJson,
    updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
  })
}

export const updateDocStatus = (doc: Record<string, unknown>): void => {
  const query = `
    UPDATE t_doc
    SET status = @status,
        updated_at = @updated_at
    WHERE id = @id
  `

  runQuery(query, {
    id: doc.id,
    status: doc.status,
    updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
  })
}

const saveDrawImage = async (docId: number, drawDataUrl: string): Promise<string | null> => {
  const base64Data = drawDataUrl.replace(/^data:image\/\w+;base64,/, '')
  if (!base64Data) return null

  const docsDir = path.join(app.getPath('userData'), 'FILE', 'DOCS')
  mkdirSync(docsDir, { recursive: true })

  const drawImgName = `drawImg_${docId}.png`
  const drawImgAbsPath = path.join(docsDir, drawImgName)
  await writeFile(drawImgAbsPath, Buffer.from(base64Data, 'base64'))

  return path.join('FILE', 'DOCS', drawImgName).replace(/\\/g, '/')
}

//문서 어노테이션/기능 내용 수정
export const updateDocAnnotation = async (doc: Record<string, unknown>): Promise<void> => {
  const docId = Number(doc.id)
  const drawDataUrl = typeof doc.drawDataUrl === 'string' ? doc.drawDataUrl : ''
  const drawImgPath = drawDataUrl ? await saveDrawImage(docId, drawDataUrl) : null
  const query = `
    UPDATE t_doc
    SET content_json = @contentJson,
        annotation_json = @annotationJson,
        draw_img_path = COALESCE(@drawImgPath, draw_img_path),
        updated_at = @updated_at
    WHERE id = @id
  `

  runQuery(query, {
    id: docId,
    contentJson: doc.contentJson,
    annotationJson: doc.annotationJson,
    drawImgPath,
    updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
  })
}

//문서 삭제
export const deleteDoc = (id: string | number): void => {
  const query = `
    DELETE FROM t_doc
    WHERE id = @id
  `

  runQuery(query, { id })
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

  for (const doc of docs) {
    runQuery(query, {
      id: doc.id,
      sortOrder: doc.sortOrder,
      updated_at: now
    })
  }
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

  const copiedName = `${prefix}_${docId}.png`
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
    const maxSort = db
      .prepare(
        `
            SELECT COALESCE(MAX(sort_order), 0) AS sortOrder
            FROM t_doc
            WHERE workspace_id = @workspaceId
          `
      )
      .get({ workspaceId }) as { sortOrder: number }

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
        sortOrder: Number(maxSort.sortOrder ?? 0) + index + 1,
        updated_at: now
      })
    })
  })
}

export const copyDocs = (params: { docIds: number[]; workspaceId: number }): void => {
  const docIds = Array.isArray(params.docIds) ? params.docIds.map(Number).filter(Boolean) : []
  const workspaceId = Number(params.workspaceId)
  if (!docIds.length || !workspaceId) return

  transaction((db) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const maxSort = db
      .prepare(
        `
            SELECT COALESCE(MAX(sort_order), 0) AS sortOrder
            FROM t_doc
            WHERE workspace_id = @workspaceId
          `
      )
      .get({ workspaceId }) as { sortOrder: number }

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
        sortOrder: Number(maxSort.sortOrder ?? 0) + index + 1,
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
  })
}
