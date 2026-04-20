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
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from '../database/conn'
import * as DAO from '../database/dao'
import path from 'path'
import { pathToFileURL } from 'url'
import { existsSync, mkdirSync } from 'fs'

const IMG_SCHEME = 'image'

//Light 테마 고정
nativeTheme.themeSource = 'light'

// 1. (필수) 앱이 준비되기 전에 스키마 권한을 등록해야 합니다.
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

const filePathToDataUrl = async (filePath: string, mimeType = 'image/png'): Promise<string> => {
  const fileBuffer = await readFile(filePath)
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`
}

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

  const imagesDir = path.join(app.getPath('userData'), 'images')
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true })
  }

  protocol.handle(IMG_SCHEME, (request) => {
    try {
      const url = new URL(request.url)
      // Support both IMG_SCHEME://1.png and IMG_SCHEME:///1.png formats.
      const rawPath = url.pathname && url.pathname !== '/' ? url.pathname : url.hostname
      const relativePath = decodeURIComponent(rawPath).replace(/^\/+/, '').replace(/\\/g, '/')
      if (!relativePath) {
        return new Response('Bad Request', { status: 400 })
      }

      const absPath = path.resolve(imagesDir, relativePath)
      const normalizedBase = path.resolve(imagesDir) + path.sep
      const isInsideBase = absPath === path.resolve(imagesDir) || absPath.startsWith(normalizedBase)
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

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('dao:call', (_, method: string, ...args: unknown[]) => {
    const daoMethod = (DAO as Record<string, unknown>)[method]
    if (!daoMethod) {
      throw new Error(`NotFound dao method: ${method}`)
    } else if (typeof daoMethod !== 'function') {
      throw new Error(`Unknown dao method: ${method}`)
    }

    return (daoMethod as (...params: unknown[]) => unknown)(...args)
  })

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
