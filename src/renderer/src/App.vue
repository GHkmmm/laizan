<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
  <div class="actions">
    <button v-if="hasAuth === true" class="start-button" @click="startTask">开始任务</button>
    <button v-if="hasAuth === true" class="logout-button" @click="logout">退出登录</button>
    <button v-else-if="hasAuth === false" class="login-button" @click="login">抖音账号登录</button>
  </div>
</template>
