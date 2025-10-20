<template>
  <n-form-item>
    <n-collapse>
      <n-collapse-item title="运行设置">
        <div class="flex flex-col gap-2 pt-3 w-full">
          <div class="flex flex-col gap-2">
            <n-checkbox
              v-model:checked="simulateWatchBeforeComment"
              size="small"
              @update:checked="saveSettings"
            >
              是否模拟真人先观看视频再评论
            </n-checkbox>
            <div v-if="simulateWatchBeforeComment" class="flex flex-col gap-2 py-3">
              <div>
                <span>视频将随机播放</span>
                <span class="text-green-200 px-1">{{ watchTimeRangeSeconds[0] }}秒</span>
                <span>至</span>
                <span class="text-green-200 px-1">{{ watchTimeRangeSeconds[1] }}秒</span>
                <span>后评论</span>
              </div>
              <n-slider
                v-model:value="watchTimeRangeSeconds"
                range
                :min="0"
                :max="60"
                :format-tooltip="(value: number) => `${value}秒`"
                @update:value="saveSettings"
              />
            </div>
          </div>
          <n-checkbox
            v-model:checked="onlyCommentActiveVideo"
            size="small"
            @update:checked="saveSettings"
          >
            只评论活跃视频
          </n-checkbox>
        </div>
      </n-collapse-item>
    </n-collapse>
  </n-form-item>
</template>

<script setup lang="ts">
import { NFormItem, NCheckbox, NSlider, NCollapse, NCollapseItem } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { simulateWatchBeforeComment, watchTimeRangeSeconds, onlyCommentActiveVideo } =
  storeToRefs(settingsStore)

const saveSettings = (): Promise<void> => {
  return settingsStore.saveSettings()
}
</script>
