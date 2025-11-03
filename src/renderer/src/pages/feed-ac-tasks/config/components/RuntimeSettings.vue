<template>
  <n-form-item>
    <n-collapse>
      <n-collapse-item title="运行设置">
        <div class="flex flex-col gap-2 pt-3 w-full">
          <div class="flex flex-col gap-2">
            <n-checkbox
              v-model:checked="settings!.simulateWatchBeforeComment"
              size="small"
              @update:checked="saveSettings"
            >
              是否模拟真人先观看视频再评论
            </n-checkbox>
            <div v-if="settings!.simulateWatchBeforeComment" class="flex flex-col gap-2 py-3">
              <div>
                <span>视频将随机播放</span>
                <span class="text-green-200 px-1">{{ settings!.watchTimeRangeSeconds[0] }}秒</span>
                <span>至</span>
                <span class="text-green-200 px-1">{{ settings!.watchTimeRangeSeconds[1] }}秒</span>
                <span>后评论</span>
              </div>
              <n-slider
                v-model:value="settings!.watchTimeRangeSeconds"
                range
                :min="0"
                :max="60"
                :format-tooltip="(value: number) => `${value}秒`"
                @update:value="saveSettings"
              />
            </div>
          </div>
          <div class="flex items-center">
            <n-checkbox
              v-model:checked="settings!.onlyCommentActiveVideo"
              size="small"
              @update:checked="saveSettings"
            >
              只评论活跃视频
            </n-checkbox>
            <n-popover trigger="hover">
              <template #trigger>
                <n-icon size="20">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              <span>开启此选项将会只评论2天人有人评论的视频</span>
            </n-popover>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </n-form-item>
</template>

<script setup lang="ts">
import { NFormItem, NCheckbox, NSlider, NCollapse, NCollapseItem, NPopover, NIcon } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { HelpCircleOutline } from '@vicons/ionicons5'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { updateExceptRuleGroup } = settingsStore

const saveSettings = (): void => {
  updateExceptRuleGroup({
    simulateWatchBeforeComment: settings.value!.simulateWatchBeforeComment,
    watchTimeRangeSeconds: settings.value!.watchTimeRangeSeconds,
    onlyCommentActiveVideo: settings.value!.onlyCommentActiveVideo
  })
}
</script>
