<template>
  <n-form-item label="评论内容：">
    <div class="flex flex-col gap-4 pt-2 w-full">
      <!-- 评论文案配置 -->
      <div>
        <h3 class="font-medium mb-2">评论文案</h3>

        <div v-if="commentTexts.length === 0" class="flex flex-col justify-center items-center">
          <n-empty description="暂无评论文案">
            <template #extra>
              <n-button size="small" @click="addCommentText">添加文案</n-button>
            </template>
          </n-empty>
        </div>
        <div v-else>
          <div v-for="(_, index) in commentTexts" :key="index" class="flex items-center gap-2 mb-2">
            <n-input v-model:value="commentTexts[index]" placeholder="输入评论文案" size="medium" />
            <n-button size="medium" tertiary type="error" @click="removeCommentText(index)">
              删除
            </n-button>
          </div>
          <n-button size="medium" tertiary type="primary" @click="addCommentText"
            >添加文案</n-button
          >
        </div>
      </div>

      <!-- 评论图片配置 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">评论图片（可选）</span>
          <n-radio-group v-model:value="imageType">
            <n-radio value="folder">文件夹</n-radio>
            <n-radio value="file">单文件</n-radio>
          </n-radio-group>
        </div>
        <div class="flex items-center gap-2">
          <n-input
            v-model:value="imagePath"
            placeholder="点击右侧选择文件，不选择则不评论图片"
            readonly
            clearable
            size="medium"
          />
          <n-button size="medium" tertiary type="primary" @click="selectImagePath">选择</n-button>
        </div>
      </div>
    </div>
  </n-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NInput, NButton, NRadioGroup, NRadio, NEmpty } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { commentTexts, commentImagePath, commentImageType } = storeToRefs(settingsStore)

const imageType = computed({
  get: () => commentImageType.value,
  set: (value: 'folder' | 'file') => {
    settingsStore.updateCommentImageType(value)
  }
})

const imagePath = computed({
  get: () => commentImagePath.value || '',
  set: (value: string) => {
    settingsStore.updateCommentImagePath(value)
  }
})

// 方法
const addCommentText = (): void => {
  settingsStore.addCommentText('')
}

const removeCommentText = (index: number): void => {
  settingsStore.removeCommentText(index)
}

const selectImagePath = async (): Promise<void> => {
  try {
    const result = await window.api.selectImagePath(imageType.value)
    if (result.ok && result.path) {
      imagePath.value = result.path
    }
  } catch (error) {
    console.error('选择图片路径失败:', error)
  }
}

// 注意：不对 commentTexts 做深度 watch 自动保存，以避免保存后重新赋值导致的循环。
</script>
