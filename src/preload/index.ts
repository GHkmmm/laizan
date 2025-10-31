import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { FeedAcSettingsV2, FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { AISettings } from '@/shared/ai-setting'

// Custom APIs for renderer
export const api = {
  hasAuth: (): Promise<boolean> => ipcRenderer.invoke('hasAuth'),
  login: (): Promise<void> => ipcRenderer.invoke('login'),
  logout: (): void => ipcRenderer.send('logout'),
  getFeedAcSettings: (): Promise<FeedAcSettingsV2> => ipcRenderer.invoke('feedAcSetting:get'),
  clearFeedAcSettings: (): Promise<FeedAcSettingsV2> => ipcRenderer.invoke('feedAcSetting:clear'),
  // 规则组操作
  createRuleGroup: (
    ruleGroupData: Omit<FeedAcRuleGroups, 'id'>,
    parentId?: string
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:createRuleGroup', ruleGroupData, parentId),
  updateRuleGroup: (
    id: string,
    updates: Partial<Omit<FeedAcRuleGroups, 'id'>>
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:updateRuleGroup', id, updates),
  deleteRuleGroup: (
    id: string
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:deleteRuleGroup', id),
  copyRuleGroup: (
    id: string,
    parentId?: string
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:copyRuleGroup', id, parentId),
  // 其他配置字段更新
  updateExceptRuleGroup: (
    updates: Partial<Omit<FeedAcSettingsV2, 'ruleGroups' | 'version'>>
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:updateExceptRuleGroup', updates),
  // 导入完整配置
  importFeedAcSettings: (
    config: FeedAcSettingsV2
  ): Promise<{ ok: boolean; data?: FeedAcSettingsV2; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:import', config),
  getAISettings: (): Promise<AISettings> => ipcRenderer.invoke('aiSetting:get'),
  updateAISettings: (payload: Partial<AISettings>): Promise<AISettings> =>
    ipcRenderer.invoke('aiSetting:update', payload),
  clearAISettings: (): Promise<AISettings> => ipcRenderer.invoke('aiSetting:clear'),
  exportFeedAcSettings: (
    payload: FeedAcSettingsV2
  ): Promise<{ ok: boolean; path?: string; message?: string }> =>
    ipcRenderer.invoke('feedAcSetting:export', payload),
  getTemplateList: (): Promise<string[]> => ipcRenderer.invoke('feedAcSetting:getTemplateList'),
  pickImportFeedAcSettings: (
    templateFileName?: string
  ): Promise<{
    ok: boolean
    data?: FeedAcSettingsV2
    needMigration?: boolean
    message?: string
  }> => ipcRenderer.invoke('feedAcSetting:pickImport', templateFileName),
  // browser executable path
  getBrowserExecPath: (): Promise<string | undefined> => ipcRenderer.invoke('browserExec:get'),
  updateBrowserExecPath: (payload: { path?: string }): Promise<string | undefined> =>
    ipcRenderer.invoke('browserExec:update', payload),
  testBrowserLaunch: (payload: { path?: string }): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('browserExec:testLaunch', payload),
  selectBrowserExecPath: (): Promise<string | undefined> =>
    ipcRenderer.invoke('browserExec:select'),
  startTask: (): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('task:start'),
  stopTask: (): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('task:stop'),
  onTaskProgress: (
    handler: (p: { type: string; message: string; timestamp: number }) => void
  ): (() => void) => {
    const listener = (_, p: { type: string; message: string; timestamp: number }): void =>
      handler(p)
    ipcRenderer.on('task:progress', listener)
    return () => ipcRenderer.removeListener('task:progress', listener)
  },
  onTaskEnded: (
    handler: (p: { status: 'success' | 'stopped' | 'error'; message?: string }) => void
  ): (() => void) => {
    const listener = (_, p: { status: 'success' | 'stopped' | 'error'; message?: string }): void =>
      handler(p)

    ipcRenderer.on('task:ended', listener)
    return () => ipcRenderer.removeListener('task:ended', listener)
  },
  selectImagePath: (
    type: 'folder' | 'file'
  ): Promise<{ ok: boolean; path?: string; message?: string }> =>
    ipcRenderer.invoke('imagePath:select', type),
  // 调试功能：打开抖音首页
  openDouyinHomepage: (): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('debug:openDouyinHomepage')
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
}
