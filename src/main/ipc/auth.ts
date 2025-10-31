import { ipcMain } from 'electron'
import { storage, StorageKey } from '../utils/storage'
import { loginAndStorageState } from '../service/feed-ac'

/**
 * 注册认证相关的 IPC 处理器
 */
export function registerAuthIPC(): void {
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
}
