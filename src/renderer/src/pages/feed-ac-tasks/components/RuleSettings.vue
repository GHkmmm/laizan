<template>
  <n-form-item label="规则配置：">
    <div class="flex flex-col gap-3 pt-3 w-full">
      <h4 class="text-xs font-bold text-gray-400">当视频满足以下规则配置 系统会自动评论</h4>
      <div class="flex items-center gap-1">
        <span class="text-nowrap">规则关系：</span>
        <n-select
          v-model:value="settings.ruleRelation"
          placeholder="规则关系"
          :options="acRuleRelationOptions"
          size="medium"
          @update:value="saveSettings"
        />
      </div>
      <div class="flex gap-1">
        <span class="text-nowrap pt-1">规则列表：</span>
        <div class="flex flex-col gap-3 flex-1">
          <div v-for="(r, idx) in settings.rules" :key="idx" class="flex items-center gap-2">
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
              v-if="settings.rules.length > 1"
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

      <!-- AI视频过滤配置 -->
      <div class="flex flex-col gap-3 pt-3">
        <div class="flex flex-col justify-start items-start gap-2">
          <div class="opacity-50">
            <n-gradient-text
              gradient="linear-gradient(to right, rgb(245, 65, 128), rgb(51, 142, 247))"
            >
              启用AI判断（敬请期待）：
            </n-gradient-text>
          </div>
          <n-switch
            v-model:value="settings.enableAIVideoFilter"
            size="medium"
            disabled
            @update:value="saveSettings"
          />
        </div>
        <div v-if="settings.enableAIVideoFilter" class="flex flex-col gap-2">
          <span class="text-xs font-medium text-gray-400"
            >请描述您希望AI以什么规则判断是否观看视频：</span
          >
          <n-input
            v-model:value="settings.customAIVideoFilterPrompt"
            type="textarea"
            placeholder="请输入提示词"
            :maxlength="1000"
            show-count
            size="medium"
            :rows="5"
            @update:value="saveSettings"
          />
        </div>
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
  NTooltip,
  NSwitch,
  SelectOption,
  NGradientText
} from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { saveSettings, addRule, removeRule } = settingsStore
const { settings } = storeToRefs(settingsStore)

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
        default: () =>
          '请注意区分视频话题和视频标签，标签为抖音系统自动生成的视频分类，例如旅游类视频可以填写：旅游'
      })
    }
  }
]
</script>
