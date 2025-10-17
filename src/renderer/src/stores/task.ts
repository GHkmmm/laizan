import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TaskStatus = 'idle' | 'starting' | 'running' | 'stopping'

export interface TaskForm {
  maxCount: number
}

export const useTaskStore = defineStore('task', () => {
  const taskStatus = ref<TaskStatus>('idle')
  const formModel = ref<TaskForm>({
    maxCount: 10
  })

  const start = async (): Promise<void> => {
    if (taskStatus.value !== 'idle') return

    const count = Number(formModel.value.maxCount)
    const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1

    taskStatus.value = 'starting'

    try {
      const result = await window.api.startTask({ maxCount: safeCount })
      if (result.ok) {
        taskStatus.value = 'running'
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
    formModel,
    start,
    stop,
    resetTaskStatus
  }
})
