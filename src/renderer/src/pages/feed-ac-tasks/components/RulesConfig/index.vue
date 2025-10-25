<template>
  <n-form-item label="规则配置：">
    <div class="flex flex-col gap-3 pt-1 w-full">
      <div class="flex justify-between items-center">
        <h4 class="text-xs font-bold text-gray-400">当视频满足以下规则配置 系统会自动评论</h4>
        <n-button secondary type="primary" size="medium" @click="handleAddRuleGroup"
          >添加规则组</n-button
        >
      </div>
      <n-data-table bordered :columns="columns" :data="data" :row-key="rowKey" default-expand-all />
    </div>
  </n-form-item>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { NFormItem, NDataTable, NButton, useModal } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { h } from 'vue'
import Actions from './Actions.vue'
import RuleGroupModal from './RuleGroupModal.vue'

const modal = useModal()

const data = ref<FeedAcRuleGroups[]>([
  // {
  //   id: '1',
  //   name: '07akioni',
  //   type: 'manual',
  //   children: [
  //     {
  //       id: 'f2034b0f-6436-48ab-9f44-a332abca2d2e',
  //       name: '08akioni',
  //       type: 'ai',
  //       children: [
  //         {
  //           id: 'f2034b0f-6436-48ab-9f44-a332abca2d2e',
  //           name: '09akioni',
  //           type: 'manual'
  //         },
  //         {
  //           id: 'd878588b-58e2-42d2-b60d-928a6e05351e',
  //           name: '10akioni',
  //           type: 'manual'
  //         }
  //       ]
  //     }
  //   ]
  // }
])

const columns: DataTableColumns<FeedAcRuleGroups> = [
  {
    title: '规则组名称',
    key: 'name'
  },
  {
    title: '类型',
    key: 'type',
    render(row) {
      return row.type === 'ai' ? 'AI判断' : '手动配置规则'
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(Actions, { row })
    }
  }
]

function rowKey(row: FeedAcRuleGroups): string {
  return row.id
}

function handleAddRuleGroup(): void {
  const m = modal.create({
    title: '新增规则组',
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
          // 将新规则组添加到数据中
          data.value.push(ruleGroupData)
          m.destroy()
        }
      })
  })
}
</script>
