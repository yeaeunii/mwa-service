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
import { initDatabase, closeDatabase } from '../database/conn'
import * as DAO from '../database/dao'
import path from 'path'
import { pathToFileURL } from 'url'
import { existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'

const IMG_SCHEME = 'appimg'

interface ManualExportPayload {
  defaultFileName: string
  html: string
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

//Light 테마 고정
nativeTheme.themeSource = 'light'

protocol.registerSchemesAsPrivileged([
  {
    scheme: IMG_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true
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

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
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
    } => {
      const userDataDir = app.getPath('userData')
      const fileRootDir = path.join(userDataDir, 'FILE')
    
      return {
        userDataDir,
        fileRootDir,
        capturesDir: path.join(fileRootDir, 'CAPTURES'),
        docsDir: path.join(fileRootDir, 'DOCS'),
        thumbnailsDir: path.join(fileRootDir, 'Thumbnails')
      }
    }

    
  //local 폴더 생성
  const ensureFileStorageDirs = (): void => {
    const { fileRootDir, capturesDir, docsDir, thumbnailsDir } = getFileStoragePaths()
  
    for (const dir of [fileRootDir, capturesDir, docsDir, thumbnailsDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
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
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
      ]
    })
    return result
  })

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
