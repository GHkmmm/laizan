<template>
  <div class="absolute top-4 right-2">
    <n-button type="primary" tertiary @click="handleLogout">退出登录</n-button>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { logout } = authStore

const handleLogout = async (): Promise<void> => {
  await logout()
  router.push('/unauth')
}
</script>
