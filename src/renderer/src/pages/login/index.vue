<template>
  <div class="w-screen h-screen flex flex-col justify-center items-center gap-6">
    <div class="text-lg">当前未登录，请先登录抖音账号</div>
    <n-button round type="primary" @click="loginHandler">抖音账号登录</n-button>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useAuthStore } from '@renderer/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const loginHandler = async (): Promise<void> => {
  await authStore.login()

  if (authStore.hasAuth === true) {
    router.push({ name: 'index' })
  }
}
</script>
