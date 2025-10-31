import { app, BrowserWindow, dialog, ipcMain, OpenDialogOptions } from 'electron'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  detectConfigVersion,
  FeedAcSettingsV2,
  getUnifiedFeedAcSettings
} from '@/shared/feed-ac-setting'
import {
  clearFeedAcSettings,
  getFeedAcSettings,
  updateFeedAcSettings
} from '../workflows/feed-ac/settings'

/**
 * 注册 Feed AC 配置相关的 IPC 处理器
 */
export function registerFeedAcSettingIPC(): void {
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

  // 获取配置模板列表
  ipcMain.handle('feedAcSetting:getTemplateList', async () => {
    try {
      // 使用 app.getAppPath() 获取应用根路径
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
        // 导入模板文件 - 使用 app.getAppPath() 拼接路径
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
}
