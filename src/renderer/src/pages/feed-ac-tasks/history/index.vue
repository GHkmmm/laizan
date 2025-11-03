<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NSpin, NEmpty, useMessage, NPopconfirm } from 'naive-ui'
import { ArrowBackOutline, TrashOutline } from '@vicons/ionicons5'
import { useTaskHistoryStore } from './stores/history'
import { storeToRefs } from 'pinia'
import TaskListItem from './components/TaskListItem.vue'

const router = useRouter()
const taskHistoryStore = useTaskHistoryStore()
const { taskList, loading } = storeToRefs(taskHistoryStore)
const message = useMessage()

// 检查是否有任务正在运行
const hasRunningTask = computed(() => {
  return taskList.value.some((task) => task.status === 'running')
})

onMounted(async () => {
  await taskHistoryStore.loadTaskList()
})

const goBack = (): void => {
  router.push({ name: 'feedAcTasksConfig' })
}

const goToDetail = (taskId: string): void => {
  router.push({ name: 'feedAcTasksDetail', params: { taskId } })
}

// 处理删除任务
const handleDeleteTask = async (): Promise<void> => {
  // 刷新任务列表以同步最新状态
  await taskHistoryStore.loadTaskList()
}

// 清空所有历史任务
const handleClearAll = async (): Promise<void> => {
  // 检查是否有任务正在运行
  if (hasRunningTask.value) {
    message.warning('任务正在运行，请等待完成后操作')
    return
  }

  try {
    // 逐个删除任务
    const deletePromises = taskList.value.map((task) => window.api.deleteTaskHistory(task.id))
    const results = await Promise.all(deletePromises)

    // 检查删除结果
    const successCount = results.filter((result) => result.ok).length
    if (successCount === taskList.value.length) {
      // 全部删除成功，刷新列表
      await taskHistoryStore.loadTaskList()
      message.success('已清空所有历史任务')
    } else {
      // 部分删除成功
      await taskHistoryStore.loadTaskList()
      message.warning(`部分任务删除失败，已刷新列表`)
    }
  } catch (error) {
    message.error(`清空失败: ${String(error)}`)
  }
}
</script>

<template>
  <div class="min-h-scree">
    <!-- 页面头部 -->
    <div class="absolute top-0 left-0 right-0 z-10 bg-black/5 backdrop-blur-xl">
      <div class="flex items-center justify-between p-6 pb-3">
        <div class="flex items-center gap-2">
          <n-button text @click="goBack">
            <template #icon>
              <n-icon size="20">
                <ArrowBackOutline />
              </n-icon>
            </template>
          </n-button>
          <h1 class="text-xl font-bold">历史任务</h1>
        </div>
        <n-popconfirm
          v-if="taskList.length > 0"
          :show-icon="false"
          @positive-click="handleClearAll"
        >
          <template #trigger>
            <n-button type="error" secondary size="small">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              清空所有
            </n-button>
          </template>
          确定要清空所有历史任务吗？此操作不可恢复。
        </n-popconfirm>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="p-6 pt-20">
      <n-spin :show="loading">
        <div v-if="taskList.length > 0" class="space-y-4">
          <TaskListItem
            v-for="task in taskList"
            :key="task.id"
            :task="task"
            @delete="handleDeleteTask"
            @click="goToDetail(task.id)"
          />
          <!-- 底部提示 -->
          <div class="mt-4 text-center text-sm text-gray-500">仅保留最近10条记录</div>
        </div>

        <n-empty v-else description="暂无任务历史记录" class="mt-36" />
      </n-spin>
    </div>
  </div>
</template>
