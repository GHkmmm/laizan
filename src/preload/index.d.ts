import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
    }
  }
}
