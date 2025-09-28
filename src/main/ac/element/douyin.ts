import { Page } from '@playwright/test'
import { sleep } from '@utils/common'

export default class DYElementHandler {
  private _page: Page

  constructor(page: Page) {
    this._page = page
  }

  // 检查评论区是否打开
  async isCommentSectionOpen(): Promise<boolean> {
    try {
      // 使用css选择器查找id为videoSideCard的元素
      const videoSideCard = await this._page.$('#videoSideCard')

      if (!videoSideCard) {
        console.log('未找到评论区元素(#videoSideCard)')
        return false
      }

      // 获取元素的clientWidth属性
      const clientWidth = await videoSideCard.evaluate((el) => (el as HTMLElement).clientWidth)

      // 如果clientWidth大于0，则表示评论区已打开
      const isOpen = clientWidth > 0
      console.log(`评论区状态: ${isOpen ? '已打开' : '已关闭'} (clientWidth: ${clientWidth})`)

      return isOpen
    } catch (error) {
      console.log('检查评论区状态时出错:', error)
      return false
    }
  }

  // 使用快捷键关闭评论区
  async closeCommentSection(): Promise<void> {
    try {
      // 使用键盘快捷键 "X" 关闭评论区
      console.log('使用快捷键X关闭评论区')
      await this._page.keyboard.press('x')

      // 给评论区收起一些时间
      await sleep(500)
    } catch (error) {
      console.log('关闭评论区时出错:', error)
    }
  }

  // 通过点击评论按钮关闭评论区
  async closeCommentSectionByButton(): Promise<void> {
    try {
      // 使用评论按钮选择器
      const commentButtonSelector = '[data-e2e="feed-active-video"] [data-e2e="feed-comment-icon"]'
      console.log('通过点击评论按钮关闭评论区')

      // 等待评论按钮可见并点击
      const commentButton = await this._page
        .waitForSelector(commentButtonSelector, {
          state: 'visible',
          timeout: 3000
        })
        .catch(() => null)

      if (commentButton) {
        await commentButton.click()
        console.log('成功点击评论按钮关闭评论区')
      } else {
        console.log('未找到评论按钮，尝试使用快捷键关闭')
        await this.closeCommentSection()
      }

      // 给评论区收起一些时间
      await sleep(500)
    } catch (error) {
      console.log('通过点击评论按钮关闭评论区时出错:', error)
      // 失败时尝试使用快捷键关闭
      await this.closeCommentSection()
    }
  }

  // 点赞
  async like(): Promise<void> {
    await this._page.keyboard.press('z')
    // 等待点赞动画完成
    await sleep(500)
  }
}
