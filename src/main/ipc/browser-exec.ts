import { BrowserWindow, dialog, ipcMain, OpenDialogOptions } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { chromium } from '@playwright/test'
import { storage, StorageKey } from '../utils/storage'

/**
 * 注册浏览器可执行路径相关的 IPC 处理器
 */
export function registerBrowserExecIPC(): void {
  ipcMain.handle('browserExec:get', () => {
    const path = storage.get(StorageKey.browserExecPath)
    const isMac = process.platform === 'darwin'
    return path || (isMac ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '')
  })

  ipcMain.handle('browserExec:update', (_e, payload: { path?: string }) => {
    const next = payload?.path || ''
    if (next) {
      storage.set(StorageKey.browserExecPath, next)
    } else {
      storage.delete(StorageKey.browserExecPath)
    }
    return storage.get(StorageKey.browserExecPath)
  })

  ipcMain.handle('browserExec:testLaunch', async (_e, { path }: { path?: string }) => {
    if (!path) {
      return { ok: false, message: '路径不能为空' }
    }
    try {
      const browser = await chromium.launch({
        executablePath: path,
        headless: true,
        args: ['--no-sandbox']
      })
      await browser.close()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
  })

  // 打开文件选择器选择浏览器可执行文件
  ipcMain.handle('browserExec:select', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const isMac = process.platform === 'darwin'
    const options: OpenDialogOptions = {
      title: '选择Chrome可执行文件',
      properties: ['openFile'],
      defaultPath: isMac ? '/Applications' : undefined,
      filters: isMac
        ? undefined
        : [
            { name: 'Executable', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
          ]
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths?.length) return undefined
    const picked = result.filePaths[0]
    if (isMac && picked.endsWith('.app')) {
      const chromeExec = join(picked, 'Contents/MacOS/Google Chrome')
      if (existsSync(chromeExec)) return chromeExec
    }
    return picked
  })
}
