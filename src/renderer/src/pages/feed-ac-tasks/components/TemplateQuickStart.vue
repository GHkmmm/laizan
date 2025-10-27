<template>
  <n-alert
    v-if="visible"
    title="快速体验“自动评论引流”功能"
    closable
    class="mt-4 mb-5"
    :bordered="false"
    @close="handleClose"
  >
    <template #icon>
      <n-icon size="26" class="text-amber-200">
        <Happy />
      </n-icon>
    </template>
    <div class="flex flex-col gap-3">
      <p class="text-sm text-gray-400">
        以下是我们使用AI生成的一些简易模版，方便您快速体验功能，而非各个行业的最佳实践，请您根据实际需求自行调整规则。
      </p>

      <!-- 模板列表 - 横向展示 -->
      <div class="w-full overflow-scroll no-scrollbar">
        <div class="flex gap-2">
          <transition-group name="slide-in">
            <n-tag
              v-for="(fileName, index) in templates"
              :key="fileName"
              :bordered="false"
              size="medium"
              class="template-tag cursor-pointer hover:opacity-80 transition-opacity"
              type="warning"
              :style="{ animationDelay: `${index * 100}ms` }"
              @click="handleTemplateClick(fileName)"
            >
              {{ getTemplateName(fileName) }}
            </n-tag>
          </transition-group>
        </div>
      </div>
    </div>
  </n-alert>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NAlert, NTag, NIcon, useDialog, useMessage } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { Happy } from '@vicons/ionicons5'
import { LocalStorageManager, STORAGE_KEYS } from '@renderer/utils/storage-keys'

const message = useMessage()
const dialog = useDialog()
const settingsStore = useSettingsStore()

const templates = ref<string[]>([])
const visible = ref(false)

// 从文件名提取模板名称
const getTemplateName = (fileName: string): string => {
  return fileName.replace('.json', '')
}

// 处理模板点击
const handleTemplateClick = async (fileName: string): Promise<void> => {
  const name = getTemplateName(fileName)

  dialog.warning({
    title: '确认导入模板',
    content: `即将导入"${name}"模板，这将覆盖当前配置，是否继续？`,
    positiveText: '继续',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const result = await window.api.pickImportFeedAcSettings(fileName)
        if (!result.ok) {
          message.error(result.message || '导入失败')
          return
        }
        if (!result.data) {
          message.error('模板数据无效')
          return
        }

        // 更新配置
        await window.api.updateFeedAcSettings(result.data)
        // 刷新状态
        await settingsStore.loadSettings()
        message.success(`模板"${name}"导入成功`)
      } catch (e) {
        message.error(String(e))
      }
    }
  })
}

// 处理关闭
const handleClose = (): void => {
  LocalStorageManager.set(STORAGE_KEYS['laizan-template-alert-dismissed'], true)
  visible.value = false
}

// 组件挂载时检查
onMounted(async () => {
  // 检查是否已关闭
  if (LocalStorageManager.get(STORAGE_KEYS['laizan-template-alert-dismissed'])) {
    visible.value = false
    return
  }

  try {
    // 获取模板列表
    templates.value = await window.api.getTemplateList()
    visible.value = templates.value.length > 0
  } catch (e) {
    console.error('获取模板列表失败:', e)
    visible.value = false
  }
})
</script>

<style scoped>
.template-tag {
  animation: slideInFromRight 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
