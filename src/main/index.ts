import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  protocol,
  net,
  nativeTheme
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
<<<<<<< HEAD
import {
  closeDatabase,
  deleteProject,
  copyCapturesToFolder,
  deleteCapture,
  getLastCaptureUrlByFolderId,
  getDatabasePath,
  getProjectById,
  getProjectWorkspace,
  initDatabase,
  insertCapture,
  listCapturesByProject,
  listProjects,
  markDeletedFolders,
  replaceCaptureAnnotations,
  updateProject,
  updateCaptureMetadata,
  updateCaptureSelections,
  updateCaptureSortOrders,
  upsertFolder,
  upsertProject
} from './db/database'
=======
import { initDatabase, closeDatabase } from '../database/conn'
import * as DAO from '../database/dao'
import type { ProjectExportData } from '../database/dto'
import ffmpegStaticPath from 'ffmpeg-static'
import path from 'path'
import { pathToFileURL } from 'url'
import { createReadStream, existsSync, mkdirSync, statSync } from 'fs'
import { readdir, readFile, unlink, writeFile } from 'fs/promises'
import { execFile } from 'child_process'
import { createRequire } from 'module'
import { Readable } from 'stream'
import { randomBytes } from 'crypto'
>>>>>>> feature/deliverable-design

const IMG_SCHEME = 'appimg'
const require = createRequire(import.meta.url)

const VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.webm', '.mov'])

const resolveFfmpegPath = (): string => {
  const candidatePaths = [
    typeof ffmpegStaticPath === 'string' ? ffmpegStaticPath : '',
    (() => {
      try {
        return require('ffmpeg-static') as string
      } catch {
        return ''
      }
    })(),
    path.join(
      process.cwd(),
      'node_modules',
      'ffmpeg-static',
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    )
  ]

  return candidatePaths.find((candidatePath) => candidatePath && existsSync(candidatePath)) ?? 'ffmpeg'
}

interface ManualExportPayload {
  defaultFileName: string
  html: string
}

interface FfmpegExtractFramePayload {
  videoPath: string
  second: number
}

interface FfmpegCreatePreviewPayload {
  videoPath: string
  workspaceId?: string | number
}

interface ManualExportFile {
  path: string
  content: string
  encoding?: 'utf-8' | 'base64'
}

interface ManualHtmlZipExportPayload {
  defaultFileName: string
  files: ManualExportFile[]
}

interface ExportResult {
  canceled: boolean
  filePath?: string
}

interface ProjectExportPayload {
  projectId: string | number
  defaultFileName?: string
}

interface ProjectImportResult {
  canceled: boolean
  projectId?: number
}

const getCrc32Table = (): number[] => {
  const table: number[] = []

  for (let index = 0; index < 256; index += 1) {
    let crc = index
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    table[index] = crc >>> 0
  }

  return table
}

const CRC32_TABLE = getCrc32Table()

const getCrc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const createZipBuffer = (files: { name: string; content: Buffer }[]): Buffer => {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name)
    const crc32 = getCrc32(file.content)
    const localHeader = Buffer.alloc(30)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(0, 12)
    localHeader.writeUInt32LE(crc32, 14)
    localHeader.writeUInt32LE(file.content.length, 18)
    localHeader.writeUInt32LE(file.content.length, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, nameBuffer, file.content)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0, 14)
    centralHeader.writeUInt32LE(crc32, 16)
    centralHeader.writeUInt32LE(file.content.length, 20)
    centralHeader.writeUInt32LE(file.content.length, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, nameBuffer)

    offset += localHeader.length + nameBuffer.length + file.content.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.alloc(22)
  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(0, 4)
  endRecord.writeUInt16LE(0, 6)
  endRecord.writeUInt16LE(files.length, 8)
  endRecord.writeUInt16LE(files.length, 10)
  endRecord.writeUInt32LE(centralDirectory.length, 12)
  endRecord.writeUInt32LE(offset, 16)
  endRecord.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

const readStoredZipEntries = (zipBuffer: Buffer): Record<string, Buffer> => {
  const entries: Record<string, Buffer> = {}
  let offset = 0

  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset)
    if (signature === 0x02014b50 || signature === 0x06054b50) break
    if (signature !== 0x04034b50) {
      throw new Error('지원하지 않는 프로젝트 파일 형식입니다.')
    }

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8)
    const compressedSize = zipBuffer.readUInt32LE(offset + 18)
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26)
    const extraLength = zipBuffer.readUInt16LE(offset + 28)
    const fileNameStart = offset + 30
    const fileNameEnd = fileNameStart + fileNameLength
    const contentStart = fileNameEnd + extraLength
    const contentEnd = contentStart + compressedSize

    if (compressionMethod !== 0 || contentEnd > zipBuffer.length) {
      throw new Error('지원하지 않는 프로젝트 파일 형식입니다.')
    }

    const entryName = zipBuffer.subarray(fileNameStart, fileNameEnd).toString('utf-8')
    if (entryName && !entryName.endsWith('/')) {
      entries[entryName] = zipBuffer.subarray(contentStart, contentEnd)
    }

    offset = contentEnd
  }

  return entries
}

const readProjectImportBundle = (zipBuffer: Buffer): {
  data: ProjectExportData
  assets: Record<string, Buffer>
} => {
  const entries = readStoredZipEntries(zipBuffer)
  const dataEntry = entries['data.json']
  if (!dataEntry) {
    throw new Error('프로젝트 데이터 파일을 찾을 수 없습니다.')
  }

  const data = JSON.parse(dataEntry.toString('utf-8')) as ProjectExportData
  if (
    !data.project ||
    !Array.isArray(data.workspaces) ||
    !Array.isArray(data.captures) ||
    !Array.isArray(data.docs) ||
    !Array.isArray(data.deliverables) ||
    !Array.isArray(data.sections) ||
    !Array.isArray(data.section_docs)
  ) {
    throw new Error('프로젝트 데이터 형식이 올바르지 않습니다.')
  }

  const assets: Record<string, Buffer> = {}
  Object.entries(entries).forEach(([entryName, content]) => {
    const normalizedName = entryName.replace(/\\/g, '/').replace(/^\/+/, '')
    if (!normalizedName.startsWith('assets/FILE/')) return

    const storedPath = normalizedName.replace(/^assets\//, '')
    if (storedPath.split('/').some((segment) => segment === '..')) return
    assets[storedPath] = content
  })

  return { data, assets }
}

const getSafeExportFileName = (fileName: string): string => {
  const safeName = fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .split('')
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

  return safeName || 'project-export'
}

const getStoredAssetPath = (filePath: unknown): string | null => {
  if (typeof filePath !== 'string' || !filePath) return null

  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalizedPath.startsWith('FILE/')) return null
  if (normalizedPath.split('/').some((segment) => segment === '..')) return null

  return normalizedPath
}

const collectProjectAssetPaths = (data: ProjectExportData): string[] => {
  const paths = new Set<string>()
  const addPath = (filePath: unknown): void => {
    const normalizedPath = getStoredAssetPath(filePath)
    if (normalizedPath) paths.add(normalizedPath)
  }

  addPath(data.project.thumbnail_path)
  data.workspaces.forEach((workspace) => {
    addPath(workspace.thumbnail_path)
    addPath(workspace.video_path)
  })
  data.captures.forEach((capture) => {
    addPath(capture.img_path)
  })
  data.docs.forEach((doc) => {
    addPath(doc.orgn_img_path)
    addPath(doc.draw_img_path)
  })

  return Array.from(paths)
}

const buildProjectExportZip = async (data: ProjectExportData): Promise<Buffer> => {
  const files: { name: string; content: Buffer }[] = [
    {
      name: 'data.json',
      content: Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
    }
  ]

  for (const assetPath of collectProjectAssetPaths(data)) {
    const absPath = path.join(app.getPath('userData'), assetPath)
    if (!existsSync(absPath)) continue

    files.push({
      name: path.posix.join('assets', assetPath),
      content: await readFile(absPath)
    })
  }

  return createZipBuffer(files)
}

//Light 테마 고정
nativeTheme.themeSource = 'light'

protocol.registerSchemesAsPrivileged([
  {
    scheme: IMG_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-attach-webview', (_event, guestContents) => {
    console.log('webview attached')
    guestContents.setWindowOpenHandler(({ url }) => {
      console.log('popup url from guest', url)
      mainWindow.webContents.send('capture:webviewWindowOpen', { url })
      return { action: 'deny' }
    })
  })
  
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerGlobalShortcut(keyset: string, eventReceiver: string): void {
  const isRegistered = globalShortcut.isRegistered(keyset)
  if (isRegistered) {
    globalShortcut.unregister(keyset)
  }

  globalShortcut.register(keyset, () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    focusedWindow?.webContents.send(eventReceiver)
  })
}

function unregisterShortcut(keyset: string): void {
  const isRegistered = globalShortcut.isRegistered(keyset)
  if (!isRegistered) return
  globalShortcut.unregister(keyset)
}

  

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  initDatabase()

  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() !== 'webview') return

    contents.setWindowOpenHandler((details) => {
      if (details.url) {
        contents.loadURL(details.url)
      }

      return { action: 'deny' }
    })
  })

    //파일 경로
    const getFileStoragePaths = (): {
      userDataDir: string
      fileRootDir: string
      capturesDir: string
      docsDir: string
      thumbnailsDir: string
      videoDir: string
    } => {
      const userDataDir = app.getPath('userData')
      const fileRootDir = path.join(userDataDir, 'FILE')
    
      return {
        userDataDir,
        fileRootDir,
        capturesDir: path.join(fileRootDir, 'CAPTURES'),
        docsDir: path.join(fileRootDir, 'DOCS'),
        thumbnailsDir: path.join(fileRootDir, 'Thumbnails'),
        videoDir: path.join(fileRootDir, 'VIDEO')
      }
    }

    
  //local 폴더 생성
  const ensureFileStorageDirs = (): void => {
    const { fileRootDir, capturesDir, docsDir, thumbnailsDir, videoDir } =
      getFileStoragePaths()
  
    for (const dir of [fileRootDir, capturesDir, docsDir, thumbnailsDir, videoDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }

  const makeHash = (): string => randomBytes(4).toString('hex')

  const resolveAppFilePath = (filePath: string): string => {
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
    if (path.isAbsolute(filePath)) return filePath
    if (!normalizedPath.startsWith('FILE/')) return filePath

    return path.join(app.getPath('userData'), normalizedPath)
  }

  const removeOldWorkspaceVideos = async (
    videoDir: string,
    workspaceId: string,
    keepPath: string
  ): Promise<void> => {
    if (!workspaceId || !existsSync(videoDir)) return

    const files = await readdir(videoDir)
    await Promise.all(
      files
        .filter((file) => file.startsWith('video_') && file.endsWith(`_${workspaceId}.mp4`))
        .map((file) => path.join(videoDir, file))
        .filter((filePath) => path.resolve(filePath) !== path.resolve(keepPath))
        .map((filePath) => unlink(filePath).catch(() => undefined))
    )
  }

  ensureFileStorageDirs()


  protocol.handle(IMG_SCHEME, (request) => {
    try {
      const url = new URL(request.url)
      const { userDataDir } = getFileStoragePaths()
      
      const rawPath =
        url.hostname && url.pathname && url.pathname !== '/'
          ? `${url.hostname}${url.pathname}`
          : url.pathname && url.pathname !== '/'
            ? url.pathname
            : url.hostname
      const relativePath = decodeURIComponent(rawPath).replace(/^\/+/, '').replace(/\\/g, '/')

      if (!relativePath) {
        return new Response('Bad Request', { status: 400 })
      }

      const absPath = path.resolve(userDataDir, relativePath)
      const resolvedBase = path.resolve(userDataDir)
      const normalizedBase = resolvedBase + path.sep
      const isInsideBase = absPath === resolvedBase || absPath.startsWith(normalizedBase)

      if (!isInsideBase) {
        return new Response('Forbidden', { status: 403 })
      }

      if (!existsSync(absPath)) {
        return new Response('Not Found', { status: 404 })
      }

      const extension = path.extname(absPath).toLowerCase()
      if (VIDEO_EXTENSIONS.has(extension)) {
        const fileSize = statSync(absPath).size
        const range = request.headers.get('range')
        const contentType = extension === '.webm' ? 'video/webm' : 'video/mp4'

        if (range) {
          const match = /^bytes=(\d+)-(\d*)$/.exec(range)
          const start = match ? Number(match[1]) : 0
          const end = match?.[2] ? Number(match[2]) : fileSize - 1
          const chunkSize = end - start + 1
          const stream = createReadStream(absPath, { start, end })

          return new Response(Readable.toWeb(stream) as ReadableStream, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(chunkSize),
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes'
            }
          })
        }

        const stream = createReadStream(absPath)
        return new Response(Readable.toWeb(stream) as ReadableStream, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(fileSize),
            'Accept-Ranges': 'bytes'
          }
        })
      }

      return net.fetch(pathToFileURL(absPath).toString())
    } catch (error) {
      console.error('Failed to handle protocol:', error)
      return new Response('Not Found', { status: 404 })
    }
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.handle(
    'dialog:openFile',
    async (
      _,
      options?: {
        filters?: Electron.FileFilter[]
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
      }
    ) => {
      const result = await dialog.showOpenDialog({
        properties: options?.properties ?? ['openFile'],
        filters: options?.filters ?? [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
        ]
      })
      return result
    }
  )

  ipcMain.handle(
    'ffmpeg:extractFrame',
    async (
      _,
      payload: FfmpegExtractFramePayload
    ): Promise<{ dataUrl: string | null; error?: string }> => {
      const videoPath = resolveAppFilePath(payload.videoPath)
      const second = Number.isFinite(payload.second) ? Math.max(0, payload.second) : 0
      if (!videoPath || !existsSync(videoPath)) {
        return { dataUrl: null, error: '동영상 파일 경로를 찾을 수 없습니다.' }
      }

      const outputPath = path.join(app.getPath('temp'), `miso-video-frame-${Date.now()}.png`)
      const ffmpegPath = resolveFfmpegPath()

      try {
        await new Promise<void>((resolve, reject) => {
          execFile(
            ffmpegPath,
            ['-y', '-i', videoPath, '-ss', String(second), '-frames:v', '1', outputPath],
            { windowsHide: true, timeout: 30000 },
            (error) => {
              if (error) {
                reject(error)
                return
              }
              resolve()
            }
          )
        })

        const frameBuffer = await readFile(outputPath)
        return { dataUrl: `data:image/png;base64,${frameBuffer.toString('base64')}` }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const isMissingFfmpeg = /ENOENT|not recognized|spawn ffmpeg/i.test(message)

        return {
          dataUrl: null,
          error: isMissingFfmpeg
            ? `ffmpeg를 찾을 수 없습니다. 확인한 경로: ${ffmpegPath}`
            : `ffmpeg 프레임 추출에 실패했습니다. ${message}`
        }
      } finally {
        if (existsSync(outputPath)) {
          await unlink(outputPath).catch(() => undefined)
        }
      }
    }
  )

  ipcMain.handle(
<<<<<<< HEAD
    'capture:getLastUrl',
    async (_, payload: { folderId: string }) => {
    const url = getLastCaptureUrlByFolderId(payload.folderId)
    return { url }
  })
  
  ipcMain.handle(
    'capture:remove',
    async (_, payload: { captureId: string; filePath: string }) => {
      deleteCapture(payload.captureId)

      try {
        await unlink(payload.filePath)
      } catch {
        // File may already be removed or unavailable; DB delete is the primary action.
=======
    'ffmpeg:createPreview',
    async (
      _,
      payload: FfmpegCreatePreviewPayload
    ): Promise<{ previewPath: string | null; error?: string }> => {
      const videoPath = payload.videoPath
      if (!videoPath || !existsSync(videoPath)) {
        return { previewPath: null, error: '동영상 파일 경로를 찾을 수 없습니다.' }
>>>>>>> feature/deliverable-design
      }

      const ffmpegPath = resolveFfmpegPath()
      const { videoDir } = getFileStoragePaths()
      const workspaceId = String(payload.workspaceId ?? '').replace(/[^\w-]/g, '')
      const previewFileName = workspaceId
        ? `video_${makeHash()}_${workspaceId}.mp4`
        : `video_${makeHash()}.mp4`
      const outputPath = path.join(videoDir, previewFileName)
      const previewPath = path.join('FILE', 'VIDEO', previewFileName).replace(/\\/g, '/')

      try {
        await new Promise<void>((resolve, reject) => {
          execFile(
            ffmpegPath,
            [
              '-y',
              '-i',
              videoPath,
              '-c:v',
              'libx264',
              '-preset',
              'veryfast',
              '-crf',
              '23',
              '-pix_fmt',
              'yuv420p',
              '-c:a',
              'aac',
              '-movflags',
              '+faststart',
              outputPath
            ],
            { windowsHide: true, timeout: 120000 },
            (error) => {
              if (error) {
                reject(error)
                return
              }
              resolve()
            }
          )
        })

        await removeOldWorkspaceVideos(videoDir, workspaceId, outputPath)

        return { previewPath }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const isMissingFfmpeg = /ENOENT|not recognized|spawn ffmpeg/i.test(message)

        return {
          previewPath: null,
          error: isMissingFfmpeg
            ? `ffmpeg를 찾을 수 없습니다. 확인한 경로: ${ffmpegPath}`
            : `동영상 미리보기 변환에 실패했습니다. ${message}`
        }
      }
    }
  )

  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('shell:showItemInFolder', (_, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle(
    'export:project',
    async (event, payload: ProjectExportPayload): Promise<ExportResult> => {
      const exportData = DAO.getProjectExportData(payload.projectId)
      if (!exportData) {
        throw new Error('프로젝트를 찾을 수 없습니다.')
      }

      const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const projectName =
        typeof exportData.project.name === 'string' && exportData.project.name
          ? exportData.project.name
          : 'project-export'
      const defaultFileName = getSafeExportFileName(payload.defaultFileName || projectName)
      const options = {
        title: '프로젝트 내보내기',
        defaultPath: `${defaultFileName}.zip`,
        filters: [{ name: '프로젝트 내보내기 파일', extensions: ['zip'] }]
      }
      const result = ownerWindow
        ? await dialog.showSaveDialog(ownerWindow, options)
        : await dialog.showSaveDialog(options)

      if (result.canceled || !result.filePath) return { canceled: true }

      const zipBuffer = await buildProjectExportZip(exportData)
      await writeFile(result.filePath, zipBuffer)

      return { canceled: false, filePath: result.filePath }
    }
  )

  ipcMain.handle('import:project', async (event): Promise<ProjectImportResult> => {
    const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const options = {
      title: '프로젝트 불러오기',
      properties: ['openFile'] as Array<'openFile'>,
      filters: [{ name: '프로젝트 내보내기 파일', extensions: ['zip'] }]
    }
    const result = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || !result.filePaths[0]) return { canceled: true }

    const zipBuffer = await readFile(result.filePaths[0])
    const bundle = readProjectImportBundle(zipBuffer)
    const projectId = DAO.importProjectExportData(bundle.data, bundle.assets)

    return { canceled: false, projectId }
  })

  ipcMain.handle(
    'export:manualHtmlZip',
    async (event, payload: ManualHtmlZipExportPayload): Promise<ExportResult> => {
      const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const options = {
        title: 'HTML 매뉴얼 저장',
        defaultPath: `${payload.defaultFileName}.zip`,
        filters: [{ name: 'ZIP 파일', extensions: ['zip'] }]
      }
      const result = ownerWindow
        ? await dialog.showSaveDialog(ownerWindow, options)
        : await dialog.showSaveDialog(options)

      if (result.canceled || !result.filePath) return { canceled: true }

      const zipBuffer = createZipBuffer(
        payload.files.map((file) => ({
          name: file.path.replace(/\\/g, '/'),
          content: Buffer.from(file.content, file.encoding ?? 'utf-8')
        }))
      )

      await writeFile(result.filePath, zipBuffer)
      return { canceled: false, filePath: result.filePath }
    }
  )

  ipcMain.handle(
    'export:manualPdf',
    async (event, payload: ManualExportPayload): Promise<ExportResult> => {
      const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const options = {
        title: 'PDF 매뉴얼 저장',
        defaultPath: `${payload.defaultFileName}.pdf`,
        filters: [{ name: 'PDF 문서', extensions: ['pdf'] }]
      }
      const result = ownerWindow
        ? await dialog.showSaveDialog(ownerWindow, options)
        : await dialog.showSaveDialog(options)

      if (result.canceled || !result.filePath) return { canceled: true }

      const printWindow = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
          sandbox: false,
          offscreen: true
        }
      })

      try {
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`)
        const pdfBuffer = await printWindow.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: {
            marginType: 'default'
          }
        })
        await writeFile(result.filePath, pdfBuffer)
      } finally {
        printWindow.close()
      }

      return { canceled: false, filePath: result.filePath }
    }
  )

  ipcMain.handle('dao:call', (_, method: string, ...args: unknown[]) => {
    const daoMethod = (DAO as Record<string, unknown>)[method]
    if (!daoMethod) {
      throw new Error(`NotFound dao method: ${method}`)
    } else if (typeof daoMethod !== 'function') {
      throw new Error(`Unknown dao method: ${method}`)
    }

    return (daoMethod as (...params: unknown[]) => unknown)(...args)
  })




  ipcMain.handle('shortcut:register', (_, keyset: string, eventReceiver: string) => {
    registerGlobalShortcut(keyset, eventReceiver)
  })

  ipcMain.handle('shortcut:unregister', (_, keyset: string) => {
    unregisterShortcut(keyset)
  })

  createWindow()

  // Auto updater events
  autoUpdater.on('update-available', () => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('update:available')
  })

  autoUpdater.on('update-downloaded', () => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('update:downloaded')
  })

  // Check for updates in production
  if (!is.dev) {
    autoUpdater.checkForUpdates()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
