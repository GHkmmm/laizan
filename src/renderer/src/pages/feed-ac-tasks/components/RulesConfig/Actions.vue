<template>
  <div class="flex items-center gap-2">
    <n-button tertiary size="small" @click="handleEdit">编辑</n-button>
    <n-button tertiary size="small" @click="handleCopy">复制</n-button>
    <n-button tertiary size="small" @click="handleDelete">删除</n-button>
    <n-button tertiary size="small" @click="handleAddChildRuleGroup">新增子规则组</n-button>
  </div>
</template>

<script setup lang="ts">
import { NButton, useModal, useMessage } from 'naive-ui'
import { h } from 'vue'
import RuleGroupModal from './RuleGroupModal.vue'
import type { FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { customAlphabet } from 'nanoid'

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

// 获取父组件的 modal 和消息提示
const modal = useModal()
const message = useMessage()
const nanoid = customAlphabet('1234567890abcdef', 16)

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
  // 深拷贝规则组数据并生成新的ID
  const copiedRuleGroup = JSON.parse(JSON.stringify(props.row))
  copiedRuleGroup.id = nanoid()

  // 递归更新所有子规则组的ID
  const updateIds = (group: FeedAcRuleGroups): void => {
    group.id = nanoid()
    if (group.children && group.children.length > 0) {
      group.children.forEach(updateIds)
    }
  }

  if (copiedRuleGroup.children && copiedRuleGroup.children.length > 0) {
    copiedRuleGroup.children.forEach(updateIds)
  }

  // 通过事件将复制的规则组和父级ID传递给父组件处理
  emit('copy', copiedRuleGroup, props.parentId)
  message.success('规则组复制成功')
}

const handleDelete = (): void => {
  // 通过事件将要删除的规则组ID传递给父组件处理
  emit('delete', props.row.id)
  message.success('规则组删除成功')
}

const handleAddChildRuleGroup = (): void => {
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
