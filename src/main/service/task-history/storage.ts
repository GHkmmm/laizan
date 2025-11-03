import __Store from 'electron-store'
import { TaskHistoryRecord } from '@/shared/task-history'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Store = ((__Store as any).default || __Store) as typeof __Store

const STORAGE_KEY = 'task-history-records'
const MAX_RECORDS = 10

interface TaskHistorySchema {
  [STORAGE_KEY]: TaskHistoryRecord[]
}

/**
 * 任务历史存储管理类
 */
class TaskHistoryStorage {
  private _store = new Store<TaskHistorySchema>()

  /**
   * 获取所有任务历史记录
   * @returns 按 startTime 倒序排列的任务记录数组
   */
  getAll(): TaskHistoryRecord[] {
    const records = this._store.get(STORAGE_KEY, [])
    // 确保按 startTime 倒序排列
    return records.sort((a, b) => b.startTime - a.startTime)
  }

  /**
   * 根据 ID 获取单个任务记录
   * @param taskId 任务 ID
   * @returns 任务记录或 null
   */
  getById(taskId: string): TaskHistoryRecord | null {
    const records = this.getAll()
    return records.find((r) => r.id === taskId) || null
  }

  /**
   * 获取当前正在运行的任务
   * @returns 运行中的任务记录或 null
   */
  getCurrentRunningTask(): TaskHistoryRecord | null {
    const records = this.getAll()
    return records.find((r) => r.status === 'running') || null
  }

  /**
   * 添加新的任务记录
   * @param record 任务记录
   */
  add(record: TaskHistoryRecord): void {
    let records = this.getAll()
    
    // 添加新记录
    records.unshift(record)
    
    // 保持最多 10 条记录
    if (records.length > MAX_RECORDS) {
      records = records.slice(0, MAX_RECORDS)
    }
    
    this._store.set(STORAGE_KEY, records)
  }

  /**
   * 更新任务记录
   * @param taskId 任务 ID
   * @param updates 更新的字段
   * @returns 是否更新成功
   */
  update(taskId: string, updates: Partial<TaskHistoryRecord>): boolean {
    const records = this.getAll()
    const index = records.findIndex((r) => r.id === taskId)
    
    if (index === -1) {
      return false
    }
    
    records[index] = { ...records[index], ...updates }
    this._store.set(STORAGE_KEY, records)
    return true
  }

  /**
   * 删除任务记录
   * @param taskId 任务 ID
   * @returns 是否删除成功
   */
  delete(taskId: string): boolean {
    const records = this.getAll()
    const filtered = records.filter((r) => r.id !== taskId)
    
    if (filtered.length === records.length) {
      return false // 未找到要删除的记录
    }
    
    this._store.set(STORAGE_KEY, filtered)
    return true
  }

  /**
   * 修正异常关闭导致的遗留 running 状态任务
   * 在应用启动时调用
   */
  fixAbnormalTasks(): void {
    const records = this.getAll()
    let hasChanges = false
    
    records.forEach((record) => {
      if (record.status === 'running') {
        record.status = 'error'
        record.errorMessage = '应用异常关闭，任务未正常结束'
        record.endTime = Date.now()
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      this._store.set(STORAGE_KEY, records)
    }
  }
}

export const taskHistoryStorage = new TaskHistoryStorage()
