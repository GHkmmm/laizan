<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NSpin, NEmpty } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useTaskHistoryStore } from './stores/history'
import { storeToRefs } from 'pinia'
import TaskListItem from './components/TaskListItem.vue'

const router = useRouter()
const taskHistoryStore = useTaskHistoryStore()
const { taskList, loading } = storeToRefs(taskHistoryStore)

onMounted(async () => {
  await taskHistoryStore.loadTaskList()
})

const goBack = (): void => {
  router.push({ name: 'feedAcTasksConfig' })
}

const goToDetail = (taskId: string): void => {
  console.log('goToDetail', taskId)
  router.push({ name: 'feedAcTasksDetail', params: { taskId } })
}
</script>

<template>
  <div class="min-h-scree">
    <!-- 页面头部 -->
    <div class="sticky top-0 z-10">
      <div class="flex items-center justify-between p-4">
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
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="p-6">
      <n-spin :show="loading">
        <div v-if="taskList.length > 0" class="space-y-4">
          <TaskListItem
            v-for="task in taskList"
            :key="task.id"
            :task="task"
            @click="goToDetail(task.id)"
          />
        </div>
        <n-empty v-else description="暂无任务历史记录" class="py-20" />
      </n-spin>
    </div>
  </div>
</template>
