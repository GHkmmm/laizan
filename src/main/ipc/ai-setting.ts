import { ipcMain } from 'electron'
import { storage, StorageKey } from '../utils/storage'
import { getAISettings, getDefaultAISetting, updateAISettings } from '../service/ai/settings'
/**
 * 注册 AI 设置相关的 IPC 处理器
 */
export function registerAISettingIPC(): void {
  ipcMain.handle('aiSetting:get', () => {
    return getAISettings()
  })

  ipcMain.handle('aiSetting:update', (_e, payload: Parameters<typeof updateAISettings>[0]) => {
    return updateAISettings(payload)
  })

  ipcMain.handle('aiSetting:clear', () => {
    // 清除 AI 设置并返回默认值
    storage.delete(StorageKey.aiSettings)
    return getDefaultAISetting()
  })
}
