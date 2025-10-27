import { ElectronAPI } from '@electron-toolkit/preload'
import type { FeedAcSettingsV2 } from '@/shared/feed-ac-setting'
import type { AISettings } from '@/shared/ai-setting'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      hasAuth: () => Promise<boolean>
      login: () => Promise<void>
      logout: () => void
      getFeedAcSettings: () => Promise<FeedAcSettingsV2>
      updateFeedAcSettings: (payload: Partial<FeedAcSettingsV2>) => Promise<FeedAcSettingsV2>
      clearFeedAcSettings: () => Promise<FeedAcSettingsV2>
      getAISettings: () => Promise<AISettings>
      updateAISettings: (payload: Partial<AISettings>) => Promise<AISettings>
      clearAISettings: () => Promise<AISettings>
      exportFeedAcSettings: (
        payload: FeedAcSettingsV2
      ) => Promise<{ ok: boolean; path?: string; message?: string }>
      getTemplateList: () => Promise<string[]>
      pickImportFeedAcSettings: (templateFileName?: string) => Promise<{
        ok: boolean
        data?: FeedAcSettingsV2
        needMigration?: boolean
        message?: string
      }>
      getBrowserExecPath: () => Promise<string | undefined>
      updateBrowserExecPath: (payload: { path?: string }) => Promise<string | undefined>
      testBrowserLaunch: (payload: { path?: string }) => Promise<{ ok: boolean; message?: string }>
      selectBrowserExecPath: () => Promise<string | undefined>
      startTask: () => Promise<{ ok: boolean; message?: string }>
      stopTask: () => Promise<{ ok: boolean; message?: string }>
      onTaskProgress: (
        handler: (p: { type: string; message: string; timestamp: number }) => void
      ) => () => void
      onTaskEnded: (
        handler: (p: { status: 'success' | 'stopped' | 'error'; message?: string }) => void
      ) => () => void
      selectImagePath: (
        type: 'folder' | 'file'
      ) => Promise<{ ok: boolean; path?: string; message?: string }>
      // removed global clearCache per new design
    }
  }
}
