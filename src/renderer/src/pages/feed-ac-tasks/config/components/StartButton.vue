<template>
  <n-tooltip :disabled="!startButtonTooltip" trigger="hover">
    <template #trigger>
      <n-button
        v-if="!['running', 'stopping'].includes(taskStatus)"
        type="primary"
        strong
        :loading="taskStatus === 'starting'"
        :disabled="isStartDisabled"
        @click="handleStart"
      >
        <template #icon>
          <NIcon>
            <PlayOutline />
          </NIcon>
        </template>
        {{ taskStatus === 'starting' ? '启动中...' : '开始任务' }}
      </n-button>
    </template>
    {{ startButtonTooltip }}
  </n-tooltip>

  <!-- 抖音限制提示弹窗 -->
  <DouyinLimitDialog
    v-model:show="showDouyinLimitDialog"
    @confirm="handleDouyinLimitConfirm"
    @cancel="handleDouyinLimitCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, useMessage, NIcon, NTooltip } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import { useLogsStore } from '../stores/logs'
import { storeToRefs } from 'pinia'
import { PlayOutline } from '@vicons/ionicons5'
import DouyinLimitDialog from './DouyinLimitDialog.vue'
import { LocalStorageManager, STORAGE_KEYS } from '@renderer/utils/storage-keys'
import { FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { useTaskHistoryStore } from '../stores/history'

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const logsStore = useLogsStore()
const taskHistoryStore = useTaskHistoryStore()
const message = useMessage()
const router = useRouter()

const { taskStatus } = storeToRefs(taskStore)
const { settings } = storeToRefs(settingsStore)
const { start } = taskStore

// 弹窗状态
const showDouyinLimitDialog = ref(false)

// 检查是否有任务正在运行
const hasRunningTask = ref(false)
const checkRunningTask = async (): Promise<void> => {
  const runningTask = await taskHistoryStore.loadCurrentRunningTask()
  hasRunningTask.value = !!runningTask
}

// 禁用开始按钮的条件
const isStartDisabled = computed(() => {
  return taskStatus.value === 'starting' || hasRunningTask.value
})

// 悬停提示
const startButtonTooltip = computed(() => {
  if (hasRunningTask.value) {
    return '任务正在运行，请等待前一个任务结束'
  }
  return ''
})

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
    logsStore.clearLogs()
    const taskId = await start()

    console.log('任务启动， taskId:', taskId)

    // 启动成功后，跳转到任务详情页
    if (taskId) {
      router.push({ name: 'feedAcTasksDetail', params: { taskId: taskId } })
    }
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

// 组件加载时检查运行中的任务
onMounted(() => {
  checkRunningTask()
})
</script>
