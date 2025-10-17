<template>
  <n-form-item label="评论次数：">
    <n-input-number
      v-model:value="formModel.maxCount"
      :min="1"
      :max="999"
      placeholder="输入评论次数"
      class="w-full"
      :disabled="taskStatus === 'starting'"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { NFormItem, NInputNumber } from 'naive-ui'
import { useTaskStore } from '@renderer/stores/task'

const taskStore = useTaskStore()
const { formModel, taskStatus } = taskStore
</script>
