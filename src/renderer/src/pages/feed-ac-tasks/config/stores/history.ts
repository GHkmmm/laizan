import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TaskHistoryRecord } from '@/shared/task-history'

export const useTaskHistoryStore = defineStore('taskHistory', () => {
  const taskList = ref<TaskHistoryRecord[]>([])
  const currentTask = ref<TaskHistoryRecord | null>(null)
  const loading = ref(false)

  /**
   * 加载任务历史列表
   */
  const loadTaskList = async (): Promise<void> => {
    loading.value = true
    try {
      taskList.value = await window.api.getTaskHistoryList()
    } catch (error) {
      console.error('Failed to load task history list:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取任务详情
   */
  const loadTaskDetail = async (taskId: string): Promise<void> => {
    loading.value = true
    try {
      currentTask.value = await window.api.getTaskHistoryDetail(taskId)
    } catch (error) {
      console.error('Failed to load task detail:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除任务记录
   */
  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const result = await window.api.deleteTaskHistory(taskId)
      if (result.ok) {
        // 从列表中移除
        taskList.value = taskList.value.filter((t) => t.id !== taskId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete task:', error)
      return false
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

  return {
    taskList,
    currentTask,
    loading,
    loadTaskList,
    loadTaskDetail,
    deleteTask,
    loadCurrentRunningTask,
    refreshCurrentTask
  }
})
