import { app, shell, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron'
import { join } from 'path'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
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

const CAPTURE_ROOT_DIR = 'screenshots'
const CAPTURE_AREA_DIR = '캡쳐폴더'

const filePathToDataUrl = async (filePath: string, mimeType = 'image/png'): Promise<string> => {
  const fileBuffer = await readFile(filePath)
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`
}

const sanitizeFileSegment = (value: string): string =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default'

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

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('db:getPath', () => {
    return getDatabasePath()
  })

  ipcMain.handle('project:list', () => {
    return listProjects()
  })

  ipcMain.handle(
    'project:create',
    (
      _,
      payload: {
        id: string
        name: string
        description?: string
        sourceUrl?: string
      }
    ) => {
      upsertProject({
        id: payload.id,
        name: payload.name,
        description: payload.description,
        sourceUrl: payload.sourceUrl
      })

      return getProjectById(payload.id)
    }
  )

  ipcMain.handle('project:get', (_, payload: { projectId: string }) => {
    return getProjectById(payload.projectId)
  })

  ipcMain.handle(
    'project:update',
    (
      _,
      payload: {
        id: string
        name: string
        description?: string
      }
    ) => {
      updateProject(payload)
      return getProjectById(payload.id)
    }
  )

  ipcMain.handle('project:delete', (_, payload: { projectId: string }) => {
    deleteProject(payload.projectId)
    return { success: true }
  })

  ipcMain.handle(
    'capture:syncFolders',
    (
      _,
      payload: {
        projectId: string
        projectName: string
        projectDescription?: string
        sourceUrl?: string
        areaScope?: 'capture' | 'document'
        folders: Array<{
          id: string
          title: string
          description?: string
          path?: string
          areaType?: 'capture' | 'document'
          sortOrder?: number
        }>
      }
    ) => {
      upsertProject({
        id: payload.projectId,
        name: payload.projectName,
        description: payload.projectDescription,
        sourceUrl: payload.sourceUrl
      })

      payload.folders.forEach((folder) => {
        upsertFolder({
          id: folder.id,
          projectId: payload.projectId,
          title: folder.title,
          path: folder.path,
          description: folder.description,
          areaType: folder.areaType,
          sortOrder: folder.sortOrder
        })
      })

      markDeletedFolders(
        payload.projectId,
        payload.folders.map((folder) => folder.id),
        payload.areaScope
      )

      return { success: true }
    }
  )

  ipcMain.handle(
    'capture:list',
    async (_, payload: { projectId: string }) => {
      const rows = listCapturesByProject(payload.projectId)

      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          image_src: await filePathToDataUrl(row.image_path)
        }))
      )
    }
  )

  ipcMain.handle('workspace:get', async (_, payload: { projectId: string }) => {
    const workspace = getProjectWorkspace(payload.projectId)

    const folders = await Promise.all(
      workspace.folders.map(async (folder) => ({
        ...folder,
        screenshots: await Promise.all(
          folder.screenshots.map(async (screenshot) => ({
            ...screenshot,
            image_src: await filePathToDataUrl(screenshot.image_path)
          }))
        )
      }))
    )

    return {
      ...workspace,
      folders
    }
  })

  ipcMain.handle(
    'workspace:updateSelection',
    (_, payload: { projectId: string; selectedCaptureIds: string[] }) => {
      updateCaptureSelections(payload.projectId, payload.selectedCaptureIds)
      return { success: true }
    }
  )

  ipcMain.handle(
    'workspace:updateCaptureOrder',
    (_, payload: { folderId: string; orderedCaptureIds: string[] }) => {
      updateCaptureSortOrders(payload.folderId, payload.orderedCaptureIds)
      return { success: true }
    }
  )

  ipcMain.handle(
    'annotation:replace',
    (
      _,
      payload: {
        captureId: string
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
      }
    ) => {
      replaceCaptureAnnotations(payload.captureId, payload.annotations)
      return { success: true }
    }
  )

  ipcMain.handle(
    'capture:updateMeta',
    (
      _,
      payload: {
        captureId: string
        pageTitle?: string
        menuPath?: string
        screenDescription?: string
        functionalityDescription?: string
        writerName?: string
        pageNo?: number
      }
    ) => {
      updateCaptureMetadata(payload)
      return { success: true }
    }
  )

  ipcMain.handle(
    'capture:overwriteImage',
    async (
      _,
      payload: {
        filePath: string
        dataUrl: string
      }
    ) => {
      const base64Data = payload.dataUrl.replace(/^data:image\/\w+;base64,/, '')
      await writeFile(payload.filePath, Buffer.from(base64Data, 'base64'))
      return { success: true }
    }
  )

  ipcMain.handle(
    'capture:save',
    async (
      _,
      payload: {
        projectId: string
        projectName: string
        projectDescription?: string
        folderId: string
        folderTitle: string
        sourceUrl?: string
        pageTitle?: string
        menuPath?: string
        screenDescription?: string
        functionalityDescription?: string
        writerName?: string
        pageNo?: number
        dataUrl: string
      }
    ) => {
      upsertProject({
        id: payload.projectId,
        name: payload.projectName,
        description: payload.projectDescription,
        sourceUrl: payload.sourceUrl
      })

      upsertFolder({
        id: payload.folderId,
        projectId: payload.projectId,
        title: payload.folderTitle,
        areaType: 'capture'
      })

      const captureId = `capture-${Date.now()}`
      const fileName = `${captureId}.png`
      const targetDir = join(
        app.getPath('userData'),
        CAPTURE_ROOT_DIR,
        sanitizeFileSegment(payload.projectName),
        CAPTURE_AREA_DIR,
        sanitizeFileSegment(payload.folderTitle)
      )

      await mkdir(targetDir, { recursive: true })

      const filePath = join(targetDir, fileName)
      const base64Data = payload.dataUrl.replace(/^data:image\/\w+;base64,/, '')
      await writeFile(filePath, Buffer.from(base64Data, 'base64'))

      insertCapture({
        id: captureId,
        projectId: payload.projectId,
        folderId: payload.folderId,
        fileName,
        imagePath: filePath,
        sourceUrl: payload.sourceUrl,
        pageTitle: payload.folderTitle,
        menuPath: payload.menuPath || payload.folderTitle,
        screenDescription: payload.screenDescription,
        functionalityDescription: payload.functionalityDescription,
        writerName: payload.writerName,
        pageNo: payload.pageNo
      })

      return {
        success: true,
        capture: {
          id: captureId,
          filePath,
          imageSrc: payload.dataUrl
        }
      }
    }
  )

  ipcMain.handle(
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
      }

      return { success: true }
    }
  )

  ipcMain.handle(
    'capture:importToFolder',
    async (
      _,
      payload: {
        projectId: string
        targetFolderId: string
        projectName: string
        folderTitle: string
        folderPath?: string
        folderDescription?: string
        captureIds: string[]
      }
    ) => {
      console.log('[main/import] request', payload)
      const rows = copyCapturesToFolder(payload)
      console.log('[main/import] db rows', {
        rowCount: rows.length,
        rows
      })

      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          image_src: await filePathToDataUrl(row.image_path)
        }))
      )
    }
  )

  ipcMain.handle('webview:saveCapture', async (_, dataUrl: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Capture',
      defaultPath: join(app.getPath('pictures'), `capture-${Date.now()}.png`),
      filters: [
        { name: 'PNG Image', extensions: ['png'] },
        { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }
      ]
    })
    if (canceled || !filePath) return { success: false }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    await writeFile(filePath, Buffer.from(base64Data, 'base64'))
    return { success: true, filePath }
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
