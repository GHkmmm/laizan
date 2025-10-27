<template>
  <n-form-item label="评论次数：">
    <n-input-number
      v-model:value="settings.maxCount"
      :min="1"
      :max="999"
      placeholder="输入评论次数"
      class="w-full"
      :disabled="taskStatus === 'starting'"
      @update:value="handleMaxCountChange"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { NFormItem, NInputNumber } from 'naive-ui'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { taskStatus } = taskStore

// 处理maxCount变化，直接保存到配置中
const handleMaxCountChange = (): void => {
  settingsStore.saveSettings()
}
</script>
