<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton } from 'naive-ui'

const hasAuth = ref<boolean | null>(null)

const startTask = (): void => {
  window.electron.ipcRenderer.send('startTask')
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
  <div class="flex flex-col gap-4">
    <template v-if="hasAuth">
      <n-button type="primary" round @click="startTask">开始任务</n-button>
      <n-button type="primary" secondary round @click="logout">退出登录</n-button>
    </template>
    <template v-else>
      <n-button round @click="login">抖音账号登录</n-button>
    </template>
  </div>
</template>
