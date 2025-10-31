<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin, NEmpty } from 'naive-ui'
import { useTaskHistoryStore } from '../config/stores/history'
import { storeToRefs } from 'pinia'
import TaskDetailHeader from './components/TaskDetailHeader.vue'
import VideoRecordList from './components/VideoRecordList.vue'
import RunningTaskLogs from './components/RunningTaskLogs.vue'

const route = useRoute()
const taskHistoryStore = useTaskHistoryStore()
const { currentTask, loading } = storeToRefs(taskHistoryStore)

const taskId = computed(() => route.params.taskId as string)
const isRunning = computed(() => currentTask.value?.status === 'running')

let refreshInterval: number | null = null
let offProgress: (() => void) | null = null

onMounted(async () => {
  // 加载任务详情
  await taskHistoryStore.loadTaskDetail(taskId.value)

  // 如果任务正在运行，设置定时刷新
  if (isRunning.value) {
    refreshInterval = window.setInterval(async () => {
      await taskHistoryStore.refreshCurrentTask()
    }, 2000) // 每2秒刷新一次

    // 监听任务进度事件
    offProgress = window.api.onTaskProgress(() => {
      // 任务有更新时立即刷新
      taskHistoryStore.refreshCurrentTask()
    })
  }
})

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (offProgress) {
    offProgress()
  }
})
</script>

<template>
  <div class="min-h-scree">
    <n-spin :show="loading">
      <div v-if="currentTask">
        <!-- 任务详情头部 -->
        <TaskDetailHeader :task="currentTask" />

        <!-- 运行日志（仅运行中任务） -->
        <RunningTaskLogs v-if="isRunning" />

        <!-- 视频记录列表 -->
        <VideoRecordList :task="currentTask" />
      </div>
      <n-empty v-else description="任务不存在" class="py-20" />
    </n-spin>
  </div>
</template>

<style scoped>
/* 可选：添加自定义样式 */
</style>
