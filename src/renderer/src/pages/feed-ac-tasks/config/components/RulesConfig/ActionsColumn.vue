<template>
  <n-button-group size="small" class="items-center">
    <n-button ghost type="primary" :bordered="false" @click="handleEdit">编辑</n-button>
    <n-divider vertical />
    <n-button ghost type="primary" :bordered="false" @click="handleCopy">复制</n-button>
    <n-divider vertical />
    <n-button ghost type="primary" :bordered="false" @click="handleDelete">删除</n-button>
    <n-divider vertical />
    <n-button ghost type="primary" :bordered="false" @click="handleAddChildRuleGroup">
      新增子规则组
    </n-button>
  </n-button-group>
</template>

<script setup lang="ts">
import { NButtonGroup, NButton, NDivider, useModal, useMessage, useDialog } from 'naive-ui'
import { h } from 'vue'
import RuleGroupModal from './RuleGroupModal.vue'
import type { FeedAcRuleGroups } from '@/shared/feed-ac-setting'

// 定义 props
const props = defineProps<{
  row: FeedAcRuleGroups
  parentId?: string
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'edit', id: string, ruleGroupData: FeedAcRuleGroups): void
  (e: 'copy', ruleGroupData: FeedAcRuleGroups, parentId?: string): void
  (e: 'delete', id: string): void
  (e: 'addChildRuleGroup', parentId: string, ruleGroupData: FeedAcRuleGroups): void
}>()

// 获取父组件的 modal、消息提示和对话框
const modal = useModal()
const message = useMessage()
const dialog = useDialog()

const handleEdit = (): void => {
  const m = modal.create({
    title: '编辑规则组',
    preset: 'card',
    style: {
      width: '600px'
    },
    content: () =>
      h(RuleGroupModal, {
        // 传递当前规则组的数据用于编辑
        ruleGroup: props.row,
        onCancel: () => {
          m.destroy()
        },
        onConfirm: (ruleGroupData) => {
          // 通过事件将编辑后的规则组传递给父组件处理
          emit('edit', props.row.id, ruleGroupData)
          m.destroy()
        }
      })
  })
}

const handleCopy = (): void => {
  // 直接传递规则组，后端会处理深拷贝和生成新 ID
  emit('copy', props.row, props.parentId)
  message.success('规则组复制成功')
}

const handleDelete = (): void => {
  // 根据是否有子规则组显示不同的确认提示
  const hasChildren = props.row.children && props.row.children.length > 0
  const content = hasChildren
    ? '确认删除后子规则组将会一起移除并且不可恢复，是否继续？'
    : '删除后不可恢复，是否继续？'

  dialog.warning({
    title: '确认删除',
    content,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      // 通过事件将要删除的规则组ID传递给父组件处理
      emit('delete', props.row.id)
      message.success('规则组删除成功')
    }
  })
}

const handleAddChildRuleGroup = (): void => {
  // 检查当前规则组是否已配置评论内容
  const hasCommentConfig =
    (props.row.commentTexts && props.row.commentTexts.length > 0) ||
    (props.row.commentImagePath && props.row.commentImagePath.length > 0)

  // 如果已配置评论内容，显示确认提示
  if (hasCommentConfig) {
    dialog.warning({
      title: '确认操作',
      content: '新增子规则组将会清空当前规则组配置的评论内容，是否继续？',
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => {
        openAddChildRuleGroupModal()
      }
    })
  } else {
    openAddChildRuleGroupModal()
  }
}

const openAddChildRuleGroupModal = (): void => {
  const m = modal.create({
    title: '新增子规则组',
    preset: 'card',
    style: {
      width: '600px'
    },
    content: () =>
      h(RuleGroupModal, {
        onCancel: () => {
          m.destroy()
        },
        onConfirm: (ruleGroupData) => {
          // 通过事件将新规则组传递给父组件处理
          emit('addChildRuleGroup', props.row.id, ruleGroupData)
          m.destroy()
        }
      })
  })
}
</script>
