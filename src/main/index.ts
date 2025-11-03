import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAuthIPC } from './ipc/auth'
import { registerTaskIPC } from './ipc/task'
import { registerFeedAcSettingIPC } from './ipc/feed-ac-setting'
import { registerAISettingIPC } from './ipc/ai-setting'
import { registerBrowserExecIPC } from './ipc/browser-exec'
import { registerFilePickerIPC } from './ipc/file-picker'
import { registerDebugIPC } from './ipc/debug'
import { registerTaskHistoryIPC } from './ipc/task-history'
import { registerTaskDetailIPC } from './ipc/task-detail'
import { taskHistoryService } from './service/task-history'
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
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
  electronApp.setAppUserModelId('com.wubianji.laizan')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化任务历史服务（修正异常关闭的任务）
  taskHistoryService.init()

  // 注册所有 IPC 处理器
  registerAuthIPC()
  registerTaskIPC()
  registerFeedAcSettingIPC()
  registerAISettingIPC()
  registerBrowserExecIPC()
  registerFilePickerIPC()
  registerDebugIPC()
  registerTaskHistoryIPC()
  registerTaskDetailIPC()

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

// 是否为开发环境
export const isDev = !app.isPackaged
if (!isDev) {
  Menu.setApplicationMenu(null)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
