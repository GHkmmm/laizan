<template>
  <n-layout has-sider class="w-screen h-screen">
    <n-layout-sider class="pt-4 h-screen" :width="200" :native-scrollbar="false" bordered>
      <n-menu
        default-value="feed-ac-tasks"
        :options="menuOptions"
        :render-label="renderMenuLabel"
      />
      <div class="absolute bottom-4 left-3 right-3">
        <n-button block type="error" tertiary @click="onLogout">退出登录</n-button>
      </div>
    </n-layout-sider>
    <n-layout :native-scrollbar="false">
      <RouterView />
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from '@renderer/stores/auth'
import type { MenuOption } from 'naive-ui'
import { NMenu, NLayout, NLayoutSider, NButton } from 'naive-ui'
import { h, VNode } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const menuOptions: MenuOption[] = [
  {
    label: '自动评论',
    key: 'feed-ac-tasks',
    routeName: 'feedAcTasks'
  },

  {
    label: '全局设置',
    key: 'settings',
    routeName: 'settings'
  }
]

function renderMenuLabel(option: MenuOption): VNode {
  return h(
    RouterLink,
    {
      to: {
        name: option.routeName as string
      }
    },
    { default: () => option.label }
  )
}

const router = useRouter()
const authStore = useAuthStore()
const onLogout = async (): Promise<void> => {
  await authStore.logout()
  router.push('/login')
}
</script>
