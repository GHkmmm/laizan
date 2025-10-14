<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NInputNumber, NForm, NFormItem } from 'naive-ui'

const hasAuth = ref<boolean | null>(null)

interface TaskForm {
  maxCount: number
}

const formModel = ref<TaskForm>({
  maxCount: 10
})

const startTask = (): void => {
  const count = Number(formModel.value.maxCount)
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
  window.electron.ipcRenderer.send('startTask', { maxCount: safeCount })
}

const login = async (): Promise<void> => {
  await window.api.login()
  hasAuth.value = await window.api.hasAuth()
}

const logout = async (): Promise<void> => {
  window.api.logout()
  hasAuth.value = await window.api.hasAuth()
}

onMounted(async () => {
  hasAuth.value = await window.api.hasAuth()
})
</script>

<template>
  <div class="relative flex flex-col gap-4">
    <div v-if="hasAuth" class="absolute top-4 right-2">
      <n-button type="primary" tertiary round @click="logout">退出登录</n-button>
    </div>
    <div class="w-screen h-screen flex justify-center items-center">
      <template v-if="hasAuth">
        <div class="flex flex-col items-center mt-10">
          <div class="w-80">
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
            </n-form>
          </div>
          <n-button block type="primary" round strong size="large" @click="startTask"
            >开始任务</n-button
          >
        </div>
      </template>
      <template v-else>
        <n-button round @click="login">抖音账号登录</n-button>
      </template>
    </div>
  </div>
</template>
