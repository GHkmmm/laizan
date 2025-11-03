<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NCard, NLog } from 'naive-ui'
import { useLogsStore } from '@renderer/stores/feed-ac-tasks/logs'
import { storeToRefs } from 'pinia'

const logsStore = useLogsStore()
const { progressLogs, logInstRef } = storeToRefs(logsStore)

let offProgress: (() => void) | null = null

onMounted(() => {
  // 监听任务进度事件
  offProgress = window.api.onTaskProgress((p) => {
    logsStore.addLog(p.message)
  })

  // 设置自动滚动
  logsStore.setupAutoScroll()
})

onBeforeUnmount(() => {
  if (offProgress) {
    offProgress()
  }
})
</script>

<template>
  <div class="p-6">
    <n-card title="运行日志">
      <n-log ref="logInstRef" :log="progressLogs" language="javascript" trim :rows="15" />
    </n-card>
  </div>
</template>

<style scoped>
/* 可选：添加自定义样式 */
</style>
