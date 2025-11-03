<template>
  <n-form>
    <n-form-item label="规则组名称" required>
      <n-input v-model:value="groupName" placeholder="请输入规则组名称" />
    </n-form-item>

    <n-form-item label="规则类型" required>
      <n-radio-group v-model:value="ruleType" name="ruleType">
        <n-space>
          <n-radio :value="'manual'">手动配置规则</n-radio>
          <n-popover trigger="hover" :disabled="isAiConfigured">
            <template #trigger>
              <n-radio :value="'ai'" :disabled="!isAiConfigured || loading">AI判断</n-radio>
            </template>
            <div>
              请前往<strong class="px-1 text-green-300">全局设置-模型设置</strong
              >，完成AI相关配置后启用
            </div>
          </n-popover>
        </n-space>
      </n-radio-group>
    </n-form-item>

    <div v-if="ruleType === 'ai'">
      <n-form-item label="AI提示词" required>
        <n-input
          v-model:value="aiPrompt"
          type="textarea"
          placeholder="请输入提示词，描述您希望AI以什么规则判断是否观看视频"
          :maxlength="1000"
          show-count
          :rows="5"
        />
      </n-form-item>
    </div>

    <div v-else>
      <n-form-item label="规则关系" required>
        <n-select v-model:value="relation" placeholder="规则关系" :options="relationOptions" />
      </n-form-item>
      <n-form-item label="规则列表" required>
        <div class="flex flex-col gap-3 flex-1">
          <div v-for="(rule, idx) in rules" :key="idx" class="flex items-center gap-2">
            <n-select v-model:value="rule.field" placeholder="选择类型" :options="ruleOptions" />
            <span class="text-nowrap">包含关键字</span>
            <n-input v-model:value="rule.keyword" placeholder="输入关键字" class="w-full" />
            <n-button
              v-if="rules.length > 1"
              size="small"
              type="error"
              tertiary
              @click="removeRule(idx)"
            >
              删除
            </n-button>
          </div>
          <div class="w-10 flex gap-2">
            <n-button class="w-10" size="medium" tertiary type="primary" @click="addRule">
              添加条件
            </n-button>
          </div>
        </div>
      </n-form-item>
    </div>

    <div class="flex justify-end gap-2">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" @click="handleConfirm">确定</n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NForm,
  NFormItem,
  NRadioGroup,
  NRadio,
  NSpace,
  NInput,
  NSelect,
  NButton,
  NPopover
} from 'naive-ui'
import type { FeedAcRule, FeedAcRuleGroups } from '@/shared/feed-ac-setting'
import { useAiSettings } from '../../hooks/useAiSettings'

// 定义 props
const props = defineProps<{
  ruleGroup?: FeedAcRuleGroups
}>()

// 定义 emits
interface ModalEmits {
  (e: 'confirm', data: FeedAcRuleGroups): void
  (e: 'cancel'): void
}

const emit = defineEmits<ModalEmits>()

// 使用自定义hooks获取AI设置
const { isAiConfigured, loading } = useAiSettings()

// 表单数据
const ruleType = ref<'ai' | 'manual'>('manual')
const aiPrompt = ref('')
const relation = ref<'and' | 'or'>('or')
const rules = ref<FeedAcRule[]>([{ field: 'nickName', keyword: '' }])
const groupName = ref('')

// 选项配置
const relationOptions = [
  { label: '任一满足', value: 'or' },
  { label: '全部满足', value: 'and' }
]

const ruleOptions = [
  { label: '作者名称', value: 'nickName' },
  { label: '视频描述', value: 'videoDesc' },
  { label: '视频标签', value: 'videoTag' }
]

// 监听 ruleGroup 的变化，用于编辑模式
watch(
  () => props.ruleGroup,
  (newRuleGroup) => {
    if (newRuleGroup) {
      groupName.value = newRuleGroup.name
      ruleType.value = newRuleGroup.type

      if (newRuleGroup.type === 'ai' && newRuleGroup.aiPrompt) {
        aiPrompt.value = newRuleGroup.aiPrompt
      } else if (newRuleGroup.type === 'manual') {
        relation.value = newRuleGroup.relation || 'or'
        rules.value =
          newRuleGroup.rules && newRuleGroup.rules.length > 0
            ? [...newRuleGroup.rules]
            : [{ field: 'nickName', keyword: '' }]
      }
    }
  },
  { immediate: true }
)

// 规则操作方法
const addRule = (): void => {
  rules.value.push({ field: 'nickName', keyword: '' })
}

const removeRule = (index: number): void => {
  if (rules.value.length > 1) {
    rules.value.splice(index, 1)
  }
}

// 按钮处理方法
const handleCancel = (): void => {
  emit('cancel')
}

const handleConfirm = (): void => {
  // 简单验证
  if (!groupName.value.trim()) {
    // 这里应该添加一个提示，但为了简化代码暂不添加
    return
  }

  const result: Omit<FeedAcRuleGroups, 'id'> & { id?: string } = {
    // 如果是编辑模式，保留原有的ID；否则不传 id，由后端生成
    ...(props.ruleGroup?.id ? { id: props.ruleGroup.id } : {}),
    type: ruleType.value,
    name: groupName.value,
    ...(ruleType.value === 'ai'
      ? { aiPrompt: aiPrompt.value }
      : {
          relation: relation.value,
          rules: [...rules.value]
        })
  }

  emit('confirm', result as FeedAcRuleGroups)
}
</script>
