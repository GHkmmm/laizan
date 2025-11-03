<template>
  <div class="flex flex-col gap-8 p-6">
    <ModelSettings />
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
    <!-- 调试模块，仅在开发模式下可见 -->
    <div v-if="isDev" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">调试</h2>
      </div>
      <n-card :bordered="true">
        <div class="flex flex-col gap-4">
          <div class="text-gray-500 text-sm leading-6">
            此模块仅在开发模式下可见，用于调试功能。
          </div>
          <n-button secondary @click="onOpenDouyinHomepage"> 抖音首页调试 </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useMessage, NForm, NFormItem, NInput, NButton, NCard } from 'naive-ui'
import ModelSettings from './components/ModelSettings.vue'

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

const message = useMessage()

// 检查是否为开发模式
const isDev = ref<boolean>(import.meta.env.DEV)

onMounted(async () => {
  try {
    browserPath.value = (await window.api.getBrowserExecPath()) || ''
  } catch (e) {
    // ignore
    message.error(String(e))
  }
})

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

// 打开抖音首页调试功能
const onOpenDouyinHomepage = async (): Promise<void> => {
  try {
    const result = await window.api.openDouyinHomepage()
    if (result.ok) {
      message.success(result.message || '已成功打开抖音首页')
    } else {
      message.error(result.message || '打开抖音首页失败')
    }
  } catch (e) {
    message.error(`打开抖音首页异常：${String(e)}`)
  }
}
</script>

<style lang="scss" scoped></style>
