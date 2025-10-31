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

  <!-- 抖音限制提示弹窗 -->
  <DouyinLimitDialog
    v-model:show="showDouyinLimitDialog"
    @confirm="handleDouyinLimitConfirm"
    @cancel="handleDouyinLimitCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, useMessage, NIcon } from 'naive-ui'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import { useLogsStore } from '../stores/logs'
import { storeToRefs } from 'pinia'
import { PlayOutline, PauseOutline } from '@vicons/ionicons5'
import DouyinLimitDialog from './DouyinLimitDialog.vue'
import { LocalStorageManager, STORAGE_KEYS } from '@renderer/utils/storage-keys'
import { FeedAcRuleGroups } from '@/shared/feed-ac-setting'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const logsStore = useLogsStore()
const message = useMessage()

const { taskStatus } = storeToRefs(taskStore)
const { settings } = storeToRefs(settingsStore)
const { start, stop } = taskStore

// 弹窗状态
const showDouyinLimitDialog = ref(false)

const validateForm = (): boolean => {
  // 检查是否有规则组
  if (settings.value!.ruleGroups.length === 0) {
    message.error('请至少配置一个规则组')
    return false
  }

  // 递归检查所有最深层规则组是否配置了评论内容
  const checkLeafRuleGroups = (groups: FeedAcRuleGroups[]): boolean => {
    for (const group of groups) {
      // 如果有子规则组，递归检查子规则组
      if (group.children && group.children.length > 0) {
        if (!checkLeafRuleGroups(group.children)) {
          return false
        }
      } else {
        // 最深层规则组，检查是否配置了评论内容
        const hasCommentTexts =
          group.commentTexts &&
          group.commentTexts.length > 0 &&
          group.commentTexts.some((text) => text.trim())
        const hasCommentImage = group.commentImagePath && group.commentImagePath.trim()

        if (!hasCommentTexts && !hasCommentImage) {
          return false
        }
      }
    }
    return true
  }

  if (!checkLeafRuleGroups(settings.value!.ruleGroups)) {
    message.error('还有未配置评论内容的规则组，请完善配置')
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

    // 检查是否需要显示抖音限制提示
    const dismissed = LocalStorageManager.get(STORAGE_KEYS['laizan-douyin-limit-dialog-dismissed'])
    if (!dismissed) {
      showDouyinLimitDialog.value = true
      return
    }

    // 直接启动任务
    await startTask()
  } catch (error) {
    logsStore.addLog(`启动失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const startTask = async (): Promise<void> => {
  try {
    // 启动前保存设置
    await settingsStore.saveSettings()
    logsStore.clearLogs()
    await start()
  } catch (error) {
    logsStore.addLog(`启动失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const handleDouyinLimitConfirm = async (dontShowAgain: boolean): Promise<void> => {
  // 如果用户选择了"不再提示"，保存到 localStorage
  if (dontShowAgain) {
    LocalStorageManager.set(STORAGE_KEYS['laizan-douyin-limit-dialog-dismissed'], true)
  }

  // 开始任务
  await startTask()
}

const handleDouyinLimitCancel = (): void => {
  // 用户取消，不做任何操作
}

const handleStop = async (): Promise<void> => {
  try {
    await stop()
  } catch (error) {
    logsStore.addLog(`停止失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
</script>
