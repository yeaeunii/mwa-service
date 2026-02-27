import { ElectronAPI } from '@electron-toolkit/preload'

interface SystemInfo {
  platform: string
  nodeVersion: string
  chromeVersion: string
  electronVersion: string
}

interface API {
  getSystemInfo: () => SystemInfo
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  send: (channel: string, ...args: unknown[]) => void
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
