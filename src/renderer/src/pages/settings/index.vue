<template>
  <div class="flex flex-col gap-8 p-6">
    <div class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">模型设置</h2>
      <n-card :bordered="true">
        <n-form label-width="auto">
          <n-form-item label="选择模型">
            <n-select
              v-model:value="modelProvider"
              :options="modelOptions"
              placeholder="选择模型提供方"
            />
          </n-form-item>
          <n-form-item label="API Key">
            <n-input
              v-model:value="doubaoKey"
              type="password"
              show-password-on="click"
              placeholder="仅展示，不保存"
            />
          </n-form-item>
        </n-form>
      </n-card>
    </div>

    <n-button :loading="clearing" tertiary size="large" @click="onClearCache"> 清理缓存 </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage, useDialog, NForm, NFormItem, NInput, NSelect, NButton, NCard } from 'naive-ui'

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

const doubaoKey = ref<string>('')
const modelProvider = ref<'doubao' | 'bailian' | 'openai'>('doubao')
const modelOptions = [
  { label: 'doubao-seed-1.6-250615', value: 'doubao' },
  { label: '阿里百炼（暂未适配）', value: 'bailian', disabled: true },
  { label: 'OpenAI（暂未适配）', value: 'openai', disabled: true }
]
const clearing = ref<boolean>(false)
const message = useMessage()
const dialog = useDialog()

const onClearCache = async (): Promise<void> => {
  if (clearing.value) return
  dialog.warning({
    title: '确认清理缓存',
    content: '清理缓存将会清空配置，是否继续？',
    positiveText: '继续',
    negativeText: '取消',
    negativeButtonProps: {
      quaternary: true,
      type: 'default',
      ghost: false
    },
    onPositiveClick: async () => {
      try {
        clearing.value = true
        await window.api.clearCache({ excludeKeys: ['auth'] })
        message.success('缓存已清理')
      } catch (e) {
        message.error(`清理失败：${String(e)}`)
      } finally {
        clearing.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped></style>
