<template>
  <div>
    <div v-if="hasChildren">
      <span class="text-gray-400">/</span>
    </div>
    <div v-else>
      <n-button v-if="!hasCommentConfig" text type="primary" @click="handleConfigureComment">
        配置评论内容
      </n-button>
      <div
        v-else
        class="cursor-pointer text-green-300 hover:text-green-200 underline"
        @click="handleConfigureComment"
      >
        {{ displayComment }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton, useModal } from 'naive-ui'
import { h } from 'vue'
import type { FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import CommentContentModal from './CommentContentModal.vue'

// 定义 props
const props = defineProps<{
  row: FeedAcRuleGroups
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'configureComment', ruleGroupData: FeedAcRuleGroups): void
}>()

// 计算是否有子规则组
const hasChildren = computed(() => {
  return props.row.children && props.row.children.length > 0
})

// 计算是否已配置评论
const hasCommentConfig = computed(() => {
  return (
    (props.row.commentTexts && props.row.commentTexts.length > 0) ||
    (props.row.commentImagePath && props.row.commentImagePath.length > 0)
  )
})

// 计算显示的评论内容
const displayComment = computed(() => {
  if (props.row.commentTexts && props.row.commentTexts.length > 0) {
    // 如果有多条评论，显示第一条并提示还有更多
    if (props.row.commentTexts.length > 1) {
      return `${props.row.commentTexts[0]} (+${props.row.commentTexts.length - 1})`
    }
    return props.row.commentTexts[0]
  }
  if (props.row.commentImagePath) {
    return '[图片评论]'
  }
  return ''
})

// 获取父组件的 modal
const modal = useModal()

const handleConfigureComment = (): void => {
  const m = modal.create({
    title: '配置评论内容',
    preset: 'card',
    style: {
      width: '600px'
    },
    content: () =>
      h(CommentContentModal, {
        ruleGroup: props.row,
        onCancel: () => {
          m.destroy()
        },
        onConfirm: (ruleGroupData) => {
          // 通过事件将配置后的规则组传递给父组件处理
          emit('configureComment', ruleGroupData)
          m.destroy()
        }
      })
  })
}
</script>
