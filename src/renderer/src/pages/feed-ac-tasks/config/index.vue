<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NForm } from 'naive-ui'
import { useTaskStore } from '@renderer/stores/feed-ac-tasks/task'
import { useLogsStore } from '@renderer/stores/feed-ac-tasks/logs'
import { storeToRefs } from 'pinia'
import RulesConfig from './components/RulesConfig/index.vue'
import KeywordBlocking from './components/KeywordBlocking.vue'
import FormCount from './components/FormCount.vue'
import RuntimeSettings from './components/RuntimeSettings.vue'
import StartButton from './components/StartButton.vue'
import ConfigManager from './components/ConfigManager.vue'
import TemplateQuickStart from './components/TemplateQuickStart.vue'
import { useSettingsStore } from './stores/settings'
import HistoryButton from './components/HistoryButton.vue'

// 使用 Pinia stores
const taskStore = useTaskStore()
const logsStore = useLogsStore()
const settingsStore = useSettingsStore()

const { resetTaskStatus } = taskStore
const { addLog, setupAutoScroll } = logsStore
const { settings } = storeToRefs(settingsStore)

let offProgress: null | (() => void) = null
let offEnded: null | (() => void) = null

onMounted(async () => {
  // 加载配置
  settingsStore.loadSettings()

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
  <div>
    <div class="absolute top-0 left-0 right-0 z-10 flex items-center bg-black/5 backdrop-blur-xl">
      <div class="flex justify-between w-full p-6 pb-3">
        <HistoryButton />
        <div class="flex gap-2">
          <ConfigManager />
          <StartButton />
        </div>
      </div>
    </div>
    <div class="flex flex-col justify-center items-center pt-26 pb-10 min-h-screen">
      <template v-if="settings">
        <n-form size="large" label-placement="left" class="w-full px-10">
          <!-- 快速导入模板组件 -->
          <TemplateQuickStart />

          <!-- 规则设置组件 -->
          <RulesConfig />

          <!-- 评论次数组件 -->
          <FormCount />

          <!-- 运行设置组件 -->
          <RuntimeSettings />

          <!-- 关键词屏蔽设置组件 -->
          <KeywordBlocking />
        </n-form>
      </template>
      <template v-else>
        <span>配置加载中</span>
      </template>
    </div>
  </div>
</template>
