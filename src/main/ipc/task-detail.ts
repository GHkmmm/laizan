import { ipcMain } from 'electron'
import { taskHistoryService } from '../service/task-history'
import { TaskHistoryRecord } from '@/shared/task-history'

/**
 * 注册任务详情相关的 IPC 处理器
 */
export function registerTaskDetailIPC(): void {
  // 获取任务详情
  ipcMain.handle('taskDetail:get', async (_, taskId: string): Promise<TaskHistoryRecord | null> => {
    return taskHistoryService.getTaskDetail(taskId)
  })

  // 获取当前正在运行的任务
  ipcMain.handle('taskDetail:getCurrentRunning', async (): Promise<TaskHistoryRecord | null> => {
    return taskHistoryService.getCurrentRunningTask()
  })
}
