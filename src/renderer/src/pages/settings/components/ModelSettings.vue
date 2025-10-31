<template>
  <div v-if="aiSetting" class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">模型设置</h2>
      <div class="flex items-center gap-2">
        <n-button tertiary size="small" @click="onClearAISettings"> 清空配置 </n-button>
        <n-button type="primary" size="small" @click="onSave"> 保存 </n-button>
      </div>
    </div>
    <n-card :bordered="true">
      <n-form label-width="auto">
        <n-form-item label="平台">
          <n-select
            v-model:value="aiSetting!.platform"
            :options="platformOptions"
            placeholder="选择平台"
            @update:value="onPlatformChange"
          />
        </n-form-item>
        <n-form-item label="选择模型">
          <n-select
            v-model:value="aiSetting!.model"
            :options="modelOptionsForPlatform"
            :disabled="modelOptionsForPlatform.length === 0"
            placeholder="选择模型"
          />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input
            v-model:value="aiSetting!.apiKeys[aiSetting!.platform]"
            type="password"
            show-password-on="click"
            placeholder="请输入当前平台的 API Key"
          />
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AIPlatform, AISettings } from '@/shared/ai-setting'
import { useDialog, useMessage, NForm, NFormItem, NInput, NButton, NCard, NSelect } from 'naive-ui'
import { structuredClone } from '@/utils/common'

const aiSetting = ref<AISettings>()
const message = useMessage()
const dialog = useDialog()

const PLATFORM_MODELS: Record<AIPlatform, { label: string; value: string }[]> = {
  volcengine: [{ label: 'doubao-seed-1.6-250615', value: 'doubao-seed-1.6-250615' }],
  bailian: [],
  openai: []
}

const platformOptions = [
  { label: '火山引擎', value: 'volcengine' },
  { label: '阿里百炼（暂未开放）', value: 'bailian', disabled: true },
  { label: 'OpenAI（暂未开放）', value: 'openai', disabled: true }
]

const modelOptionsForPlatform = computed(
  () => PLATFORM_MODELS[aiSetting.value?.platform ?? 'volcengine']
)
const onPlatformChange = (p: AIPlatform): void => {
  const options = PLATFORM_MODELS[p].map((o) => o.value)
  if (!options.includes(aiSetting.value!.model)) {
    aiSetting.value!.model = options[0] || ''
  }
  aiSetting.value!.apiKeys[p] = ''
}

const onSave = async (): Promise<void> => {
  try {
    const options = PLATFORM_MODELS[aiSetting.value!.platform].map((o) => o.value)
    if (!options.includes(aiSetting.value!.model)) {
      message.error('所选模型与平台不匹配')
      return
    }
    aiSetting.value = await window.api.updateAISettings(structuredClone(aiSetting.value!))
    message.success('已保存')
  } catch (e) {
    message.error(String(e))
  }
}

const onClearAISettings = (): void => {
  dialog.warning({
    title: '确认清空模型配置',
    content: '此操作将恢复模型设置为默认值，是否继续？',
    positiveText: '继续',
    negativeText: '取消',
    negativeButtonProps: {
      ghost: false,
      type: 'default',
      tertiary: true
    },
    onPositiveClick: async () => {
      try {
        aiSetting.value = await window.api.clearAISettings()
        message.success('已清空模型配置')
      } catch (e) {
        message.error(String(e))
      }
    }
  })
}

onMounted(async () => {
  aiSetting.value = await window.api.getAISettings()
})
</script>
