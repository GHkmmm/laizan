import { ipcMain } from 'electron'
import { getAiSettings, updateAiSettings } from '../workflows/feed-ac/ai-settings'
import { storage, StorageKey } from '../utils/storage'
import { getDefaultAISetting } from '@/shared/ai-setting'

/**
 * 注册 AI 设置相关的 IPC 处理器
 */
export function registerAISettingIPC(): void {
  ipcMain.handle('aiSetting:get', () => {
    return getAiSettings()
  })

  ipcMain.handle('aiSetting:update', (_e, payload: Parameters<typeof updateAiSettings>[0]) => {
    return updateAiSettings(payload)
  })

  ipcMain.handle('aiSetting:clear', () => {
    // 清除 AI 设置并返回默认值
    storage.delete(StorageKey.aiSettings)
    return getDefaultAISetting()
  })
}
