import { app, shell, BrowserWindow, ipcMain, dialog, OpenDialogOptions, Menu } from 'electron'
import { existsSync, writeFileSync, readFileSync, readdirSync } from 'fs'
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
import { getAiSettings, updateAiSettings } from './workflows/feed-ac/ai-settings'
import { chromium } from '@playwright/test'
import {
  FeedAcSettingsV2,
  detectConfigVersion,
  getUnifiedFeedAcSettings
} from '@/shared/feed-ac-setting'
import { getDefaultAISetting } from '@/shared/ai-setting'
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

  let currentTask: ACTask | null = null
  let running = false

  ipcMain.handle('task:start', async (event) => {
    if (running) {
      return { ok: false, message: 'Task already running' }
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    currentTask = new ACTask()
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

  ipcMain.handle('feedAcSetting:get', () => {
    return getFeedAcSettings()
  })
  ipcMain.handle(
    'feedAcSetting:update',
    (_e, payload: Partial<ReturnType<typeof getFeedAcSettings>>) => {
      return updateFeedAcSettings(payload)
    }
  )
  ipcMain.handle('feedAcSetting:clear', () => {
    return clearFeedAcSettings()
  })

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
    return getDefaultAISetting()
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
    const options: OpenDialogOptions = {
      title: '选择Chrome可执行文件',
      properties: ['openFile'],
      defaultPath: isMac ? '/Applications' : undefined,
      // treatPackageAsDirectory: isMac,
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

  // 图片路径选择
  ipcMain.handle('imagePath:select', async (e, type: 'folder' | 'file') => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const options: OpenDialogOptions = {
      title: type === 'folder' ? '选择图片文件夹' : '选择图片文件',
      properties: type === 'folder' ? ['openDirectory'] : ['openFile'],
      filters:
        type === 'file'
          ? [
              { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
              { name: 'All Files', extensions: ['*'] }
            ]
          : undefined
    }

    try {
      const result = win
        ? await dialog.showOpenDialog(win, options)
        : await dialog.showOpenDialog(options)

      if (result.canceled || !result.filePaths?.length) {
        return { ok: false, message: '用户取消了选择' }
      }

      const selectedPath = result.filePaths[0]
      return { ok: true, path: selectedPath }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
  })

  // 调试功能：打开抖音首页
  ipcMain.handle('debug:openDouyinHomepage', async () => {
    try {
      // 获取浏览器路径
      const browserPath =
        storage.get(StorageKey.browserExecPath) ||
        (process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '')

      // 启动Playwright浏览器
      const browser = await chromium.launch({
        executablePath: browserPath,
        headless: false
      })

      // 创建新页面并打开抖音首页，带上登录信息
      const context = await browser.newContext({
        storageState: storage.get(StorageKey.auth) ?? {}
      })
      const page = await context.newPage()
      await page.goto('https://www.douyin.com/?recommend=1')

      return { ok: true, message: '已成功打开抖音首页' }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
  })

  ipcMain.handle('feedAcSetting:export', async (e, payload: FeedAcSettingsV2) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const options = {
      title: '导出配置',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: `feed-ac-settings-v2-${new Date()
        .toISOString()
        .replace(/[:T]/g, '-')
        .slice(0, 19)}.json`
    }
    const result = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return { ok: false, message: '用户取消' }
    try {
      writeFileSync(result.filePath, JSON.stringify(payload ?? {}, null, 2), 'utf-8')
      return { ok: true, path: result.filePath }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
  })

  // 获取模板列表
  ipcMain.handle('feedAcSetting:getTemplateList', async () => {
    try {
      const templatesDir = join(app.getAppPath(), 'resources/config-templates/douyin/feed-ac/v2')
      if (!existsSync(templatesDir)) {
        return []
      }
      const files = readdirSync(templatesDir).filter((f) => f.endsWith('.json'))
      return files.sort() // 按文件名排序
    } catch (error) {
      console.error('获取模板列表失败:', error)
      return []
    }
  })

  // 选择并读取 JSON 配置文件内容（支持模板导入）
  ipcMain.handle('feedAcSetting:pickImport', async (e, templateFileName?: string) => {
    let content: string
    let filePath: string

    try {
      if (templateFileName) {
        // 导入模板文件
        filePath = join(
          app.getAppPath(),
          'resources/config-templates/douyin/feed-ac/v2',
          templateFileName
        )
        if (!existsSync(filePath)) {
          return { ok: false, message: '模板文件不存在' }
        }
        content = readFileSync(filePath, 'utf-8')
      } else {
        // 用户选择文件
        const win = BrowserWindow.fromWebContents(e.sender)
        const options: OpenDialogOptions = {
          title: '导入配置',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }]
        }
        const result = win
          ? await dialog.showOpenDialog(win, options)
          : await dialog.showOpenDialog(options)
        if (result.canceled || !result.filePaths?.length) {
          return { ok: false, message: '用户取消' }
        }
        filePath = result.filePaths[0]
        content = readFileSync(filePath, 'utf-8')
      }

      // 验证导入的配置
      let setting: FeedAcSettingsV2
      try {
        setting = JSON.parse(content)
      } catch {
        return { ok: false, message: 'JSON 解析失败' }
      }

      if (typeof setting !== 'object' || setting === null || Object.keys(setting).length === 0) {
        return { ok: false, message: '文件结构异常' }
      }

      // 检测配置版本
      const version = detectConfigVersion(setting)

      if (version === 'v2') {
        // v2 配置验证
        if (!Array.isArray(setting.authorBlockKeywords)) {
          return { ok: false, message: '作者屏蔽词配置错误' }
        }
        if (!Array.isArray(setting.blockKeywords)) {
          return { ok: false, message: '屏蔽词配置错误' }
        }
        if (!Array.isArray(setting.ruleGroups)) {
          return { ok: false, message: '规则组配置错误' }
        }
        if (typeof setting.simulateWatchBeforeComment !== 'boolean') {
          return { ok: false, message: '模拟观看项配置错误' }
        }
        if (
          !Array.isArray(setting.watchTimeRangeSeconds) ||
          setting.watchTimeRangeSeconds.length !== 2
        ) {
          return { ok: false, message: '观看时长配置错误' }
        }
        if (typeof setting.onlyCommentActiveVideo !== 'boolean') {
          return { ok: false, message: '只观看活跃视频配置错误' }
        }
        return { ok: true, data: setting as FeedAcSettingsV2 }
      } else if (version === 'v1') {
        // v1 配置需要迁移
        return {
          ok: true,
          data: getUnifiedFeedAcSettings(setting),
          needMigration: true
        }
      } else {
        return { ok: false, message: '不支持的配置文件格式' }
      }
    } catch (error) {
      return { ok: false, message: String(error) }
    }
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

// 是否为开发环境
export const isDev = !app.isPackaged
if (!isDev) {
  Menu.setApplicationMenu(null)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
