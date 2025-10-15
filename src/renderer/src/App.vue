<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import {
  NButton,
  NInputNumber,
  NForm,
  NFormItem,
  NCollapse,
  NCollapseItem,
  NDynamicInput
} from 'naive-ui'

const hasAuth = ref<boolean | null>(null)
type TaskStatus = 'idle' | 'starting' | 'running' | 'stopping'
const taskStatus = ref<TaskStatus>('idle')
const progressLogs = ref<string[]>([])

interface TaskForm {
  maxCount: number
}

const formModel = ref<TaskForm>({
  maxCount: 10
})

// settings state
const authorKeywords = ref<string[]>([])
const descKeywords = ref<string[]>([])

const loadSettings = async (): Promise<void> => {
  const s = await window.api.getSettings()
  authorKeywords.value = s?.authorBlockKeywords || []
  descKeywords.value = s?.blockKeywords || []
}

const saveSettings = async (): Promise<void> => {
  console.log('saveSettings', authorKeywords.value, descKeywords.value)
  const next = await window.api.updateSettings({
    authorBlockKeywords: [...authorKeywords.value],
    blockKeywords: [...descKeywords.value]
  })
  authorKeywords.value = next.authorBlockKeywords || []
  descKeywords.value = next.blockKeywords || []
}

const start = async (): Promise<void> => {
  if (taskStatus.value !== 'idle') return

  const count = Number(formModel.value.maxCount)
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1

  taskStatus.value = 'starting'
  progressLogs.value = []

  try {
    const result = await window.api.startTask({ maxCount: safeCount })
    if (result.ok) {
      taskStatus.value = 'running'
    } else {
      taskStatus.value = 'idle'
      progressLogs.value.unshift(`启动失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    taskStatus.value = 'idle'
    progressLogs.value.unshift(`启动异常: ${String(error)}`)
  }
}

const stop = async (): Promise<void> => {
  if (taskStatus.value !== 'running') return

  taskStatus.value = 'stopping'

  try {
    const result = await window.api.stopTask()
    if (!result.ok) {
      taskStatus.value = 'running'
      progressLogs.value.unshift(`停止失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    taskStatus.value = 'running'
    progressLogs.value.unshift(`停止异常: ${String(error)}`)
  }
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
  await loadSettings()
  offProgress = window.api.onTaskProgress((p) => {
    progressLogs.value.unshift(`${new Date(p.timestamp).toLocaleTimeString()} ${p.message}`)
  })
  offEnded = window.api.onTaskEnded((p) => {
    taskStatus.value = 'idle'
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
    <div class="w-screen h-screen flex justify-center items-center overflow-auto">
      <template v-if="hasAuth">
        <div class="flex flex-col items-center max-h-screen py-10">
          <div class="w-96">
            <template v-if="!['running', 'stopping'].includes(taskStatus)">
              <n-form :model="formModel" size="large">
                <n-form-item label="评论次数">
                  <n-input-number
                    v-model:value="formModel.maxCount"
                    :min="1"
                    :max="999"
                    placeholder="输入评论次数"
                    class="w-full"
                    round
                    :disabled="taskStatus === 'starting'"
                  />
                </n-form-item>
                <n-collapse arrow-placement="right">
                  <n-collapse-item>
                    <template #header>
                      <div class="flex flex-col w-full">
                        <span>关键词屏蔽设置</span>
                        <h4 class="text-xs font-bold text-gray-400">
                          若视频命中下列关键词，则跳过对该视频进行评论
                        </h4>
                      </div>
                    </template>
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-col gap-2">
                        <div class="mb-1 text-sm">作者昵称</div>
                        <n-dynamic-input
                          v-model:value="authorKeywords"
                          placeholder="输入关键词"
                          @update:value="saveSettings"
                        />
                      </div>
                      <div class="flex flex-col gap-2">
                        <div class="mb-1 text-sm">视频描述</div>
                        <n-dynamic-input
                          v-model:value="descKeywords"
                          placeholder="输入关键词"
                          @update:value="saveSettings"
                        />
                      </div>
                    </div>
                  </n-collapse-item>
                </n-collapse>
                <n-form-item>
                  <n-button
                    block
                    type="primary"
                    round
                    strong
                    size="large"
                    :loading="taskStatus === 'starting'"
                    :disabled="taskStatus === 'starting'"
                    @click="start"
                  >
                    {{ taskStatus === 'starting' ? '启动中...' : '开始任务' }}
                  </n-button>
                </n-form-item>
              </n-form>
            </template>
            <template v-else>
              <div class="flex flex-col gap-4">
                <div
                  v-if="progressLogs.length"
                  class="w-96 mt-4 h-48 overflow-auto text-xs border rounded p-2"
                >
                  <div v-for="(line, idx) in progressLogs" :key="idx">{{ line }}</div>
                </div>
                <n-button
                  block
                  type="error"
                  round
                  strong
                  secondary
                  size="large"
                  :loading="taskStatus === 'stopping'"
                  :disabled="taskStatus === 'stopping'"
                  @click="stop"
                >
                  {{ taskStatus === 'stopping' ? '停止中...' : '停止任务' }}
                </n-button>
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
