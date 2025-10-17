<template>
  <n-form-item>
    <n-button
      v-if="!['running', 'stopping'].includes(taskStatus)"
      block
      type="primary"
      strong
      size="large"
      :loading="taskStatus === 'starting'"
      :disabled="taskStatus === 'starting'"
      @click="handleStart"
    >
      {{ taskStatus === 'starting' ? '启动中...' : '开始任务' }}
    </n-button>
    <n-button
      v-else
      block
      type="error"
      strong
      secondary
      size="large"
      :loading="taskStatus === 'stopping'"
      :disabled="taskStatus === 'stopping'"
      @click="handleStop"
    >
      {{ taskStatus === 'stopping' ? '停止中...' : '停止任务' }}
    </n-button>
  </n-form-item>
</template>

<script setup lang="ts">
import { NButton, NFormItem } from 'naive-ui'
import { useTaskStore } from '@renderer/stores/task'
import { useSettingsStore } from '@renderer/stores/settings'
import { useLogsStore } from '@renderer/stores/logs'
import { storeToRefs } from 'pinia'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const logsStore = useLogsStore()

const { taskStatus } = storeToRefs(taskStore)
const { start, stop } = taskStore

const handleStart = async (): Promise<void> => {
  try {
    // 启动前保存设置
    await settingsStore.saveSettings()
    logsStore.clearLogs()
    await start()
  } catch (error) {
    logsStore.addLog(`启动失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const handleStop = async (): Promise<void> => {
  try {
    await stop()
  } catch (error) {
    logsStore.addLog(`停止失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
</script>
