import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type TaskStatus = 'idle' | 'starting' | 'running' | 'stopping'

/**
 * 任务控制 Store
 * 职责：管理任务的启动、停止状态
 */
export const useTaskStore = defineStore('task', () => {
  const taskStatus = ref<TaskStatus>('idle')

  const isRunning = computed(() => !['idle'].includes(taskStatus.value))

  const start = async (): Promise<string | undefined> => {
    if (taskStatus.value !== 'idle') return

    taskStatus.value = 'starting'

    try {
      const result = await window.api.startTask()
      if (result.ok) {
        taskStatus.value = 'running'
        return result.taskId
      } else {
        taskStatus.value = 'idle'
        throw new Error(result.message || '未知错误')
      }
    } catch (error) {
      taskStatus.value = 'idle'
      throw error
    }
  }

  const stop = async (): Promise<void> => {
    if (taskStatus.value !== 'running') return

    taskStatus.value = 'stopping'

    try {
      const result = await window.api.stopTask()
      if (!result.ok) {
        taskStatus.value = 'running'
        throw new Error(result.message || '未知错误')
      }
      // 停止成功后重置状态
      taskStatus.value = 'idle'
    } catch (error) {
      taskStatus.value = 'running'
      throw error
    }
  }

  const resetTaskStatus = (): void => {
    taskStatus.value = 'idle'
  }

  /**
   * 同步任务状态
   * 检查主进程是否有运行中的任务，并同步到本地状态
   */
  const syncTaskStatus = async (): Promise<void> => {
    try {
      const runningTask = await window.api.getCurrentRunningTask()
      if (runningTask) {
        taskStatus.value = 'running'
      } else {
        taskStatus.value = 'idle'
      }
    } catch (error) {
      console.error('同步任务状态失败:', error)
      taskStatus.value = 'idle'
    }
  }

  return {
    taskStatus,
    isRunning,
    start,
    stop,
    resetTaskStatus,
    syncTaskStatus
  }
})
