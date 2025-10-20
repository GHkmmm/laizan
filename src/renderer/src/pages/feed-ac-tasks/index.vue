<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NForm } from 'naive-ui'
import { useTaskStore } from './stores/task'
import { useSettingsStore } from './stores/settings'
import { useLogsStore } from './stores/logs'
import { storeToRefs } from 'pinia'
import RuleSettings from './components/RuleSettings.vue'
import KeywordBlocking from './components/KeywordBlocking.vue'
import TaskLogs from './components/TaskLogs.vue'
import FormCount from './components/FormCount.vue'
import RuntimeSettings from './components/RuntimeSettings.vue'
import StartButton from './components/StartButton.vue'
import ConfigManager from './components/ConfigManager.vue'
import CommentContent from './components/CommentContent.vue'

// 使用 Pinia stores
const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const logsStore = useLogsStore()

// 解构需要的响应式数据（无需在此检查登录态，进入本页即已登录）
const { taskStatus } = storeToRefs(taskStore)
const { resetTaskStatus } = taskStore
const { loadSettings } = settingsStore
const { addLog, setupAutoScroll } = logsStore

let offProgress: null | (() => void) = null
let offEnded: null | (() => void) = null

onMounted(async () => {
  await loadSettings()

  // 设置自动滚动
  setupAutoScroll()

  // 监听任务进度
  offProgress = window.api.onTaskProgress((p) => {
    addLog(p.message)
  })

  // 监听任务结束
  offEnded = window.api.onTaskEnded((p) => {
    resetTaskStatus()
    if (p.status === 'error') {
      addLog(`任务异常: ${p.message ?? ''}`)
    } else if (p.status === 'stopped') {
      addLog(`任务已停止`)
    } else {
      addLog(`任务完成`)
    }
  })
})

onBeforeUnmount(() => {
  offProgress?.()
  offEnded?.()
})

// 由 ConfigManager 组件承载配置管理逻辑
</script>

<template>
  <div>
    <div class="sticky top-0 z-10 flex gap-2 justify-end items-center p-4">
      <ConfigManager />
      <StartButton />
    </div>
    <div class="flex flex-col justify-center items-center pb-10 min-h-screen">
      <template v-if="!['running', 'stopping'].includes(taskStatus)">
        <n-form size="large" label-placement="left" class="w-full px-10">
          <!-- 规则设置组件 -->
          <RuleSettings />

          <!-- 评论内容配置组件 -->
          <CommentContent />

          <!-- 评论次数组件 -->
          <FormCount />

          <!-- 运行设置组件 -->
          <RuntimeSettings />

          <!-- 关键词屏蔽设置组件 -->
          <KeywordBlocking />
        </n-form>
      </template>
      <template v-else>
        <!-- 任务运行时的日志显示 -->
        <TaskLogs />
      </template>
    </div>
  </div>
</template>
