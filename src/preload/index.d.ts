import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
      startTask: (payload: { maxCount?: number }) => Promise<{ ok: boolean; message?: string }>
      stopTask: () => Promise<{ ok: boolean; message?: string }>
      onTaskProgress: (
        handler: (p: { type: string; message: string; timestamp: number }) => void
      ) => () => void
      onTaskEnded: (
        handler: (p: { status: 'success' | 'stopped' | 'error'; message?: string }) => void
      ) => () => void
    }
  }
}
