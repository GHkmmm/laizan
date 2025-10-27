<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NDropdown, useDialog, useMessage } from 'naive-ui'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import { structuredClone } from '@/utils/common'

const message = useMessage()
const dialog = useDialog()

const taskStore = useTaskStore()
const settingsStore = useSettingsStore()

const disabled = computed(() => ['running', 'stopping'].includes(taskStore.taskStatus))

type Key = 'import' | 'export' | 'clear'
const options = [
  { label: '导入配置', key: 'import' as Key },
  { label: '导出配置', key: 'export' as Key },
  { label: '清空配置', key: 'clear' as Key }
]

const handleSelect = async (key: Key): Promise<void> => {
  if (disabled.value) return
  switch (key) {
    case 'export': {
      try {
        const res = await window.api.exportFeedAcSettings(structuredClone(settingsStore.settings))
        if (res.ok) {
          message.success(`已导出到：${res.path}`)
        } else {
          if (res.message && res.message !== '用户取消') message.error(res.message)
        }
      } catch (e) {
        message.error(String(e))
      }
      break
    }
    case 'import': {
      try {
        const picked = await window.api.pickImportFeedAcSettings()
        if (!picked.ok) {
          if (picked.message && picked.message !== '用户取消') message.error(picked.message)
          return
        }
        if (!picked.data) {
          message.error('文件内容不合法')
          return
        }

        // 检查是否需要迁移
        if (picked.needMigration) {
          dialog.warning({
            title: '配置文件升级',
            content:
              '检测到旧版本配置文件，系统将自动升级配置格式。升级后原配置将作为默认规则组保存。',
            positiveText: '确认升级',
            negativeText: '取消',
            onPositiveClick: async () => {
              try {
                await window.api.updateFeedAcSettings(picked.data || {})
                // 刷新表单数据
                await settingsStore.loadSettings()
                message.success('配置已升级并导入成功')
              } catch (e) {
                message.error(String(e))
              }
            }
          })
        } else {
          dialog.warning({
            title: '确认导入配置',
            content: '导入将覆盖当前配置，是否继续？',
            positiveText: '继续',
            negativeText: '取消',
            onPositiveClick: async () => {
              try {
                await window.api.updateFeedAcSettings(picked.data || {})
                // 刷新表单数据
                await settingsStore.loadSettings()
                message.success('已导入配置并覆盖当前配置')
              } catch (e) {
                message.error(String(e))
              }
            }
          })
        }
      } catch (e) {
        message.error(String(e))
      }
      break
    }
    case 'clear': {
      dialog.warning({
        title: '确认清空配置',
        content: '此操作将恢复任务配置为默认值，是否继续？',
        positiveText: '继续',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await settingsStore.resetSettings()
            message.success('已清空配置')
          } catch (e) {
            message.error(String(e))
          }
        }
      })
      break
    }
  }
}
</script>

<template>
  <n-dropdown :options="options" trigger="click" :disabled="disabled" @select="handleSelect">
    <n-button tertiary>配置管理</n-button>
  </n-dropdown>
</template>
