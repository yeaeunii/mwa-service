import { app, shell, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

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
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
