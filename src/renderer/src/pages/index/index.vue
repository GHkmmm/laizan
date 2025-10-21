<template>
  <n-layout has-sider class="w-screen h-screen">
    <n-layout-sider :native-scrollbar="false" bordered>
      <div class="w-full h-full flex items-center justify-start gap-4 px-4 py-4">
        <img
          :src="logo"
          alt="logo"
          class="w-[40px] h-[40px] drop-shadow-2xl/20 drop-shadow-[0_10px_20px_rgba(0,0,0,0)] drop-shadow-green-300"
        />
        <span class="font-bold text-lg">来赞</span>
      </div>
      <n-menu
        default-value="feed-ac-tasks"
        :options="menuOptions"
        :render-label="renderMenuLabel"
        class="h-screen"
      />
      <div class="absolute bottom-4 left-3 right-3">
        <n-button block type="default" tertiary round @click="onLogout">
          <template #icon>
            <NIcon>
              <LogOutOutline />
            </NIcon>
          </template>
        </n-button>
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
import { NMenu, NLayout, NLayoutSider, NButton, NIcon } from 'naive-ui'
import { Component, h, VNode } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LogOutOutline, SettingsOutline, AppsOutline, LogoTiktok } from '@vicons/ionicons5'
import logo from '../../../../../resources/icon.png'

const menuOptions: MenuOption[] = [
  {
    label: '营销工具',
    key: 'tools',
    icon: renderIcon(AppsOutline),
    children: [
      {
        label: '抖音',
        key: 'douyin',
        icon: renderIcon(LogoTiktok),
        children: [
          {
            label: '自动评论引流',
            key: 'feed-ac-tasks',
            routeName: 'feedAcTasks'
          }
        ]
      },
      {
        label: '小红书',
        key: 'xhs',
        children: [
          {
            label: '自动评论引流（开发中）',
            disabled: true
          }
        ]
      }
    ]
  },

  {
    label: '全局设置',
    key: 'settings',
    routeName: 'settings',
    icon: renderIcon(SettingsOutline)
  }
]

function renderIcon(icon: Component) {
  return () => h(NIcon, { size: 16 }, { default: () => h(icon) })
}

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
