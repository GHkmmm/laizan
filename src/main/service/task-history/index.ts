import { customAlphabet } from 'nanoid'
import { TaskHistoryRecord, VideoRecord, TaskStatus } from '@/shared/task-history'
import { FeedAcSettingsV2 } from '@/shared/feed-ac-setting'
import { taskHistoryStorage } from './storage'

// 使用 nanoid 生成任务 ID
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)

/**
 * 任务历史服务类
 */
export class TaskHistoryService {
  /**
   * 创建新的任务记录
   * @param settings 任务配置快照
   * @returns 创建的任务记录
   */
  createTask(settings: FeedAcSettingsV2): TaskHistoryRecord {
    const task: TaskHistoryRecord = {
      id: nanoid(),
      startTime: Date.now(),
      endTime: null,
      status: 'running',
      commentCount: 0,
      videoRecords: [],
      settings: JSON.parse(JSON.stringify(settings)) // 深拷贝配置
    }
    
    taskHistoryStorage.add(task)
    return task
  }

  /**
   * 添加视频记录到当前任务
   * @param taskId 任务 ID
   * @param videoRecord 视频记录
   */
  addVideoRecord(taskId: string, videoRecord: VideoRecord): void {
    const task = taskHistoryStorage.getById(taskId)
    if (!task) {
      console.error(`Task ${taskId} not found`)
      return
    }
    
    task.videoRecords.push(videoRecord)
    
    // 如果是成功评论，更新评论计数
    if (videoRecord.isCommented) {
      task.commentCount++
    }
    
    taskHistoryStorage.update(taskId, {
      videoRecords: task.videoRecords,
      commentCount: task.commentCount
    })
  }

  /**
   * 结束任务
   * @param taskId 任务 ID
   * @param status 最终状态
   * @param errorMessage 错误信息（可选）
   */
  endTask(taskId: string, status: 'completed' | 'stopped' | 'error', errorMessage?: string): void {
    const updates: Partial<TaskHistoryRecord> = {
      endTime: Date.now(),
      status
    }
    
    if (errorMessage) {
      updates.errorMessage = errorMessage
    }
    
    taskHistoryStorage.update(taskId, updates)
  }

  /**
   * 获取任务列表
   * @returns 任务历史记录列表
   */
  getTaskList(): TaskHistoryRecord[] {
    return taskHistoryStorage.getAll()
  }

  /**
   * 获取任务详情
   * @param taskId 任务 ID
   * @returns 任务记录或 null
   */
  getTaskDetail(taskId: string): TaskHistoryRecord | null {
    return taskHistoryStorage.getById(taskId)
  }

  /**
   * 删除任务记录
   * @param taskId 任务 ID
   * @returns 是否删除成功
   */
  deleteTask(taskId: string): boolean {
    return taskHistoryStorage.delete(taskId)
  }

  /**
   * 获取当前正在运行的任务
   * @returns 运行中的任务或 null
   */
  getCurrentRunningTask(): TaskHistoryRecord | null {
    return taskHistoryStorage.getCurrentRunningTask()
  }

  /**
   * 初始化服务，修正异常关闭的任务
   */
  init(): void {
    taskHistoryStorage.fixAbnormalTasks()
  }
}

export const taskHistoryService = new TaskHistoryService()
