<template>
  <n-form-item>
    <n-collapse>
      <n-collapse-item>
        <template #header>
          <div class="flex flex-col w-full">
            <span>关键词屏蔽设置</span>
            <h4 class="text-xs font-bold text-gray-400">若视频命中设置的关键词，则跳过视频</h4>
          </div>
        </template>
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2">
            <div class="mb-1 text-sm">作者昵称</div>
            <n-dynamic-input
              v-model:value="settings.authorBlockKeywords"
              placeholder="输入关键词"
              @update:value="saveSettings"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="mb-1 text-sm">视频描述</div>
            <n-dynamic-input
              v-model:value="settings.blockKeywords"
              placeholder="输入关键词"
              @update:value="saveSettings"
            />
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </n-form-item>
</template>

<script setup lang="ts">
import { NFormItem, NCollapse, NCollapseItem, NDynamicInput } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { saveSettings } = settingsStore
const { settings } = storeToRefs(settingsStore)
</script>
