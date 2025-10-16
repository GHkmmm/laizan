<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, h } from 'vue'
import {
  NButton,
  NInput,
  NInputNumber,
  NForm,
  NFormItem,
  NCollapse,
  NCollapseItem,
  NDynamicInput,
  SelectOption,
  NSelect,
  NTooltip,
  NCheckbox,
  NSlider
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

const acRuleRelationOptions = ref<SelectOption[]>([
  {
    label: '任一满足',
    value: 'or'
  },
  {
    label: '全部满足',
    value: 'and'
  }
])

const acRuleOptions = ref<SelectOption[]>([
  {
    label: '作者名称',
    value: 'nickName'
  },
  {
    label: '视频描述',
    value: 'videoDesc'
  },
  {
    label: '视频标签',
    value: 'videoTag',
    render: ({ node }) => {
      return h(NTooltip, null, {
        trigger: () => node,
        default: () => '请注意区分视频话题和视频标签，标签为抖音系统自动生成'
      })
    }
  }
])

// 新增：用户可配置的评论规则与行为设置
const ruleRelation = ref<'and' | 'or'>('or')
const rules = ref<{ field: 'nickName' | 'videoDesc' | 'videoTag'; keyword: string }[]>([])
const simulateWatchBeforeComment = ref<boolean>(true)
const watchTimeRangeSeconds = ref<[number, number]>([5, 15])
const onlyCommentActiveVideo = ref<boolean>(true)

// settings state for block keywords
const authorKeywords = ref<string[]>([])
const descKeywords = ref<string[]>([])

const loadSettings = async (): Promise<void> => {
  const s = await window.api.getSettings()
  authorKeywords.value = s?.authorBlockKeywords || []
  descKeywords.value = s?.blockKeywords || []
  ruleRelation.value = (s?.ruleRelation as 'and' | 'or') ?? 'or'
  rules.value = Array.isArray(s?.rules) ? s!.rules : []
  simulateWatchBeforeComment.value = s?.simulateWatchBeforeComment ?? true
  watchTimeRangeSeconds.value =
    Array.isArray(s?.watchTimeRangeSeconds) && s!.watchTimeRangeSeconds.length === 2
      ? (s!.watchTimeRangeSeconds as [number, number])
      : [5, 15]
  onlyCommentActiveVideo.value = s?.onlyCommentActiveVideo ?? true
}

const saveSettings = async (): Promise<void> => {
  const next = await window.api.updateSettings({
    authorBlockKeywords: [...authorKeywords.value],
    blockKeywords: [...descKeywords.value],
    ruleRelation: ruleRelation.value,
    rules: JSON.parse(JSON.stringify(rules.value)),
    simulateWatchBeforeComment: simulateWatchBeforeComment.value,
    watchTimeRangeSeconds: [...watchTimeRangeSeconds.value],
    onlyCommentActiveVideo: onlyCommentActiveVideo.value
  })
  authorKeywords.value = next.authorBlockKeywords || []
  descKeywords.value = next.blockKeywords || []
  ruleRelation.value = (next.ruleRelation as 'and' | 'or') ?? 'or'
  rules.value = Array.isArray(next.rules) ? next.rules : []
  simulateWatchBeforeComment.value = next.simulateWatchBeforeComment ?? true
  watchTimeRangeSeconds.value =
    Array.isArray(next.watchTimeRangeSeconds) && next.watchTimeRangeSeconds.length === 2
      ? (next.watchTimeRangeSeconds as [number, number])
      : [5, 15]
  onlyCommentActiveVideo.value = next.onlyCommentActiveVideo ?? true
}

const start = async (): Promise<void> => {
  if (taskStatus.value !== 'idle') return

  // 启动前保存设置
  await saveSettings()

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
          <div>
            <template v-if="!['running', 'stopping'].includes(taskStatus)">
              <n-form :model="formModel" size="large" label-placement="left">
                <n-form-item label="规则设置：">
                  <div class="flex flex-col gap-3 pt-3">
                    <h4 class="text-xs font-bold text-gray-400">
                      当视频满足以下要求时 系统会自动评论
                    </h4>
                    <div class="flex items-center gap-1">
                      <span class="text-nowrap">规则关系：</span>
                      <n-select
                        v-model:value="ruleRelation"
                        placeholder="规则关系"
                        :options="acRuleRelationOptions"
                        size="medium"
                        @update:value="saveSettings"
                      />
                    </div>
                    <div class="flex gap-1 w-96">
                      <span class="text-nowrap pt-1">规则列表：</span>
                      <div class="flex flex-col gap-3 flex-1">
                        <div v-for="(r, idx) in rules" :key="idx" class="flex items-center gap-2">
                          <n-select
                            v-model:value="r.field"
                            placeholder="选择类型"
                            :options="acRuleOptions"
                            size="medium"
                            @update:value="saveSettings"
                          />
                          <span class="text-nowrap">包含关键字</span>
                          <n-input
                            v-model:value="r.keyword"
                            placeholder="输入关键字"
                            class="w-full"
                            size="medium"
                            @update:value="saveSettings"
                          />
                        </div>
                        <div class="w-10 flex gap-2">
                          <n-button
                            class="w-10"
                            size="medium"
                            tertiary
                            round
                            type="primary"
                            @click="
                              () => {
                                rules.push({ field: 'videoDesc', keyword: '' })
                                saveSettings()
                              }
                            "
                          >
                            添加条件
                          </n-button>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-col gap-2">
                        <n-checkbox
                          v-model:checked="simulateWatchBeforeComment"
                          size="small"
                          @update:checked="saveSettings"
                        >
                          是否模拟真人先观看视频再评论
                        </n-checkbox>
                        <div v-if="simulateWatchBeforeComment" class="flex flex-col gap-2 py-3">
                          <span>观看视频（按照下方设置的时间范围随机）：</span>
                          <n-slider
                            v-model:value="watchTimeRangeSeconds"
                            range
                            :min="0"
                            :max="120"
                            :format-tooltip="(value: number) => `${value}秒`"
                            @update:value="saveSettings"
                          />
                        </div>
                      </div>
                      <n-checkbox
                        v-model:checked="onlyCommentActiveVideo"
                        size="small"
                        @update:checked="saveSettings"
                      >
                        只评论活跃视频
                      </n-checkbox>
                    </div>
                  </div>
                </n-form-item>
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
                <n-form-item>
                  <n-collapse arrow-placement="right">
                    <n-collapse-item>
                      <template #header>
                        <div class="flex flex-col w-full">
                          <span>关键词屏蔽设置</span>
                          <h4 class="text-xs font-bold text-gray-400">
                            若视频命中设置的关键词，则跳过视频
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
                </n-form-item>
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
