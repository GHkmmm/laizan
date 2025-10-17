import { ElectronAPI } from '@electron-toolkit/preload'
import type { FeedAcSettings } from '@shared/feed-ac-setting'
import type { AiSettings } from '@shared/ai-setting'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
      getFeedAcSettings: () => Promise<FeedAcSettings | undefined>
      updateFeedAcSettings: (payload: Partial<FeedAcSettings>) => Promise<FeedAcSettings>
      clearFeedAcSettings: () => Promise<FeedAcSettings>
      getAiSettings: () => Promise<AiSettings>
      updateAiSettings: (payload: Partial<AiSettings>) => Promise<AiSettings>
      clearAiSettings: () => Promise<AiSettings>
      getBrowserExecPath: () => Promise<string | undefined>
      updateBrowserExecPath: (payload: { path?: string }) => Promise<string | undefined>
      testBrowserLaunch: (payload: { path?: string }) => Promise<{ ok: boolean; message?: string }>
      selectBrowserExecPath: () => Promise<string | undefined>
      startTask: (payload: { maxCount?: number }) => Promise<{ ok: boolean; message?: string }>
      stopTask: () => Promise<{ ok: boolean; message?: string }>
      onTaskProgress: (
        handler: (p: { type: string; message: string; timestamp: number }) => void
      ) => () => void
      onTaskEnded: (
        handler: (p: { status: 'success' | 'stopped' | 'error'; message?: string }) => void
      ) => () => void
      // removed global clearCache per new design
    }
  }
}
