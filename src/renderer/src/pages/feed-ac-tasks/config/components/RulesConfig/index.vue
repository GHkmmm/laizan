<template>
  <n-form-item label="规则配置：" label-placement="top">
    <!-- <template #label>
      <h2 class="text-lg">规则配置：</h2>
    </template> -->
    <div class="flex flex-col gap-3 w-full">
      <div class="flex justify-between items-center">
        <h4 class="text-xs font-bold text-gray-400">只有配置了评论内容系统才会发布评论哦～</h4>
        <n-button secondary type="primary" size="medium" @click="handleAddRuleGroup"
          >新增规则组
        </n-button>
      </div>
      <n-data-table
        bordered
        :columns="columns"
        :data="settings!.ruleGroups"
        :row-key="rowKey"
        :expanded-row-keys="expandedRowKeys"
        @update:expanded-row-keys="handleUpdateExpandedRowKeys"
      />
    </div>
  </n-form-item>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { NFormItem, NDataTable, NButton, useModal } from 'naive-ui'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { h } from 'vue'
import ActionsColumn from './ActionsColumn.vue'
import CommentColumn from './CommentColumn.vue'
import RuleGroupModal from './RuleGroupModal.vue'
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const modal = useModal()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const {
  onSettingsLoaded,
  updateRuleGroup: updateRuleGroupAPI,
  copyRuleGroup: copyRuleGroupAPI,
  deleteRuleGroup: deleteRuleGroupAPI,
  createRuleGroup: createRuleGroupAPI
} = settingsStore

// 递归获取所有包含子规则的规则组ID
const getAllParentIds = (groups: FeedAcRuleGroups[]): DataTableRowKey[] => {
  const ids: DataTableRowKey[] = []

  groups.forEach((group) => {
    if (group.children && group.children.length > 0) {
      ids.push(group.id)
      // 递归获取子规则组中的父级ID
      ids.push(...getAllParentIds(group.children))
    }
  })

  return ids
}

// 展开所有包含子规则的规则组
const expandAllRuleGroups = (): void => {
  expandedRowKeys.value = getAllParentIds(settings.value!.ruleGroups)
}

// 组件挂载时加载配置
onMounted(async () => {
  // 初始加载时展开所有规则组
  expandAllRuleGroups()
  // 注册配置加载完成的回调，当导入配置时也会展开所有规则组
  onSettingsLoaded(expandAllRuleGroups)
})

// 控制展开的行键值
const expandedRowKeys = ref<DataTableRowKey[]>([])

// 处理展开行键值更新
const handleUpdateExpandedRowKeys = (keys: DataTableRowKey[]): void => {
  expandedRowKeys.value = keys
}

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
    title: '评论内容',
    key: 'comment',
    render(row) {
      return h(CommentColumn, {
        row,
        onConfigureComment: (ruleGroupData: FeedAcRuleGroups) => {
          handleConfigureComment(ruleGroupData)
        }
      })
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      // 创建一个映射来存储每个规则组的父级ID
      const parentMap = new Map<string, string>()

      // 递归构建父级映射
      const buildParentMap = (groups: FeedAcRuleGroups[], parentId?: string): void => {
        groups.forEach((group) => {
          if (parentId) {
            parentMap.set(group.id, parentId)
          }

          if (group.children && group.children.length > 0) {
            buildParentMap(group.children, group.id)
          }
        })
      }

      // 构建当前的父级映射
      buildParentMap(settings.value!.ruleGroups)

      return h(ActionsColumn, {
        row,
        parentId: parentMap.get(row.id),
        onEdit: (id: string, ruleGroupData: FeedAcRuleGroups) => {
          handleEditRuleGroup(id, ruleGroupData)
        },
        onCopy: (ruleGroupData: FeedAcRuleGroups, parentId?: string) => {
          handleCopyRuleGroup(ruleGroupData, parentId)
        },
        onDelete: (id: string) => {
          handleDeleteRuleGroup(id)
        },
        onAddChildRuleGroup: (parentId: string, ruleGroupData: FeedAcRuleGroups) => {
          addChildRuleGroup(parentId, ruleGroupData)
        }
      })
    }
  }
]

function rowKey(row: FeedAcRuleGroups): string {
  return row.id
}

// 编辑规则组
async function handleEditRuleGroup(id: string, ruleGroupData: FeedAcRuleGroups): Promise<void> {
  await updateRuleGroupAPI(id, ruleGroupData)
}

// 复制规则组
async function handleCopyRuleGroup(
  ruleGroupData: FeedAcRuleGroups,
  parentId?: string
): Promise<void> {
  await copyRuleGroupAPI(ruleGroupData.id, parentId)
}

// 配置评论内容
async function handleConfigureComment(ruleGroupData: FeedAcRuleGroups): Promise<void> {
  // 只更新评论相关字段
  await updateRuleGroupAPI(ruleGroupData.id, {
    commentTexts: ruleGroupData.commentTexts,
    commentImagePath: ruleGroupData.commentImagePath,
    commentImageType: ruleGroupData.commentImageType
  })
}

// 删除规则组
async function handleDeleteRuleGroup(id: string): Promise<void> {
  await deleteRuleGroupAPI(id)
}

// 添加子规则组的函数
async function addChildRuleGroup(parentId: string, ruleGroupData: FeedAcRuleGroups): Promise<void> {
  // 先清空父级规则组的评论内容
  await updateRuleGroupAPI(parentId, {
    commentTexts: undefined,
    commentImagePath: undefined,
    commentImageType: undefined
  })

  // 再创建子规则组
  await createRuleGroupAPI(ruleGroupData, parentId)

  // 展开父级规则组
  if (!expandedRowKeys.value.includes(parentId)) {
    expandedRowKeys.value = [...expandedRowKeys.value, parentId]
  }
}

async function handleAddRuleGroup(): Promise<void> {
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
        onConfirm: async (ruleGroupData) => {
          // 调用 API 创建规则组（不传 parentId，作为根规则组）
          await createRuleGroupAPI(ruleGroupData)
          m.destroy()
        }
      })
  })
}
</script>
