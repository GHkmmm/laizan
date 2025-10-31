import { BrowserWindow, ipcMain } from 'electron'
import ACTask from '../service/feed-ac'

/**
 * 注册任务控制相关的 IPC 处理器
 * 使用闭包封装任务状态，避免污染全局作用域
 */
export function registerTaskIPC(): void {
  let currentTask: ACTask | null = null
  let running = false

  ipcMain.handle('task:start', async (event) => {
    if (running) {
      return { ok: false, message: 'Task already running' }
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    currentTask = new ACTask()
    running = true

    // 订阅进度事件，主动推送到渲染进程
    currentTask.on('progress', (p) => {
      try {
        win?.webContents.send('task:progress', p)
      } catch (e) {
        console.error(e)
      }
    })

    // 异步执行任务
    ;(async () => {
      try {
        await currentTask?.run()
        win?.webContents.send('task:ended', { status: 'success' })
      } catch (err) {
        const msg = String(err)
        const isClosed = msg.includes('Task stopped') || msg.includes('has been closed')
        win?.webContents.send('task:ended', {
          status: isClosed ? 'stopped' : 'error',
          message: msg
        })
      } finally {
        running = false
        currentTask = null
      }
    })()

    return { ok: true }
  })

  ipcMain.handle('task:stop', async () => {
    if (!running || !currentTask) {
      return { ok: true }
    }
    try {
      await currentTask.stop()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: String(e) }
    }
  })
}
