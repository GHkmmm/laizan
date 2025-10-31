import { ipcMain } from 'electron'
import { chromium } from '@playwright/test'
import { storage, StorageKey } from '../utils/storage'

/**
 * 注册调试功能相关的 IPC 处理器
 * 仅在开发环境中使用
 */
export function registerDebugIPC(): void {
  // 调试功能：打开抖音首页，携带登录信息
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

      // 创建新页面并打开抖音首页，使用 storageState 保持登录信息
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
}
