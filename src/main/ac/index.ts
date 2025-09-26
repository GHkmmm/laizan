import { chromium } from '@playwright/test'
import { sleep } from '@utils/common'
import { storage, StorageKey } from '../storage'

export async function loginAndStorageState(): Promise<void> {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Example: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' on Windows
    headless: false
  })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://www.douyin.com/?recommend=1')
  // 等待登录面板显示
  await page
    .waitForSelector('#login-panel-new', {
      state: 'visible',
      timeout: 3000
    })
    .catch(() => null)

  // 等待一分钟用户登录
  await page
    .waitForSelector('#login-panel-new', {
      state: 'hidden',
      timeout: 60000
    })
    .catch(() => null)
  // 等待登录数据存入缓存
  await sleep(1000)
  const state = await context.storageState()
  const douyinOrigin = state.origins.find((o) => o.origin === 'https://www.douyin.com')
  if (douyinOrigin == null) {
    await context.close()
    return
  }
  const isLogin = douyinOrigin.localStorage.some(
    (item) => item.name === 'HasUserLogin' && item.value === '1'
  )
  if (isLogin) {
    storage.set(StorageKey.auth, state)
  } else {
    storage.delete(StorageKey.auth)
  }
  await context.close()
}

export async function startACTask(): Promise<void> {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Example: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' on Windows
    headless: false
  })
  const context = await browser.newContext({
    storageState: storage.get(StorageKey.auth) ?? {}
  })
  const page = await context.newPage()
  await page.goto('https://www.douyin.com/?recommend=1')
  await sleep(5000)
  await context.close()
}
