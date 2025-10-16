import { ElectronAPI } from '@electron-toolkit/preload'
import type { FeedAcSettings } from '@shared/settings'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
      getSettings: () => Promise<FeedAcSettings | undefined>
      updateSettings: (payload: Partial<FeedAcSettings>) => Promise<FeedAcSettings>
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
