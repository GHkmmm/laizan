import { chromium } from '@playwright/test'
// import { sleep } from '@utils/common'
import { sleep } from '@utils/common'
export async function startACTask(): Promise<void> {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Example: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' on Windows
    headless: false
  })
  const page = await browser.newPage()
  await page.goto('https://www.douyin.com/?recommend=1')
  // console.log(await page.title());
  await sleep(5000)
  await browser.close()
}
