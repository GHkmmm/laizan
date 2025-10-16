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
          ruleRelation: 'and' | 'or'
          rules: { field: 'nickName' | 'videoDesc' | 'videoTag'; keyword: string }[]
          simulateWatchBeforeComment: boolean
          watchTimeRangeSeconds: [number, number]
          onlyCommentActiveVideo: boolean
        }?
      >
      updateSettings: (
        payload: Partial<{
          blockKeywords: string[]
          authorBlockKeywords: string[]
          ruleRelation: 'and' | 'or'
          rules: { field: 'nickName' | 'videoDesc' | 'videoTag'; keyword: string }[]
          simulateWatchBeforeComment: boolean
          watchTimeRangeSeconds: [number, number]
          onlyCommentActiveVideo: boolean
        }>
      ) => Promise<{
        blockKeywords: string[]
        authorBlockKeywords: string[]
        ruleRelation: 'and' | 'or'
        rules: { field: 'nickName' | 'videoDesc' | 'videoTag'; keyword: string }[]
        simulateWatchBeforeComment: boolean
        watchTimeRangeSeconds: [number, number]
        onlyCommentActiveVideo: boolean
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
