import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  hasAuth: (): Promise<boolean> => ipcRenderer.invoke('hasAuth'),
  login: (): Promise<void> => ipcRenderer.invoke('login'),
  logout: (): void => ipcRenderer.send('logout'),
  startTask: (payload: { maxCount?: number }): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('task:start', payload),
  stopTask: (): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('task:stop'),
  onTaskProgress: (handler: (p: { type: string; message: string; timestamp: number }) => void):
    (() => void) => {
      const listener = (_e: any, p: { type: string; message: string; timestamp: number }) =>
        handler(p)
      ipcRenderer.on('task:progress', listener)
      return () => ipcRenderer.removeListener('task:progress', listener)
    },
  onTaskEnded: (
    handler: (p: { status: 'success' | 'stopped' | 'error'; message?: string }) => void
  ): (() => void) => {
    const listener = (
      _e: any,
      p: { status: 'success' | 'stopped' | 'error'; message?: string }
    ) => handler(p)
    ipcRenderer.on('task:ended', listener)
    return () => ipcRenderer.removeListener('task:ended', listener)
  }
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
