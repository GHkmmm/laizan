import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TaskHistoryRecord } from '@/shared/task-history'

/**
 * 任务历史列表 Store
 * 职责：管理历史任务列表的加载、删除等操作
 */
export const useTaskHistoryStore = defineStore('taskHistory', () => {
  const taskList = ref<TaskHistoryRecord[]>([])
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

  return {
    taskList,
    loading,
    loadTaskList,
    deleteTask
  }
})
