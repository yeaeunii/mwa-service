import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import * as DAO from '../database/dao'

// Invoke channels
const INVOKE_CHANNELS = [
  'dialog:openFile',
  'shell:openExternal',
  'shell:showItemInFolder',
  'app:getVersion',
  'export:manualHtmlZip',
  'export:manualPdf',
  'dao:call',
  'shortcut:register',
  'shortcut:unregister'
]

// Send channels
const SEND_CHANNELS: string[] = []

// Listener channels
const ON_CHANNELS = ['update:available', 'update:downloaded', 'shortcut:captureWebview']

const systemInfo = {
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron
}

// Custom APIs for renderer
const api = {
  getSystemInfo: () => systemInfo,
  invoke: (channel: string, ...args: unknown[]) => {
    if (INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`Unknown invoke channel: ${channel}`)
  },
  send: (channel: string, ...args: unknown[]) => {
    if (SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    } else {
      throw new Error(`Unknown send channel: ${channel}`)
    }
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    if (ON_CHANNELS.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => listener(...args))
      return () => ipcRenderer.removeListener(channel, listener)
    }
    throw new Error(`Unknown on channel: ${channel}`)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.dao = DAO
}
