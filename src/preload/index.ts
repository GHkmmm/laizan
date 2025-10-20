import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { FeedAcSettings } from '@shared/feed-ac-setting'
import { AiSettings } from '@shared/ai-setting'

// Custom APIs for renderer
const api = {
  hasAuth: (): Promise<boolean> => ipcRenderer.invoke('hasAuth'),
  login: (): Promise<void> => ipcRenderer.invoke('login'),
  logout: (): void => ipcRenderer.send('logout'),
  getFeedAcSettings: (): Promise<FeedAcSettings> => ipcRenderer.invoke('feedAcSetting:get'),
  updateFeedAcSettings: (payload: Partial<FeedAcSettings>): Promise<FeedAcSettings> =>
    ipcRenderer.invoke('feedAcSetting:update', payload),
  clearFeedAcSettings: (): Promise<FeedAcSettings> => ipcRenderer.invoke('feedAcSetting:clear'),
  getAiSettings: (): Promise<AiSettings> => ipcRenderer.invoke('aiSetting:get'),
  updateAiSettings: (payload: Partial<AiSettings>): Promise<AiSettings> =>
    ipcRenderer.invoke('aiSetting:update', payload),
  clearAiSettings: (): Promise<AiSettings> => ipcRenderer.invoke('aiSetting:clear'),
  // browser executable path
  getBrowserExecPath: (): Promise<string | undefined> => ipcRenderer.invoke('browserExec:get'),
  updateBrowserExecPath: (payload: { path?: string }): Promise<string | undefined> =>
    ipcRenderer.invoke('browserExec:update', payload),
  testBrowserLaunch: (payload: { path?: string }): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('browserExec:testLaunch', payload),
  selectBrowserExecPath: (): Promise<string | undefined> =>
    ipcRenderer.invoke('browserExec:select'),
  startTask: (payload: { maxCount?: number }): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('task:start', payload),
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
  selectImagePath: (type: 'folder' | 'file'): Promise<{ ok: boolean; path?: string; message?: string }> =>
    ipcRenderer.invoke('imagePath:select', type)
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
