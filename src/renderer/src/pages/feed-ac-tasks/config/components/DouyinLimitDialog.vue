<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    title="提示"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handleConfirm"
    @negative-click="handleCancel"
  >
    <div class="pt-3">
      <div class="text-gray-300 mb-4">
        由于抖音限制，无法获取前三条视频的数据，系统将会跳过前三条视频的处理
      </div>
      <n-checkbox v-model:checked="dontShowAgain"> 不再提示 </n-checkbox>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NCheckbox } from 'naive-ui'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm', dontShowAgain: boolean): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = ref(props.show)
const dontShowAgain = ref(false)

// 监听外部show变化
watch(
  () => props.show,
  (newVal) => {
    showModal.value = newVal
  }
)

// 监听内部showModal变化
watch(showModal, (newVal) => {
  emit('update:show', newVal)
})

const handleConfirm = (): void => {
  emit('confirm', dontShowAgain.value)
  showModal.value = false
}

const handleCancel = (): void => {
  emit('cancel')
  showModal.value = false
}
</script>
