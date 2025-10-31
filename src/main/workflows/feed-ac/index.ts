import { Browser, chromium, Page } from '@playwright/test'
import { random, sleep } from '@/utils/common'
import { storage, StorageKey } from '../../utils/storage'
import { CommentResponse, FeedItem, FeedListResponse } from './types'
import * as fs from 'fs'
import * as path from 'path'
import DYElementHandler from '../../elements/douyin'
import { ArkService } from '../../integration/ai/ark'
import { EventEmitter } from 'events'
import { getFeedAcSettings } from './settings'
import { FeedAcRuleGroups, FeedAcSettingsV2 } from '@/shared/feed-ac-setting'
import { getAISettings } from '../ai/settings'

// 检查视频活跃度的接口
interface VideoActivityResult {
  isActive: boolean
  reason: string
}

export async function loginAndStorageState(): Promise<void> {
  const execPath = storage.get(StorageKey.browserExecPath)
  if (!execPath) {
    throw new Error('Browser executable path not found')
  }
  const browser = await chromium.launch({
    executablePath: execPath,
    headless: false
  })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://www.douyin.com/?recommend=1')
  // 等待登录面板显示
  await page
    .waitForSelector('#login-panel-new', {
      state: 'visible',
      timeout: 6000
    })
    .catch(() => null)

  // 等待一分钟用户登录
  await page
    .waitForSelector('#login-panel-new', {
      state: 'hidden',
      timeout: 1000 * 60 * 3
    })
    .catch(() => null)
  // 等待登录数据存入缓存
  await sleep(1000)
  const state = await context.storageState()
  const douyinOrigin = state.origins.find((o) => o.origin === 'https://www.douyin.com')
  if (douyinOrigin == null) {
    await context.close()
    await browser.close()
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
  await browser.close()
}

export default class ACTask extends EventEmitter {
  private _browser?: Browser
  private _page?: Page
  private _dyElementHandler!: DYElementHandler
  private _stopped: boolean = false

  // 用于缓存视频数据的Map
  private _videoDataCache = new Map<string, FeedItem>()

  constructor() {
    super()
  }

  async _launch(): Promise<void> {
    const execPath = storage.get(StorageKey.browserExecPath)
    if (!execPath) {
      throw new Error('Browser executable path not found')
    }
    const browser = await chromium.launch({
      executablePath: execPath,
      headless: false
    })
    const context = await browser.newContext({
      storageState: storage.get(StorageKey.auth) ?? {}
    })
    this._browser = browser
    this._page = await context.newPage()
    this._page.goto('https://www.douyin.com/?recommend=1')
    this._dyElementHandler = new DYElementHandler(this._page)
  }

  public async run(): Promise<void> {
    await this._launch()
    const settings = getFeedAcSettings()
    // 设置视频数据监听
    await this._setupVideoDataListener()
    console.log('视频数据监听已设置')
    this._emitProgress('ready', '视频数据监听已设置')
    // 等待假视频图片消失 (recommend-fake-video-img)
    await this._page!.waitForSelector('.recommend-fake-video-img', {
      state: 'detached'
    })
    console.log('视频已加载完成')
    this._emitProgress('loaded', '视频已加载完成')

    let commentCount = 0 // 记录已评论次数

    const maxCount = settings.maxCount || 10

    // 循环处理视频，直到达到评论次数限制
    for (let i = 0; commentCount < maxCount; i++) {
      if (this._stopped) {
        throw new Error('Task stopped')
      }
      console.log(
        `\n\n====== 开始处理第 ${i + 1} 个视频，已评论次数：${commentCount}/${maxCount} ======\n\n`
      )
      this._emitProgress(
        'processing',
        `开始处理第 ${i + 1} 个视频，已评论次数：${commentCount}/${maxCount}`
      )

      // 获取当前视频信息
      const videoInfo = await this._getCurrentVideoInfo()

      if (!videoInfo) {
        console.log('未获取到当前视频信息，跳到下一个视频')
        this._emitProgress('info-miss', '未获取到当前视频信息，跳到下一个视频')
        await sleep(random(1000, 3000))
        await this._dyElementHandler.goToNextVideo()
        continue
      }

      if (videoInfo.aweme_type !== 0) {
        console.log('不是常规视频，直接跳过')
        this._emitProgress('skip-nonstandard', '不是常规视频，直接跳过')
        await this._dyElementHandler.goToNextVideo()
        continue
      }

      const videoDescription = videoInfo.desc
      console.log(`视频作者: @${videoInfo.author.nickname} (ID: ${videoInfo.author.uid})`)
      console.log(`视频描述: ${videoDescription}`)

      // 输出视频标签信息
      if (Array.isArray(videoInfo.video_tag) && videoInfo.video_tag.length > 0) {
        console.log(`视频标签: ${JSON.stringify(videoInfo.video_tag)}`)
      } else {
        console.log('暂无视频标签')
      }

      // 关键词屏蔽（基于设置）
      const hitAuthorBlock = (settings.authorBlockKeywords || []).some((keyword) =>
        videoInfo.author.nickname.includes(keyword)
      )
      const hitBlock = (settings.blockKeywords || []).some((keyword) =>
        videoDescription.includes(keyword)
      )

      if (hitBlock || hitAuthorBlock) {
        console.log(
          `视频${hitBlock ? '描述' : '作者'}命中屏蔽关键词，跳过该视频。` +
            (hitBlock
              ? `屏蔽关键词: ${settings.blockKeywords
                  .filter((k) => videoDescription.includes(k))
                  .join(',')} 视频描述: ${videoDescription}`
              : `屏蔽关键词: ${settings.authorBlockKeywords
                  .filter((k) => videoInfo.author.nickname.includes(k))
                  .join(',')} 视频作者: ${videoInfo.author.nickname}`)
        )
        this._emitProgress('skip-blocked', '命中屏蔽关键词，跳过该视频')
        await sleep(random(500, 1000))
        await this._dyElementHandler.goToNextVideo()
        continue
      }

      // 分析视频是否需要评论与是否需要模拟观看
      const videoAnalysis = await this._analyzeVideoType(videoInfo, settings)

      if (videoAnalysis.shouldViewComment) {
        console.log('视频需要评论')
        // 针对需要评论的视频，若需要模拟观看，则先观看再评论
        if (videoAnalysis.shouldSimulateWatch) {
          const watchTime = this._calculateWatchTime(settings)
          console.log(`先模拟观看 ${watchTime / 1000} 秒`)
          this._emitProgress('watch', `模拟观看 ${Math.floor(watchTime / 1000)} 秒`)
          await sleep(watchTime)
        }

        // await this._randomLike()

        // 打开评论区
        console.log('打开评论区并监听评论接口')
        this._emitProgress('open-comment', '打开评论区并监听评论接口')

        const activityCheck = await this._openCommentSectionAndMonitor()
        if (settings.onlyCommentActiveVideo) {
          console.log('视频活跃度判断结果:', activityCheck.activityInfo)
        } else {
          console.log('跳过活跃度检查，直接评论')
          activityCheck.shouldComment = true
          activityCheck.activityInfo = '跳过活跃度检查，直接评论'
        }
        this._emitProgress('activity', activityCheck.activityInfo)

        // 浏览评论区2～4秒
        console.log('浏览评论区2-4秒')
        this._emitProgress('browse-comment', '浏览评论区2-4秒')
        await sleep(random(2000, 4000))

        if (activityCheck.shouldComment) {
          console.log('尝试发布评论')
          this._emitProgress('try-comment', '尝试发布评论')
          const commentSuccess = await this._postComment(videoAnalysis.matchedRuleGroup)
          if (commentSuccess) {
            commentCount++
            console.log(`评论发送成功，已评论次数：${commentCount}/${maxCount}`)
            this._emitProgress('comment-success', `评论成功 ${commentCount}/${maxCount}`)
            await sleep(random(1000, 3000))
            console.log('关闭评论区')
            await this._dyElementHandler.closeCommentSection()
            await sleep(random(1000, 2000))
            if (commentCount >= maxCount) {
              console.log(`已达到评论次数限制 ${maxCount}，任务完成`)
              this._emitProgress('completed', `已达到评论次数限制 ${maxCount}，任务完成`)
              break
            }
          } else {
            console.log('评论发送失败，尝试通过点击按钮关闭评论区')
            this._emitProgress('comment-fail', '评论发送失败')
            try {
              await this._dyElementHandler.closeCommentSectionByButton()
            } catch (closeError) {
              console.log('关闭评论区失败:', closeError)
            }
            await sleep(random(1000, 2000))
          }
        } else {
          console.log('视频活跃度不符合标准，不发布评论')
          this._emitProgress('inactive', '视频活跃度不符合标准，不发布评论')
          await this._dyElementHandler.closeCommentSection()
          await sleep(random(1000, 2000))
        }

        await sleep(random(500, 3000))
      } else {
        // 不需要评论的视频快速滑走
        await sleep(random(500, 1500))
        console.log('当前视频不满足评论规则，快速滑走')
        this._emitProgress('fast-skip', '快速滑走')
      }

      // 跳转至下一条视频
      console.log('跳转至下一条视频')
      await this._dyElementHandler.goToNextVideo()
    }

    await this._close()
  }

  public async stop(): Promise<void> {
    this._stopped = true
    await this._close()
  }

  private async _close(): Promise<void> {
    if (!this._page || !this._browser) return
    // 在关闭页面前更新本地登录缓存，避免下次仍然使用初始缓存
    const context = this._page.context()
    const state = await context.storageState()
    storage.set(StorageKey.auth, state)

    this._page.close()
    this._browser.close()

    this._page = undefined
    this._browser = undefined
  }

  private _emitProgress(type: string, message: string): void {
    this.emit('progress', { type, message, timestamp: Date.now() })
  }

  // 监听并缓存视频信息接口数据
  async _setupVideoDataListener(): Promise<void> {
    console.log('设置视频信息接口监听...')

    // 添加响应监听器
    this._page?.on('response', async (response) => {
      const url = response.url()
      if (url.includes('https://www.douyin.com/aweme/v1/web/tab/feed/')) {
        console.log('捕获到视频Feed接口请求')

        try {
          // 尝试解析JSON响应
          const responseBody = (await response.json()) as FeedListResponse
          if (responseBody && responseBody.aweme_list && Array.isArray(responseBody.aweme_list)) {
            console.log(`接收到${responseBody.aweme_list.length}条视频数据`)

            // 缓存视频数据
            responseBody.aweme_list.forEach((video) => {
              this._videoDataCache.set(video.aweme_id, video)
            })

            console.log(`视频数据缓存更新，当前缓存数量: ${this._videoDataCache.size}`)
          }
        } catch (error) {
          console.log('解析视频Feed接口响应时出错:', error)
        }
      }
    })
  }

  // 根据配置设置视频浏览时间
  _calculateWatchTime(settings: ReturnType<typeof getFeedAcSettings>): number {
    const [minSeconds, maxSeconds] = settings.watchTimeRangeSeconds || [5, 15]
    const watchTime = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
    console.log(`计算浏览时间: ${watchTime}秒 (基于用户设置 ${minSeconds}-${maxSeconds} 秒)`)
    return watchTime * 1000
  }

  // 获取当前视频的信息
  async _getCurrentVideoInfo(): Promise<FeedItem | null> {
    try {
      // 查找当前活跃视频元素
      const activeVideoElement = await this._page?.$('[data-e2e="feed-active-video"]')

      if (!activeVideoElement) {
        console.log('未找到当前活跃视频元素')
        return null
      }

      // 获取视频ID属性
      const videoId = await activeVideoElement.getAttribute('data-e2e-vid')

      if (!videoId) {
        console.log('未找到视频ID')
        return null
      }

      console.log(`当前活跃视频ID: ${videoId}`)

      // 从缓存中查找视频数据
      const videoData = this._videoDataCache.get(videoId)

      if (!videoData) {
        console.log(`未在缓存中找到视频ID: ${videoId} 的数据`)
        return null
      }

      // console.log(`从缓存中获取到视频数据: ${JSON.stringify(videoData)}`)

      // 使用后从缓存中删除数据
      this._videoDataCache.delete(videoId)
      console.log(`删除已使用的视频数据，当前缓存数量: ${this._videoDataCache.size}`)

      return videoData
    } catch (error) {
      console.log('获取当前视频信息时出错:', error)
      return null
    }
  }

  // 递归匹配规则组 - 同级规则组只要有一个匹配成功就停止
  async _matchRuleGroups(
    ruleGroups: FeedAcRuleGroups[],
    videoInfo: FeedItem
  ): Promise<FeedAcRuleGroups | null> {
    for (const ruleGroup of ruleGroups) {
      const matched = await this._matchRuleGroup(ruleGroup, videoInfo)
      if (matched) {
        return matched
      }
    }
    return null
  }

  // 匹配单个规则组 - 如果匹配成功且有子规则组，必须继续匹配子规则组
  async _matchRuleGroup(
    ruleGroup: FeedAcRuleGroups,
    videoInfo: FeedItem
  ): Promise<FeedAcRuleGroups | null> {
    let currentRuleGroupMatched = false

    // 如果是AI判断类型
    if (ruleGroup.type === 'ai' && ruleGroup.aiPrompt) {
      try {
        const aiSettings = getAISettings()
        const arkService = new ArkService({
          apiKey: aiSettings.apiKeys[aiSettings.platform],
          model: aiSettings.model
        })

        const videoInfoStr = JSON.stringify({
          author: videoInfo.author.nickname,
          videoDesc: videoInfo.desc,
          videoTag: videoInfo.video_tag
        })

        const aiResult = await arkService.analyzeVideoType(videoInfoStr, ruleGroup.aiPrompt)
        console.log(`AI规则组 "${ruleGroup.name}" 判断结果:`, aiResult)

        currentRuleGroupMatched = aiResult.shouldWatch
      } catch (error) {
        console.error(`AI规则组 "${ruleGroup.name}" 判断失败:`, error)
        currentRuleGroupMatched = false
      }
    }

    // 如果是手动配置类型
    if (ruleGroup.type === 'manual' && ruleGroup.rules && ruleGroup.rules.length > 0) {
      const relation = ruleGroup.relation || 'or'
      const matches = ruleGroup.rules.map((rule) => {
        if (!rule || !rule.keyword) return false
        if (rule.field === 'nickName') {
          return videoInfo.author.nickname.includes(rule.keyword)
        }
        if (rule.field === 'videoDesc') {
          return (videoInfo.desc || '').includes(rule.keyword)
        }
        if (rule.field === 'videoTag') {
          return (videoInfo.video_tag || []).some((t) => t.tag_name.includes(rule.keyword))
        }
        return false
      })

      currentRuleGroupMatched = relation === 'and' ? matches.every(Boolean) : matches.some(Boolean)

      if (currentRuleGroupMatched) {
        console.log(`手动规则组 "${ruleGroup.name}" 匹配成功`)
      }
    }

    // 如果当前规则组匹配成功
    if (currentRuleGroupMatched) {
      // 如果有子规则组，必须继续匹配子规则组
      if (ruleGroup.children && ruleGroup.children.length > 0) {
        const matchedChild = await this._matchRuleGroups(ruleGroup.children, videoInfo)
        if (matchedChild) {
          return matchedChild
        } else {
          // 子规则组没有匹配成功，当前规则组也不算匹配成功
          return null
        }
      } else {
        // 没有子规则组，当前规则组就是最终匹配的规则组
        return ruleGroup
      }
    }

    return null
  }

  // 根据用户配置的规则判断是否需要评论及是否需要模拟观看
  async _analyzeVideoType(
    videoInfo: FeedItem,
    settings: FeedAcSettingsV2
  ): Promise<{
    shouldSimulateWatch: boolean
    shouldViewComment: boolean
    matchedRuleGroup?: FeedAcRuleGroups
  }> {
    // 使用V2规则组匹配
    const matchedRuleGroup = await this._matchRuleGroups(settings.ruleGroups, videoInfo)

    // 如果没有匹配的规则组，直接返回不观看
    if (!matchedRuleGroup) {
      return {
        shouldSimulateWatch: false,
        shouldViewComment: false
      }
    }

    console.log(`匹配到规则组: ${matchedRuleGroup.name}`)

    // 规则匹配成功，返回观看
    return {
      shouldSimulateWatch: Boolean(settings.simulateWatchBeforeComment),
      shouldViewComment: true,
      matchedRuleGroup
    }
  }

  // 从resources目录下读取可用的城市文件夹
  _getAvailableCities(): string[] {
    try {
      const resourcesPath = path.join(process.cwd(), 'resources/ac_assets')
      const directories = fs
        .readdirSync(resourcesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      return directories
    } catch (error) {
      console.log('读取resources目录出错:', error)
      // 如果出错，返回空数组
      return []
    }
  }

  // 随机点赞操作，按10%概率执行
  async _randomLike(): Promise<boolean> {
    try {
      // 按照10%的概率进行点赞操作
      const shouldLike = Math.random() < 0.1
      if (shouldLike) {
        console.log('随机触发点赞操作')
        await this._dyElementHandler.like()
        // 点赞后随机等待1-3秒
        await sleep(random(1000, 3000))
        return true
      }
      return false
    } catch (error) {
      console.log('执行点赞操作时出错:', error)
      return false
    }
  }

  async _postComment(matchedRuleGroup?: FeedAcRuleGroups): Promise<boolean> {
    try {
      // 从用户配置中获取随机评论内容
      const randomComment = this._getRandomComment(matchedRuleGroup)
      console.log(`随机选择评论内容: ${randomComment}`)

      // 查找评论输入框容器
      const inputContainerSelector = '.comment-input-inner-container'
      console.log('查找评论输入框容器...')

      // 等待输入框容器出现并点击，设置5秒超时
      const inputContainer = await this._page
        ?.waitForSelector(inputContainerSelector, { timeout: 5000 })
        .catch(() => null)
      if (!inputContainer) {
        console.log('未找到评论输入框容器')
        return false
      }

      await inputContainer.click()
      console.log('成功点击评论输入框容器')

      // 等待一小段时间确保输入框已聚焦
      await sleep(1000)

      // 模拟人类输入行为，一个字符一个字符地输入，并在字符之间添加随机延迟
      console.log(`开始模拟人类输入评论: ${randomComment}`)
      for (let i = 0; i < randomComment.length; i++) {
        // 输入单个字符
        await this._page?.keyboard.type(randomComment[i])

        // 添加随机延迟，模拟人类输入速度（100-300毫秒）
        await sleep(random(100, 300))

        // 随机在某些字符后暂停稍长时间（模拟思考）
        if (Math.random() < 0.1 && i < randomComment.length - 1) {
          const pauseDelay = Math.floor(Math.random() * 500) + 300
          await sleep(pauseDelay)
        }
      }

      console.log(`完成模拟人类输入评论: ${randomComment}`)

      // 随机等待1-3秒
      await sleep(random(1000, 3000))

      // 尝试添加图片
      try {
        // 从用户配置中获取图片路径
        const imagePath = this._selectImagePath(matchedRuleGroup)
        console.log(`选择图片路径: ${imagePath}`)

        // 如果配置了图片路径，则上传图片
        if (imagePath && fs.existsSync(imagePath)) {
          // 使用fileChooser方法上传图片
          try {
            const uploadBtnSelector = '.commentInput-right-ct > div > span:nth-child(2)'
            console.log('点击上传按钮并等待文件选择器...')

            // 设置文件选择器监听并点击上传按钮
            const [fileChooser] = await Promise.all([
              // 等待文件选择器出现
              this._page?.waitForEvent('filechooser', { timeout: 5000 }),
              // 点击上传按钮触发文件选择器
              this._page?.click(uploadBtnSelector)
            ])

            // 设置文件
            await fileChooser?.setFiles(imagePath)
            console.log('通过fileChooser成功上传图片')

            // 等待图片上传完成和预览显示
            console.log('等待图片上传和预览...')
            await sleep(2000)
          } catch (uploadError) {
            console.log('上传图片失败:', uploadError)
            // 图片上传失败，取消发送评论
            console.log('由于图片上传失败，取消发送评论')
            return false
          }
        } else {
          console.log('未配置图片或图片路径无效，跳过图片上传')
        }
      } catch (error) {
        console.log('添加图片过程中出错:', error)
        // 图片添加过程出错，取消发送评论
        console.log('由于图片添加过程出错，取消发送评论')
        return false
      }

      // 输入完成后稍微暂停一下，然后按回车键发送评论
      await sleep(random(500, 1000))
      console.log('按回车键发送评论')

      // 创建一个Promise来等待评论发布接口响应
      const commentResponsePromise = new Promise<{
        success: boolean
        reason: string
      }>((resolve) => {
        // 创建临时响应监听器
        const responseListener = async (response): Promise<void> => {
          const url = response.url()
          if (url.includes('https://www.douyin.com/aweme/v1/web/comment/publish')) {
            console.log('捕获到评论发布接口响应')

            try {
              const responseBody = await response.json().catch(() => null)

              // 移除监听器，防止重复处理
              this._page?.removeListener('response', responseListener)
              // 清除超时计时器
              clearTimeout(timeoutId)

              // 根据status_code判断评论是否发送成功
              if (responseBody && responseBody.status_code === 0) {
                console.log('评论发送成功: status_code = 0')
                resolve({ success: true, reason: '评论发布接口返回成功状态码' })
              } else {
                const errorCode = responseBody ? responseBody.status_code : '未知'
                console.log(`评论发送失败: status_code = ${errorCode}`)
                resolve({
                  success: false,
                  reason: `评论发布接口返回错误状态码: ${errorCode}`
                })
              }
            } catch (error) {
              console.log('解析评论发布接口响应时出错:', error)
              this._page?.removeListener('response', responseListener)
              // 清除超时计时器
              clearTimeout(timeoutId)
              resolve({ success: false, reason: '解析评论发布接口响应出错' })
            }
          }
        }

        // 添加响应监听器
        this._page?.on('response', responseListener)

        // 设置超时处理，5秒后如果没有捕获到评论发布响应就移除监听器
        const timeoutId = setTimeout(() => {
          this._page?.removeListener('response', responseListener)
          console.log('评论发布接口响应监听超时，未捕获到数据')
          resolve({ success: false, reason: '评论发布接口响应监听超时' })
        }, 5000)
      })

      // 发送评论
      await this._page?.keyboard.press('Enter')

      // 等待评论发布接口响应
      console.log('等待评论发布接口响应...')
      const commentResult = await commentResponsePromise

      // 延迟1秒
      await sleep(1000)

      if (!commentResult.success) {
        console.log(`评论发送失败: ${commentResult.reason}`)

        // 评论发送失败时检查是否出现验证码弹窗
        const verifyDialogResult = await this._handleVerifyDialog()
        if (!verifyDialogResult.success) {
          console.log(`验证码处理失败: ${verifyDialogResult.reason}`)
          throw new Error(`评论验证码处理失败: ${verifyDialogResult.reason}`)
        }

        // 验证码处理完成后，重新尝试发送评论
        console.log('无需处理验证码或验证码处理完成')
      }

      console.log('评论已发送成功')
      return true
    } catch (error) {
      console.log('发布评论时出错:', error)
      return false
    }
  }

  // 随机选择评论内容
  _getRandomComment(matchedRuleGroup?: FeedAcRuleGroups): string {
    // 优先从匹配的规则组中获取评论内容
    if (
      matchedRuleGroup &&
      matchedRuleGroup.commentTexts &&
      matchedRuleGroup.commentTexts.length > 0
    ) {
      const randomIndex = Math.floor(Math.random() * matchedRuleGroup.commentTexts.length)
      return matchedRuleGroup.commentTexts[randomIndex]
    }

    // 如果没有匹配的规则组或规则组没有配置评论内容，抛出错误
    throw new Error('未配置评论文案，请在规则组中配置评论内容')
  }

  // 使用快捷键开启评论区并监听评论接口数据
  async _openCommentSectionAndMonitor(): Promise<{ shouldComment: boolean; activityInfo: string }> {
    try {
      // 确保当前页面已加载完成
      await this._page?.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {
        console.log('等待页面加载完成超时，继续执行')
      })

      console.log('设置评论接口监听...')

      // 创建一个Promise来等待评论数据
      const commentDataPromise = new Promise<{
        shouldComment: boolean
        activityInfo: string
      }>((resolve) => {
        // 创建临时响应监听器
        const responseListener = async (response): Promise<void> => {
          const url = response.url()
          if (url.includes('https://www.douyin.com/aweme/v1/web/comment/list/')) {
            console.log('捕获到评论列表接口请求')

            try {
              // 尝试解析JSON响应
              const responseBody = (await response.json().catch(() => null)) as CommentResponse
              if (responseBody) {
                // 判断视频活跃度
                const activityResult = this._checkVideoActivity(responseBody)
                console.log('视频活跃度检查结果:', activityResult.reason)

                // 移除监听器，防止重复处理
                this._page?.removeListener('response', responseListener)
                // 清除超时计时器
                clearTimeout(timeoutId)
                resolve({
                  shouldComment: activityResult.isActive,
                  activityInfo: activityResult.reason
                })
              } else {
                console.log('无法解析评论列表接口返回的JSON数据')
                // 移除监听器，默认不评论
                this._page?.removeListener('response', responseListener)
                // 清除超时计时器
                clearTimeout(timeoutId)
                resolve({
                  shouldComment: false,
                  activityInfo: '无法解析评论数据'
                })
              }
            } catch (error) {
              console.log('解析评论列表接口响应时出错:', error)
              // 移除监听器，默认不评论
              this._page?.removeListener('response', responseListener)
              // 清除超时计时器
              clearTimeout(timeoutId)
              resolve({
                shouldComment: false,
                activityInfo: '解析评论数据出错'
              })
            }
          }
        }

        // 添加响应监听器
        this._page?.on('response', responseListener)

        // 设置超时处理，10秒后如果没有捕获到评论数据就移除监听器
        const timeoutId = setTimeout(() => {
          this._page?.removeListener('response', responseListener)
          console.log('评论数据监听超时，未捕获到数据')
          resolve({
            shouldComment: false,
            activityInfo: '监听超时，未捕获到评论数据'
          })
        }, 10000)
      })

      // 使用键盘快捷键 "X" 开启评论区
      console.log('使用快捷键X打开评论区')
      await this._page?.keyboard.press('x')

      // 等待评论数据
      return await commentDataPromise
    } catch (error) {
      console.log('打开评论区并监听数据时出错:', error)
      return {
        shouldComment: false,
        activityInfo: '打开评论区出错'
      }
    }
  }

  // 检查视频活跃度
  _checkVideoActivity(commentData: CommentResponse): VideoActivityResult {
    if (!commentData || !commentData.comments || !Array.isArray(commentData.comments)) {
      return { isActive: false, reason: '评论数据格式错误' }
    }

    const comments = commentData.comments
    const now = Math.floor(Date.now() / 1000) // 当前时间戳（秒）
    const twoDaysInSeconds = 2 * 24 * 60 * 60 // 2天的秒数
    const oneDayInSeconds = 24 * 60 * 60 // 1天的秒数

    // 判断逻辑：前5条评论至少需要2条是两天内的；如果评论总数不足5条，则需要有至少1条位于1天内
    if (comments.length >= 5) {
      // 评论数量足够，检查前5条评论中有多少是两天内的
      const recentComments = comments.slice(0, 5).filter((comment) => {
        return now - comment.create_time < twoDaysInSeconds
      })

      const isActive = recentComments.length >= 2
      const reason = isActive
        ? `前5条评论中有${recentComments.length}条在2天内，符合活跃标准`
        : `前5条评论中只有${recentComments.length}条在2天内，不符合活跃标准`

      return { isActive, reason }
    } else {
      // 评论数量不足5条，检查是否至少有1条在1天内
      const recentComments = comments.filter((comment) => {
        return now - comment.create_time < oneDayInSeconds
      })

      const isActive = recentComments.length >= 1
      const reason = isActive
        ? `评论数量为${comments.length}，有${recentComments.length}条在1天内，符合活跃标准`
        : `评论数量为${comments.length}，但没有评论在1天内，不符合活跃标准`

      return { isActive, reason }
    }
  }

  // 根据视频描述选择合适的图片路径
  // 选择图片路径
  _selectImagePath(matchedRuleGroup?: FeedAcRuleGroups): string {
    // 优先从匹配的规则组中获取图片配置
    if (matchedRuleGroup && matchedRuleGroup.commentImagePath) {
      if (matchedRuleGroup.commentImageType === 'file') {
        // 单文件模式
        return fs.existsSync(matchedRuleGroup.commentImagePath)
          ? matchedRuleGroup.commentImagePath
          : ''
      } else {
        // 文件夹模式
        return this._getRandomImageFromFolder(matchedRuleGroup.commentImagePath)
      }
    }

    // 如果没有匹配的规则组或规则组没有配置图片，返回空字符串（不配置图片）
    return ''
  }

  // 从文件夹随机选择图片
  _getRandomImageFromFolder(folderPath: string): string {
    try {
      const files = fs.readdirSync(folderPath).filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
      })

      if (files.length === 0) {
        return ''
      }

      const randomIndex = Math.floor(Math.random() * files.length)
      return path.join(folderPath, files[randomIndex])
    } catch (error) {
      console.log(`读取文件夹 ${folderPath} 出错:`, error)
      return ''
    }
  }

  // 处理验证码弹窗
  private async _handleVerifyDialog(): Promise<{ success: boolean; reason: string }> {
    try {
      console.log('检查是否出现验证码弹窗...')

      // 使用waitForSelector等待验证码弹窗出现，设置3秒超时
      const verifyDialog = await this._page
        ?.waitForSelector('.second-verify-panel', {
          state: 'visible',
          timeout: 3000
        })
        .catch(() => null)

      if (!verifyDialog) {
        console.log('未检测到验证码弹窗，继续执行')
        return { success: true, reason: '未检测到验证码弹窗' }
      }

      console.log('检测到验证码弹窗，等待用户输入验证码...')
      this._emitProgress('verify-dialog', '检测到验证码弹窗，请到浏览器中输入验证码')

      // 等待验证码弹窗消失，最多等待60秒
      try {
        await this._page?.waitForSelector('.second-verify-panel', {
          state: 'detached',
          timeout: 60000
        })

        console.log('验证码弹窗已消失，用户已完成验证码输入')
        this._emitProgress('verify-success', '验证码输入完成，继续执行任务')
        return { success: true, reason: '验证码输入完成' }
      } catch (error) {
        console.error(error)
        const reason = '验证码弹窗等待超时（60秒），请检查验证码输入'
        this._emitProgress('verify-timeout', reason)
        return { success: false, reason }
      }
    } catch (error) {
      const reason = `处理验证码弹窗时出错: ${error}`
      console.log(reason)
      this._emitProgress('verify-error', reason)
      return { success: false, reason }
    }
  }
}
