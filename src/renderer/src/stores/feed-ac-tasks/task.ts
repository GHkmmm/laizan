import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TaskStatus = 'idle' | 'starting' | 'running' | 'stopping'

/**
 * 任务控制 Store
 * 职责：管理任务的启动、停止状态
 */
export const useTaskStore = defineStore('task', () => {
  const taskStatus = ref<TaskStatus>('idle')

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

  return {
    taskStatus,
    start,
    stop,
    resetTaskStatus
  }
})
