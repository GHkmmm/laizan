import { BrowserWindow, dialog, ipcMain, OpenDialogOptions } from 'electron'

/**
 * 注册文件选择相关的 IPC 处理器
 */
export function registerFilePickerIPC(): void {
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
}
