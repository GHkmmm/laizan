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
        :data="settings.ruleGroups"
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
const { saveSettings, onSettingsLoaded } = settingsStore

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
  expandedRowKeys.value = getAllParentIds(settings.value.ruleGroups)
}

// 组件挂载时加载配置
onMounted(async () => {
  await settingsStore.loadSettings()
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
      buildParentMap(settings.value.ruleGroups)

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
function handleEditRuleGroup(id: string, ruleGroupData: FeedAcRuleGroups): void {
  const updateRuleGroup = (groups: FeedAcRuleGroups[]): boolean => {
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].id === id) {
        groups[i] = Object.assign({}, groups[i], ruleGroupData)
        return true
      }

      if (groups[i].children && groups[i].children!.length > 0) {
        if (updateRuleGroup(groups[i].children!)) {
          return true
        }
      }
    }
    return false
  }

  updateRuleGroup(settings.value.ruleGroups)

  saveSettings()
}

// 复制规则组
function handleCopyRuleGroup(ruleGroupData: FeedAcRuleGroups, parentId?: string): void {
  // 如果有父级ID，则将复制的规则组添加到对应的父级下
  if (parentId) {
    const findAndAddToParent = (groups: FeedAcRuleGroups[]): boolean => {
      for (const group of groups) {
        if (group.id === parentId) {
          if (!group.children) {
            group.children = []
          }
          group.children.push(ruleGroupData)
          return true
        }

        if (group.children && group.children.length > 0) {
          if (findAndAddToParent(group.children)) {
            return true
          }
        }
      }
      return false
    }

    findAndAddToParent(settings.value.ruleGroups)
  } else {
    // 如果没有父级ID，则将复制的规则组添加到根级别
    settings.value.ruleGroups.push(ruleGroupData)
  }
  saveSettings()
}

// 配置评论内容
function handleConfigureComment(ruleGroupData: FeedAcRuleGroups): void {
  const updateRuleGroup = (groups: FeedAcRuleGroups[]): boolean => {
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].id === ruleGroupData.id) {
        // 更新评论相关字段
        groups[i].commentTexts = ruleGroupData.commentTexts
        groups[i].commentImagePath = ruleGroupData.commentImagePath
        groups[i].commentImageType = ruleGroupData.commentImageType
        return true
      }

      if (groups[i].children && groups[i].children!.length > 0) {
        if (updateRuleGroup(groups[i].children!)) {
          return true
        }
      }
    }
    return false
  }

  updateRuleGroup(settings.value.ruleGroups)
  saveSettings()
}

// 删除规则组
function handleDeleteRuleGroup(id: string): void {
  const deleteRuleGroup = (groups: FeedAcRuleGroups[]): boolean => {
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].id === id) {
        groups.splice(i, 1)
        return true
      }

      if (groups[i].children && groups[i].children!.length > 0) {
        if (deleteRuleGroup(groups[i].children!)) {
          return true
        }
      }
    }
    return false
  }

  deleteRuleGroup(settings.value.ruleGroups)

  saveSettings()
}

// 添加子规则组的函数
function addChildRuleGroup(parentId: string, ruleGroupData: FeedAcRuleGroups): void {
  const findAndAddChild = (groups: FeedAcRuleGroups[]): boolean => {
    for (const group of groups) {
      if (group.id === parentId) {
        // 清空当前规则组的评论内容
        delete group.commentTexts
        delete group.commentImagePath
        delete group.commentImageType

        if (!group.children) {
          group.children = []
        }
        group.children.push(ruleGroupData)

        // 展开父级规则组
        if (!expandedRowKeys.value.includes(parentId)) {
          expandedRowKeys.value = [...expandedRowKeys.value, parentId]
        }

        return true
      }

      if (group.children && group.children.length > 0) {
        if (findAndAddChild(group.children)) {
          return true
        }
      }
    }
    return false
  }

  findAndAddChild(settings.value.ruleGroups)
  saveSettings()
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
          console.log('settings.value', settings.value)
          settings.value.ruleGroups.push(ruleGroupData)
          saveSettings()
          m.destroy()
        }
      })
  })
}
</script>
