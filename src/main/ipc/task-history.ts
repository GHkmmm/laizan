import { ipcMain } from 'electron'
import { taskHistoryService } from '../service/task-history'
import { TaskHistoryRecord } from '@/shared/task-history'

/**
 * 注册任务历史相关的 IPC 处理器
 */
export function registerTaskHistoryIPC(): void {
  // 获取任务历史列表
  ipcMain.handle('taskHistory:getList', async (): Promise<TaskHistoryRecord[]> => {
    return taskHistoryService.getTaskList()
  })

  // 获取任务详情
  ipcMain.handle('taskHistory:getDetail', async (_, taskId: string): Promise<TaskHistoryRecord | null> => {
    return taskHistoryService.getTaskDetail(taskId)
  })

  // 删除任务记录
  ipcMain.handle('taskHistory:delete', async (_, taskId: string): Promise<{ ok: boolean; message?: string }> => {
    const success = taskHistoryService.deleteTask(taskId)
    return {
      ok: success,
      message: success ? undefined : '任务记录不存在'
    }
  })

  // 获取当前正在运行的任务
  ipcMain.handle('taskHistory:getCurrentRunningTask', async (): Promise<TaskHistoryRecord | null> => {
    return taskHistoryService.getCurrentRunningTask()
  })
}
