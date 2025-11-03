<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin, NEmpty } from 'naive-ui'
import { useTaskDetailStore } from './stores/detail'
import { storeToRefs } from 'pinia'
import TaskDetailHeader from './components/TaskDetailHeader.vue'
import VideoRecordList from './components/VideoRecordList.vue'
import RunningTaskLogs from './components/RunningTaskLogs.vue'

const route = useRoute()
const taskDetailStore = useTaskDetailStore()
const { currentTask, loading } = storeToRefs(taskDetailStore)

const taskId = computed(() => route.params.taskId as string)
const isRunning = computed(() => currentTask.value?.status === 'running')

let refreshInterval: number | null = null
let offProgress: (() => void) | null = null
let offEnded: (() => void) | null = null

onMounted(async () => {
  // 加载任务详情
  await taskDetailStore.loadTaskDetail(taskId.value)

  // 如果任务正在运行，设置定时刷新
  if (isRunning.value) {
    refreshInterval = window.setInterval(async () => {
      await taskDetailStore.refreshCurrentTask()
    }, 2000) // 每2秒刷新一次

    // 监听任务进度事件
    offProgress = window.api.onTaskProgress(() => {
      // 任务有更新时立即刷新
      taskDetailStore.refreshCurrentTask()
    })

    // 监听任务结束事件
    offEnded = window.api.onTaskEnded(async () => {
      // 任务结束时刷新详情并停止定时器
      await taskDetailStore.refreshCurrentTask()
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
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
  if (offEnded) {
    offEnded()
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
