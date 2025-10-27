<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NDropdown, useDialog, useMessage } from 'naive-ui'
import { useTaskStore } from '../stores/task'
import { useSettingsStore } from '../stores/settings'
import {
  FeedAcSettingsV2,
  detectConfigVersion,
  getUnifiedFeedAcSettings
} from '@/shared/feed-ac-setting'
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

const validateImported = (
  content: string | undefined
): { ok: boolean; message?: string; data?: FeedAcSettingsV2; needMigration?: boolean } => {
  let setting: FeedAcSettingsV2
  try {
    setting = JSON.parse(content || '{}')
  } catch (e) {
    console.error(e)
    return { ok: false, message: 'JSON 解析失败' }
  }
  if (typeof setting !== 'object' || setting === null || Object.keys(setting).length === 0)
    return { ok: false, message: '文件结构异常' }

  try {
    // 检测配置版本
    const version = detectConfigVersion(setting)
    console.log('配置版本：', version)

    if (version === 'v2') {
      // v2 配置验证
      if (!Array.isArray(setting.authorBlockKeywords))
        return { ok: false, message: '作者屏蔽词配置错误' }

      if (!Array.isArray(setting.blockKeywords)) return { ok: false, message: '屏蔽词配置错误' }

      if (!Array.isArray(setting.ruleGroups)) return { ok: false, message: '规则组配置错误' }

      if (typeof setting.simulateWatchBeforeComment !== 'boolean')
        return { ok: false, message: '模拟观看项配置错误' }

      if (
        !Array.isArray(setting.watchTimeRangeSeconds) ||
        setting.watchTimeRangeSeconds.length !== 2
      )
        return { ok: false, message: '观看时长配置错误' }

      if (typeof setting.onlyCommentActiveVideo !== 'boolean')
        return { ok: false, message: '只观看活跃视频配置错误' }

      return { ok: true, data: setting as FeedAcSettingsV2 }
    } else if (version === 'v1') {
      // v1 配置需要迁移
      return { ok: true, data: getUnifiedFeedAcSettings(setting), needMigration: true }
    } else {
      return { ok: false, message: '不支持的配置文件格式' }
    }
  } catch (e) {
    return { ok: false, message: String(e) }
  }
}

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
        const v = validateImported(picked.content)
        if (!v.ok) {
          message.error(v.message || '文件内容不合法')
          return
        }

        // 检查是否需要迁移
        if (v.needMigration) {
          dialog.warning({
            title: '配置文件升级',
            content:
              '检测到旧版本配置文件，系统将自动升级配置格式。升级后原配置将作为默认规则组保存。',
            positiveText: '确认升级',
            negativeText: '取消',
            onPositiveClick: async () => {
              try {
                await window.api.updateFeedAcSettings(v.data || {})
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
                await window.api.updateFeedAcSettings(v.data || {})
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
