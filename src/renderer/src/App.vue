<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { NButton, NInputNumber, NForm, NFormItem } from 'naive-ui'

const hasAuth = ref<boolean | null>(null)
const running = ref(false)
const progressLogs = ref<string[]>([])

interface TaskForm {
  maxCount: number
}

const formModel = ref<TaskForm>({
  maxCount: 10
})

const start = async (): Promise<void> => {
  const count = Number(formModel.value.maxCount)
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
  running.value = true
  progressLogs.value = []
  await window.api.startTask({ maxCount: safeCount })
}

const stop = async (): Promise<void> => {
  await window.api.stopTask()
}

const login = async (): Promise<void> => {
  await window.api.login()
  hasAuth.value = await window.api.hasAuth()
}

const logout = async (): Promise<void> => {
  window.api.logout()
  hasAuth.value = await window.api.hasAuth()
}

let offProgress: null | (() => void) = null
let offEnded: null | (() => void) = null

onMounted(async () => {
  hasAuth.value = await window.api.hasAuth()
  offProgress = window.api.onTaskProgress((p) => {
    progressLogs.value.unshift(`${new Date(p.timestamp).toLocaleTimeString()} ${p.message}`)
  })
  offEnded = window.api.onTaskEnded((p) => {
    running.value = false
    if (p.status === 'error') {
      progressLogs.value.unshift(`任务异常: ${p.message ?? ''}`)
    } else if (p.status === 'stopped') {
      progressLogs.value.unshift('任务已停止')
    } else {
      progressLogs.value.unshift('任务完成')
    }
  })
})

onBeforeUnmount(() => {
  offProgress?.()
  offEnded?.()
})
</script>

<template>
  <div class="relative flex flex-col gap-4">
    <div v-if="hasAuth" class="absolute top-4 right-2">
      <n-button type="primary" tertiary round @click="logout">退出登录</n-button>
    </div>
    <div class="w-screen h-screen flex justify-center items-center">
      <template v-if="hasAuth">
        <div class="flex flex-col items-center">
          <div class="w-80">
            <template v-if="!running">
              <n-form :model="formModel" size="large">
                <n-form-item label="评论次数">
                  <n-input-number
                    v-model:value="formModel.maxCount"
                    :min="1"
                    :max="999"
                    placeholder="输入评论次数"
                    class="w-full"
                    round
                  />
                </n-form-item>
                <n-form-item>
                  <n-button block type="primary" round strong size="large" @click="start"
                    >开始任务</n-button
                  >
                </n-form-item>
              </n-form>
            </template>
            <template v-else>
              <div class="flex flex-col gap-4">
                <div
                  v-if="progressLogs.length"
                  class="w-80 mt-4 h-48 overflow-auto text-xs border rounded p-2"
                >
                  <div v-for="(line, idx) in progressLogs" :key="idx">{{ line }}</div>
                </div>
                <n-button block type="error" round strong secondary size="large" @click="stop"
                  >停止任务</n-button
                >
              </div>
            </template>
          </div>
        </div>
      </template>
      <template v-else>
        <n-button round @click="login">抖音账号登录</n-button>
      </template>
    </div>
  </div>
</template>
