import { BrowserWindow, ipcMain } from 'electron'
import ACTask from '../service/feed-ac'
import { taskHistoryService } from '../service/task-history'
import { getFeedAcSettings } from '../service/feed-ac/settings'

/**
 * 注册任务控制相关的 IPC 处理器
 * 使用闭包封装任务状态，避免污染全局作用域
 */
export function registerTaskIPC(): void {
  let currentTask: ACTask | null = null
  let running = false
  let currentTaskId: string | null = null // 当前运行任务的 ID

  ipcMain.handle('task:start', async (event) => {
    if (running) {
      return { ok: false, message: 'Task already running' }
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    currentTask = new ACTask()
    running = true

    // 获取配置并创建任务记录
    const settings = getFeedAcSettings()
    const taskRecord = taskHistoryService.createTask(settings)
    currentTaskId = taskRecord.id

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
        // 任务成功完成
        if (currentTaskId) {
          taskHistoryService.endTask(currentTaskId, 'completed')
        }
        win?.webContents.send('task:ended', { status: 'success' })
      } catch (err) {
        const msg = String(err)
        const isClosed = msg.includes('Task stopped') || msg.includes('has been closed')
        
        // 更新任务状态
        if (currentTaskId) {
          if (isClosed) {
            taskHistoryService.endTask(currentTaskId, 'stopped')
          } else {
            taskHistoryService.endTask(currentTaskId, 'error', msg)
          }
        }
        
        win?.webContents.send('task:ended', {
          status: isClosed ? 'stopped' : 'error',
          message: msg
        })
      } finally {
        running = false
        currentTask = null
        currentTaskId = null
      }
    })()

    return { ok: true, taskId: taskRecord.id }
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
