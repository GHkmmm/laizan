<template>
  <n-button
    v-if="!['running', 'stopping'].includes(taskStatus)"
    type="primary"
    strong
    :loading="taskStatus === 'starting'"
    :disabled="taskStatus === 'starting'"
    @click="handleStart"
  >
    <template #icon>
      <NIcon>
        <PlayOutline />
      </NIcon>
    </template>
    {{ taskStatus === 'starting' ? '启动中...' : '开始任务' }}
  </n-button>
  <n-button
    v-else
    type="error"
    strong
    secondary
    size="large"
    :loading="taskStatus === 'stopping'"
    :disabled="taskStatus === 'stopping'"
    @click="handleStop"
  >
    <template #icon>
      <NIcon>
        <PauseOutline />
      </NIcon>
    </template>
    {{ taskStatus === 'stopping' ? '停止中...' : '停止任务' }}
  </n-button>
</template>

<script setup lang="ts">
import { NButton, useMessage, NIcon } from 'naive-ui'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import { useLogsStore } from '../stores/logs'
import { storeToRefs } from 'pinia'
import { PlayOutline, PauseOutline } from '@vicons/ionicons5'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const logsStore = useLogsStore()
const message = useMessage()

const { taskStatus } = storeToRefs(taskStore)
const { commentTexts } = storeToRefs(settingsStore)
const { start, stop } = taskStore
const validateForm = (): boolean => {
  // 检查评论文案
  if (commentTexts.value.length === 0 || commentTexts.value.some((text) => !text.trim())) {
    message.error('请至少配置一个有效的评论文案')
    return false
  }

  return true
}

const handleStart = async (): Promise<void> => {
  try {
    // 表单验证
    if (!validateForm()) {
      return
    }

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
