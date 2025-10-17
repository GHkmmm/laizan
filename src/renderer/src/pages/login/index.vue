<template>
  <div class="w-screen h-screen flex flex-col justify-center items-center gap-6">
    <div class="flex justify-center items-center">
      <n-steps :current="currentStep" size="small" vertical style="width: 230px">
        <n-step title="绑定浏览器路径" description="选择或输入Chrome路径" />
        <n-step title="登录抖音" description="启动浏览器完成登录" />
      </n-steps>

      <div v-if="currentStep === 1" class="flex-1">
        <n-form label-width="auto">
          <n-form-item label="浏览器可执行文件路径">
            <div class="flex gap-2 w-full">
              <n-input v-model:value="browserPath" placeholder="请输入或粘贴浏览器可执行文件路径" />
              <n-button tertiary @click="onPickBrowser">选择</n-button>
            </div>
          </n-form-item>
          <div class="text-gray-500 text-sm leading-6">
            <div>Mac 默认：/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</div>
            <div>Windows：请选择 chrome.exe 或手动输入</div>
          </div>
          <div class="mt-4 flex gap-2">
            <n-button type="primary" block @click="onSavePath">保存路径</n-button>
          </div>
        </n-form>
      </div>

      <div v-else class="flex flex-col justify-center">
        <div class="text-lg mb-4">当前未登录，请先登录抖音账号</div>
        <n-button round type="primary" @click="loginHandler">抖音账号登录</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton, NSteps, NStep, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { useAuthStore } from '@renderer/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const currentStep = ref<number>(1)
const browserPath = ref<string>('')

onMounted(async () => {
  const saved = await window.api.getBrowserExecPath()
  if (saved) {
    browserPath.value = saved
  }
})

const onPickBrowser = async (): Promise<void> => {
  const picked = await window.api.selectBrowserExecPath()
  if (picked) browserPath.value = picked
}

const onSavePath = async (): Promise<void> => {
  try {
    const r = await window.api.testBrowserLaunch({ path: browserPath.value.trim() })
    if (!r.ok) {
      message.error(`拉起失败，请检查路径: ${r.message}`)
      return
    }
  } catch (e) {
    message.error(`路径异常：${String(e)}`)
    return
  }
  await window.api.updateBrowserExecPath({ path: browserPath.value.trim() })
  message.success('已保存浏览器路径')
  currentStep.value = 2
}
const loginHandler = async (): Promise<void> => {
  await authStore.login()

  if (authStore.hasAuth === true) {
    router.push({ name: 'index' })
  }
}
</script>
