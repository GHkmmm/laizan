<template>
  <n-form-item label="规则设置：">
    <div class="flex flex-col gap-3 pt-3">
      <h4 class="text-xs font-bold text-gray-400">当视频满足以下要求时 系统会自动评论</h4>
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
            <n-button
              v-if="rules.length > 1"
              size="small"
              type="error"
              tertiary
              @click="removeRule(idx)"
            >
              删除
            </n-button>
          </div>
          <div class="w-10 flex gap-2">
            <n-button class="w-10" size="medium" tertiary type="primary" @click="addRule">
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
              :max="60"
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
</template>

<script setup lang="ts">
import { h } from 'vue'
import {
  NFormItem,
  NSelect,
  NInput,
  NButton,
  NCheckbox,
  NSlider,
  NTooltip,
  SelectOption
} from 'naive-ui'
import { useSettingsStore } from '@renderer/stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { saveSettings, addRule, removeRule } = settingsStore
const {
  ruleRelation,
  rules,
  simulateWatchBeforeComment,
  watchTimeRangeSeconds,
  onlyCommentActiveVideo
} = storeToRefs(settingsStore)

const acRuleRelationOptions = [
  {
    label: '任一满足',
    value: 'or'
  },
  {
    label: '全部满足',
    value: 'and'
  }
]

const acRuleOptions: SelectOption[] = [
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
]
</script>
