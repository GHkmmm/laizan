<script setup lang="ts">
import { NButton, NIcon, NBadge } from 'naive-ui'
import { TimeOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@renderer/stores/feed-ac-tasks/task'
import { storeToRefs } from 'pinia'

const router = useRouter()
const taskStore = useTaskStore()
const { isRunning } = storeToRefs(taskStore)

// 跳转到历史任务页面
const goToHistory = (): void => {
  router.push({ name: 'feedAcTasksHistory' })
}
</script>

<template>
  <n-badge :show="isRunning" dot type="success" processing>
    <n-button secondary size="medium" @click="goToHistory">
      <template #icon>
        <n-icon>
          <TimeOutline />
        </n-icon>
      </template>
      历史任务
    </n-button>
  </n-badge>
</template>
