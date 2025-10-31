<script setup lang="ts">
import { Component, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NTag, NCard, useMessage } from 'naive-ui'
import {
  ArrowBackOutline,
  StopCircleOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { TaskHistoryRecord } from '@/shared/task-history'
import { useTaskStore } from '../../config/stores/task'

interface Props {
  task: TaskHistoryRecord
}

const props = defineProps<Props>()
const router = useRouter()
const taskStore = useTaskStore()
const message = useMessage()

// 状态显示配置
const statusConfig: Record<
  string,
  {
    label: string
    color: 'default' | 'error' | 'info' | 'warning' | 'success' | 'primary'
    icon: Component
  }
> = {
  running: { label: '运行中', color: 'info', icon: TimeOutline },
  completed: { label: '已完成', color: 'success', icon: CheckmarkCircleOutline },
  stopped: { label: '已停止', color: 'default', icon: StopCircleOutline },
  error: { label: '异常错误', color: 'error', icon: CloseCircleOutline }
}

const statusInfo = computed(() => statusConfig[props.task.status])

// 格式化时间
const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const goBack = (): void => {
  router.back()
}

const stopTask = async (): Promise<void> => {
  try {
    await taskStore.stop()
    message.success('任务已停止')
  } catch (error) {
    message.error(`停止任务失败：${String(error)}`)
  }
}
</script>

<template>
  <div class="sticky top-0 z-10 shadow">
    <n-card>
      <div class="space-y-4">
        <!-- 顶部操作栏 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <n-button text @click="goBack">
              <template #icon>
                <n-icon size="20">
                  <ArrowBackOutline />
                </n-icon>
              </template>
            </n-button>
            <h1 class="text-xl font-bold">任务详情</h1>
          </div>

          <n-button v-if="task.status === 'running'" type="error" @click="stopTask">
            <template #icon>
              <n-icon>
                <StopCircleOutline />
              </n-icon>
            </template>
            停止任务
          </n-button>
        </div>

        <!-- 任务基本信息 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-sm text-gray-400 mb-1">任务状态</div>
            <n-tag :type="statusInfo.color" size="medium">
              <template #icon>
                <n-icon :component="statusInfo.icon" />
              </template>
              {{ statusInfo.label }}
            </n-tag>
          </div>

          <div>
            <div class="text-sm text-gray-400 mb-1">评论成功</div>
            <div class="text-lg font-semibold">{{ task.commentCount }} 次</div>
          </div>

          <div>
            <div class="text-sm text-gray-400 mb-1">处理视频</div>
            <div class="text-lg font-semibold">{{ task.videoRecords.length }} 个</div>
          </div>

          <div>
            <div class="text-sm text-gray-400 mb-1">评论成功率</div>
            <div class="text-lg font-semibold">
              {{
                task.videoRecords.length > 0
                  ? ((task.commentCount / task.videoRecords.length) * 100).toFixed(1)
                  : 0
              }}%
            </div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-gray-400 mb-1">开始时间</div>
            <div class="text-sm">{{ formatTime(task.startTime) }}</div>
          </div>

          <div>
            <div class="text-sm text-gray-400 mb-1">结束时间</div>
            <div class="text-sm">{{ formatTime(task.endTime) }}</div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="task.status === 'error' && task.errorMessage" class="bg-red-50 p-3 rounded">
          <div class="text-sm text-gray-400 mb-1">错误信息</div>
          <div class="text-sm text-red-600">{{ task.errorMessage }}</div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
/* 可选：添加自定义样式 */
</style>
