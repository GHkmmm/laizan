import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TaskHistoryRecord } from '@/shared/task-history'

/**
 * 任务详情 Store
 * 职责：管理单个任务的详情数据
 */
export const useTaskDetailStore = defineStore('taskDetail', () => {
  const currentTask = ref<TaskHistoryRecord | null>(null)
  const loading = ref(false)

  /**
   * 获取任务详情
   */
  const loadTaskDetail = async (taskId: string): Promise<void> => {
    loading.value = true
    try {
      currentTask.value = await window.api.getTaskDetail(taskId)
    } catch (error) {
      console.error('Failed to load task detail:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前正在运行的任务
   */
  const loadCurrentRunningTask = async (): Promise<TaskHistoryRecord | null> => {
    try {
      const task = await window.api.getCurrentRunningTask()
      return task
    } catch (error) {
      console.error('Failed to load current running task:', error)
      return null
    }
  }

  /**
   * 刷新当前任务详情（用于运行中任务的实时更新）
   */
  const refreshCurrentTask = async (): Promise<void> => {
    if (!currentTask.value) return
    await loadTaskDetail(currentTask.value.id)
  }

  /**
   * 清空当前任务详情
   */
  const clearCurrentTask = (): void => {
    currentTask.value = null
  }

  return {
    currentTask,
    loading,
    loadTaskDetail,
    loadCurrentRunningTask,
    refreshCurrentTask,
    clearCurrentTask
  }
})
