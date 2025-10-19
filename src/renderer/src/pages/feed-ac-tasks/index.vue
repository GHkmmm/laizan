<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NForm, NButton, useDialog, useMessage } from 'naive-ui'
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

const dialog = useDialog()
const message = useMessage()

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

const onClearSettings = (): void => {
  dialog.warning({
    title: '确认清空配置',
    content: '此操作将恢复任务配置为默认值，是否继续？',
    positiveText: '继续',
    negativeText: '取消',
    negativeButtonProps: {
      ghost: false,
      type: 'default',
      tertiary: true
    },
    onPositiveClick: async () => {
      try {
        await settingsStore.resetSettings()
        message.success('已清空配置')
      } catch (e) {
        message.error(String(e))
      }
    }
  })
}
</script>

<template>
  <div>
    <div class="absolute right-0 top-0 m-4">
      <n-button tertiary size="small" @click="onClearSettings">清空配置</n-button>
    </div>
    <div class="flex flex-col justify-center items-center py-10 min-h-screen">
      <template v-if="!['running', 'stopping'].includes(taskStatus)">
        <n-form size="large" label-placement="left" class="w-full px-10">
          <!-- 规则设置组件 -->
          <RuleSettings />

          <!-- 评论次数组件 -->
          <FormCount />

          <!-- 运行设置组件 -->
          <RuntimeSettings />

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
</template>
