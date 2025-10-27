<template>
  <div class="flex flex-col gap-8 p-6">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">模型设置</h2>
        <div class="flex items-center gap-2">
          <n-button tertiary size="small" @click="onClearAiSettings"> 清空配置 </n-button>
          <n-button type="primary" size="small" @click="onSave"> 保存 </n-button>
        </div>
      </div>
      <n-card :bordered="true">
        <n-form label-width="auto">
          <n-form-item label="平台">
            <n-select
              v-model:value="aiSetting.platform"
              :options="platformOptions"
              placeholder="选择平台"
              @update:value="onPlatformChange"
            />
          </n-form-item>
          <n-form-item label="选择模型">
            <n-select
              v-model:value="aiSetting.model"
              :options="modelOptionsForPlatform"
              :disabled="modelOptionsForPlatform.length === 0"
              placeholder="选择模型"
            />
          </n-form-item>
          <n-form-item label="API Key">
            <n-input
              v-model:value="aiSetting.apiKeys[aiSetting.platform]"
              type="password"
              show-password-on="click"
              placeholder="请输入当前平台的 API Key"
            />
          </n-form-item>
        </n-form>
      </n-card>
    </div>
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">Chrome浏览器路径</h2>
        <div class="flex items-center gap-2">
          <n-button
            type="primary"
            size="small"
            :loading="isSavingBrowser"
            :disabled="isSavingBrowser"
            @click="onSaveBrowser"
          >
            {{ isSavingBrowser ? '正在验证路径...' : '保存' }}
          </n-button>
        </div>
      </div>
      <n-card :bordered="true">
        <n-form label-width="auto">
          <n-form-item label="可执行文件路径">
            <div class="flex items-center gap-2 w-full">
              <n-input v-model:value="browserPath" placeholder="/path/to/Google Chrome" />
              <n-button tertiary @click="onPickBrowser">选择</n-button>
            </div>
          </n-form-item>
          <div class="text-gray-500 text-sm leading-6">
            <div>Mac：默认/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</div>
            <div>Windows：请选择 chrome.exe 或手动输入</div>
          </div>
        </n-form>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useMessage, useDialog, NForm, NFormItem, NInput, NSelect, NButton, NCard } from 'naive-ui'
import { AISettings, getDefaultAISetting } from '@/shared/ai-setting'
import { structuredClone } from '@/utils/common'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const show = ref<boolean>(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    show.value = v
  }
)
watch(show, (v) => emit('update:modelValue', v))

const aiSetting = ref<AISettings>(getDefaultAISetting())

const platformOptions = [
  { label: '火山引擎', value: 'volcengine' },
  { label: '阿里百炼（暂未开放）', value: 'bailian', disabled: true },
  { label: 'OpenAI（暂未开放）', value: 'openai', disabled: true }
]

const PLATFORM_MODELS: Record<
  'volcengine' | 'bailian' | 'openai',
  { label: string; value: string }[]
> = {
  volcengine: [{ label: 'doubao-seed-1.6-250615', value: 'doubao-seed-1.6-250615' }],
  bailian: [],
  openai: []
}

const modelOptionsForPlatform = computed(() => PLATFORM_MODELS[aiSetting.value.platform])

const message = useMessage()
const dialog = useDialog()

onMounted(async () => {
  try {
    aiSetting.value = await window.api.getAISettings()
    browserPath.value = (await window.api.getBrowserExecPath()) || ''
  } catch (e) {
    // ignore
    message.error(String(e))
  }
})

const onPlatformChange = (p: 'volcengine' | 'bailian' | 'openai'): void => {
  const options = PLATFORM_MODELS[p].map((o) => o.value)
  if (!options.includes(aiSetting.value.model)) {
    aiSetting.value.model = options[0] || ''
  }
  aiSetting.value.apiKeys[p] = ''
}

const onSave = async (): Promise<void> => {
  try {
    const options = PLATFORM_MODELS[aiSetting.value.platform].map((o) => o.value)
    if (!options.includes(aiSetting.value.model)) {
      message.error('所选模型与平台不匹配')
      return
    }
    aiSetting.value = await window.api.updateAISettings(structuredClone(aiSetting.value))
    message.success('已保存')
  } catch (e) {
    message.error(String(e))
  }
}

const onClearAiSettings = (): void => {
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

const browserPath = ref<string>('')
const isSavingBrowser = ref<boolean>(false)
const onPickBrowser = async (): Promise<void> => {
  const picked = await window.api.selectBrowserExecPath()
  if (picked) browserPath.value = picked
}
const onSaveBrowser = async (): Promise<void> => {
  if (isSavingBrowser.value) return
  isSavingBrowser.value = true
  try {
    const r = await window.api.testBrowserLaunch({
      path: browserPath.value
    })
    if (!r.ok) {
      message.error(`路径错误：${r.message || '无法启动，请检查路径'}`)
      return
    }
    await window.api.updateBrowserExecPath({ path: browserPath.value.trim() })
    message.success('已保存Chrome浏览器路径')
  } catch (e) {
    message.error(`路径检测异常：${String(e)}`)
  } finally {
    isSavingBrowser.value = false
  }
}
</script>

<style lang="scss" scoped></style>
