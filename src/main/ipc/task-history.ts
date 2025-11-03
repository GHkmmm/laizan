import { ipcMain } from 'electron'
import { taskHistoryService } from '../service/task-history'
import { TaskHistoryRecord } from '@/shared/task-history'

/**
 * 注册任务历史列表相关的 IPC 处理器
 */
export function registerTaskHistoryIPC(): void {
  // 获取任务历史列表
  ipcMain.handle('taskHistory:getList', async (): Promise<TaskHistoryRecord[]> => {
    return taskHistoryService.getTaskList()
  })

  // 删除任务记录
  ipcMain.handle(
    'taskHistory:delete',
    async (_, taskId: string): Promise<{ ok: boolean; message?: string }> => {
      const success = taskHistoryService.deleteTask(taskId)
      return {
        ok: success,
        message: success ? undefined : '任务记录不存在'
      }
    }
  )
}
