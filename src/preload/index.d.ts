import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
      getSettings: () => Promise<
        {
          blockKeywords: string[]
          authorBlockKeywords: string[]
        }?
      >
      updateSettings: (
        payload: Partial<{
          blockKeywords: string[]
          authorBlockKeywords: string[]
        }>
      ) => Promise<{
        blockKeywords: string[]
        authorBlockKeywords: string[]
      }>
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
