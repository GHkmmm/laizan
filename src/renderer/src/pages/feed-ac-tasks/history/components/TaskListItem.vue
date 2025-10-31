<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NSpace, NIcon } from 'naive-ui'
import {
  CheckmarkCircleOutline,
  StopCircleOutline,
  CloseCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { TaskHistoryRecord } from '@/shared/task-history'

interface Props {
  task: TaskHistoryRecord
}

const props = defineProps<Props>()

// 状态显示配置
const statusConfig = {
  running: { label: '运行中', color: 'info', icon: TimeOutline },
  completed: { label: '已完成', color: 'success', icon: CheckmarkCircleOutline },
  stopped: { label: '已停止', color: 'default', icon: StopCircleOutline },
  error: { label: '异常错误', color: 'error', icon: CloseCircleOutline }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
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

// 计算任务持续时间
const duration = computed(() => {
  if (!props.task.endTime) {
    return '运行中...'
  }
  const seconds = Math.floor((props.task.endTime - props.task.startTime) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
})

const statusInfo = computed(() => statusConfig[props.task.status])
</script>

<template>
  <n-card hoverable class="cursor-pointer transition-all">
    <div class="space-y-3">
      <!-- 任务状态和时间 -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <n-space align="center">
            <n-tag :type="statusInfo.color" size="small">
              <template #icon>
                <n-icon :component="statusInfo.icon" />
              </template>
              {{ statusInfo.label }}
            </n-tag>
            <span class="text-sm text-gray-500">
              评论成功 {{ task.commentCount }} 次
            </span>
          </n-space>
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="text-sm text-gray-600 space-y-1">
        <div>
          <span class="text-gray-400">开始时间：</span>
          {{ formatTime(task.startTime) }}
        </div>
        <div v-if="task.endTime">
          <span class="text-gray-400">结束时间：</span>
          {{ formatTime(task.endTime) }}
        </div>
        <div>
          <span class="text-gray-400">持续时间：</span>
          {{ duration }}
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="task.status === 'error' && task.errorMessage" class="text-sm text-red-500">
        <span class="text-gray-400">错误信息：</span>
        {{ task.errorMessage }}
      </div>

      <!-- 视频处理统计 -->
      <div class="text-sm text-gray-500">
        <span class="text-gray-400">处理视频：</span>
        {{ task.videoRecords.length }} 个
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.n-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
