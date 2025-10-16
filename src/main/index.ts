import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ACTask, { loginAndStorageState } from './workflows/feed-ac'
import { storage, StorageKey } from './utils/storage'
import { getFeedAcSettings, updateFeedAcSettings } from './workflows/feed-ac/settings'
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

  // settings ipc
  ipcMain.handle('settings:get', () => {
    return getFeedAcSettings()
  })
  ipcMain.handle(
    'settings:update',
    (_e, payload: Partial<ReturnType<typeof getFeedAcSettings>>) => {
      return updateFeedAcSettings(payload)
    }
  )

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
