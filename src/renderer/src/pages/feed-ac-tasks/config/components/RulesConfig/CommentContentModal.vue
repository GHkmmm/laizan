<template>
  <n-form>
    <n-form-item label="评论内容：">
      <div class="flex flex-col gap-5 py-2 w-full">
        <!-- 评论文案配置 -->
        <div>
          <div class="mb-3">
            <h3 class="font-medium mb-1"><strong class="text-red-400 mr-1">*</strong>评论文案</h3>
            <h3 class="text-xs text-gray-400">若配置多个文案则随机抽取一个评论</h3>
          </div>

          <div
            v-if="commentTexts.length === 0"
            class="flex flex-col justify-center items-center my-2"
          >
            <n-empty description="暂无评论文案">
              <template #extra>
                <div class="flex gap-2">
                  <n-button size="small" secondary type="primary" @click="addCommentText"
                    >添加文案</n-button
                  >
                  <n-button
                    size="small"
                    tertiary
                    style="
                      border: 1px solid transparent;
                      background-image:
                        linear-gradient(rgb(5, 7, 19), rgb(5, 7, 19)),
                        linear-gradient(to right, rgb(245, 65, 128), rgb(51, 142, 247));
                      background-origin: border-box;
                      background-clip: padding-box, border-box;
                    "
                    disabled
                  >
                    AI自动评论（敬请期待）
                  </n-button>
                </div>
              </template>
            </n-empty>
          </div>
          <div v-else>
            <div
              v-for="(_, index) in commentTexts"
              :key="index"
              class="flex items-center gap-2 mb-2"
            >
              <n-input
                v-model:value="commentTexts[index]"
                placeholder="输入评论文案"
                size="medium"
              />
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
            <div class="mb-1">
              <span class="font-medium mb-1">评论图片（可选）</span>
              <h3 class="text-xs text-gray-400">若选择文件夹则会从文件夹中随机抽取图片评论</h3>
            </div>
            <n-radio-group v-model:value="imageType" size="medium">
              <n-radio value="folder">文件夹</n-radio>
              <n-radio value="file">单文件</n-radio>
            </n-radio-group>
          </div>
          <div class="flex items-center gap-2">
            <n-input
              v-model:value="imagePath"
              placeholder="点击右侧选择文件或文件夹，不选择则不评论图片"
              readonly
              clearable
              size="medium"
            />
            <n-button size="medium" tertiary type="primary" @click="selectImagePath">选择</n-button>
          </div>
        </div>
      </div>
    </n-form-item>

    <div class="flex justify-end gap-2">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" @click="handleConfirm">确定</n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NButton, NRadioGroup, NRadio, NEmpty } from 'naive-ui'
import type { FeedAcRuleGroups } from '@/shared/feed-ac-setting'

// 定义 props
const props = defineProps<{
  ruleGroup?: FeedAcRuleGroups
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'confirm', ruleGroup: FeedAcRuleGroups): void
  (e: 'cancel'): void
}>()

// 表单数据
const commentTexts = ref<string[]>([])
const imageType = ref<'folder' | 'file'>('folder')
const imagePath = ref('')

// 初始化数据
onMounted(() => {
  if (props.ruleGroup) {
    commentTexts.value = props.ruleGroup.commentTexts ? [...props.ruleGroup.commentTexts] : []
    imageType.value = props.ruleGroup.commentImageType || 'folder'
    imagePath.value = props.ruleGroup.commentImagePath || ''
  }
})

// 方法
const addCommentText = (): void => {
  commentTexts.value.push('')
}

const removeCommentText = (index: number): void => {
  commentTexts.value.splice(index, 1)
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

const handleCancel = (): void => {
  emit('cancel')
}

const handleConfirm = (): void => {
  // 创建更新后的规则组对象
  const updatedRuleGroup: FeedAcRuleGroups = {
    ...(props.ruleGroup as FeedAcRuleGroups),
    commentTexts: [...commentTexts.value],
    commentImageType: imageType.value,
    commentImagePath: imagePath.value || undefined
  }

  emit('confirm', updatedRuleGroup)
}
</script>
