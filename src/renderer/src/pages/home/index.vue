<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NForm } from 'naive-ui'
import { useTaskStore } from '@renderer/stores/task'
import { useSettingsStore } from '@renderer/stores/settings'
import { useLogsStore } from '@renderer/stores/logs'
import { storeToRefs } from 'pinia'
import AuthSection from './components/AuthSection.vue'
import RuleSettings from './components/RuleSettings.vue'
import KeywordBlocking from './components/KeywordBlocking.vue'
import TaskLogs from './components/TaskLogs.vue'
import FormCount from './components/FormCount.vue'
import StartButton from './components/StartButton.vue'

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
</script>

<template>
  <div class="relative flex flex-col gap-4">
    <AuthSection />
    <div class="w-screen h-screen flex justify-center items-center overflow-auto">
      <div class="flex flex-col items-center max-h-screen py-10">
        <div>
          <template v-if="!['running', 'stopping'].includes(taskStatus)">
            <n-form size="large" label-placement="left">
              <!-- 规则设置组件 -->
              <RuleSettings />

              <!-- 评论次数组件 -->
              <FormCount />

              <!-- 关键词屏蔽设置组件 -->
              <KeywordBlocking />

              <!-- 开始任务按钮组件 -->
              <StartButton />
            </n-form>
          </template>
          <template v-else>
            <!-- 任务运行时的日志显示 -->
            <TaskLogs />
            <!-- 停止任务按钮 -->
            <StartButton />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
