import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ACTask, { loginAndStorageState } from './workflows/feed-ac'
import { storage, StorageKey } from './utils/storage'
import {
  getFeedAcSettings,
  updateFeedAcSettings,
  clearFeedAcSettings
} from './workflows/feed-ac/settings'
import { getAiSettings, updateAiSettings, getAiDefaults } from './workflows/feed-ac/ai-settings'
import { chromium } from '@playwright/test'
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  let currentTask: ACTask | null = null
  let running = false

  ipcMain.handle('task:start', async (event, payload: { maxCount?: number } = {}) => {
    if (running) {
      return { ok: false, message: 'Task already running' }
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    currentTask = new ACTask({ maxCount: payload?.maxCount })
    running = true

    // 订阅进度
    currentTask.on('progress', (p) => {
      try {
        win?.webContents.send('task:progress', p)
      } catch (e) {
        console.error(e)
      }
    })
    ;(async () => {
      try {
        await currentTask?.run()
        win?.webContents.send('task:ended', { status: 'success' })
      } catch (err) {
        const msg = String(err)
        const isClosed = msg.includes('Task stopped') || msg.includes('has been closed')
        win?.webContents.send('task:ended', {
          status: isClosed ? 'stopped' : 'error',
          message: msg
        })
      } finally {
        running = false
        currentTask = null
      }
    })()

    return { ok: true }
  })

  ipcMain.handle('task:stop', async () => {
    if (!running || !currentTask) {
      return { ok: true }
    }
    try {
      await currentTask.stop()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: String(e) }
    }
  })
  ipcMain.handle('hasAuth', () => {
    const auth = storage.get(StorageKey.auth)
    return Boolean(auth)
  })
  ipcMain.handle('login', async () => {
    await loginAndStorageState()
  })
  ipcMain.on('logout', () => {
    storage.delete(StorageKey.auth)
  })

  // settings clear ipc
  ipcMain.handle('feedAcSetting:clear', () => {
    return clearFeedAcSettings()
  })

  // settings ipc
  ipcMain.handle('feedAcSetting:get', () => {
    return getFeedAcSettings()
  })
  ipcMain.handle(
    'feedAcSetting:update',
    (_e, payload: Partial<ReturnType<typeof getFeedAcSettings>>) => {
      return updateFeedAcSettings(payload)
    }
  )

  // ai setting ipc
  ipcMain.handle('aiSetting:get', () => {
    return getAiSettings()
  })
  ipcMain.handle('aiSetting:update', (_e, payload: Parameters<typeof updateAiSettings>[0]) => {
    return updateAiSettings(payload)
  })
  ipcMain.handle('aiSetting:clear', () => {
    // clear ai settings by deleting and returning defaults
    storage.delete(StorageKey.aiSettings)
    return getAiDefaults()
  })

  // browser executable path ipc
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
      browser.close()
      return { ok: true }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
    // try {
    //   await loginAndStorageState() // reuse launch flow to verify spawn-ability; it will open a window
    //   return { ok: true }
    // } catch (e) {
    //   return { ok: false, message: String(e) }
    // }
  })

  // open file picker to select browser executable
  ipcMain.handle('browserExec:select', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const isMac = process.platform === 'darwin'
    const options = {
      title: '选择浏览器可执行文件',
      properties: ['openFile'] as 'openFile'[],
      defaultPath: isMac ? '/Applications' : undefined,
      treatPackageAsDirectory: isMac,
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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
