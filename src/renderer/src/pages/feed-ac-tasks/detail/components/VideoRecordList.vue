<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NCard, NDataTable, NTag, NRadioGroup, NRadioButton, NEmpty } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { TaskHistoryRecord, VideoRecord } from '@/shared/task-history'

interface Props {
  task: TaskHistoryRecord
}

const props = defineProps<Props>()

// 筛选条件
type FilterType = 'all' | 'commented'
const filter = ref<FilterType>('all')

// 筛选后的视频列表
const filteredVideos = computed(() => {
  if (filter.value === 'commented') {
    return props.task.videoRecords.filter((v) => v.isCommented)
  }
  return props.task.videoRecords
})

// 格式化观看时长（毫秒转秒）
const formatDuration = (ms: number): string => {
  return (ms / 1000).toFixed(1) + ' 秒'
}

// 表格列定义
const columns: DataTableColumns<VideoRecord> = [
  {
    title: '作者',
    key: 'authorName',
    width: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '视频描述',
    key: 'videoDesc',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '视频标签',
    key: 'videoTags',
    width: 150,
    render: (row) => {
      return row.videoTags.join(', ') || '-'
    },
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '观看时长',
    key: 'watchDuration',
    width: 100,
    render: (row) => formatDuration(row.watchDuration)
  },
  {
    title: '评论状态',
    key: 'isCommented',
    width: 100,
    render: (row) => {
      return h(
        NTag,
        {
          type: row.isCommented ? 'success' : 'default',
          size: 'small'
        },
        () => (row.isCommented ? '已评论' : '未评论')
      )
    }
  },
  {
    title: '评论内容/跳过原因',
    key: 'content',
    render: (row) => {
      return row.isCommented ? row.commentText : row.skipReason
    },
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '视频链接',
    key: 'shareUrl',
    width: 100,
    render: (row) => {
      if (!row.shareUrl) return '-'
      return h(
        'a',
        {
          href: row.shareUrl,
          target: '_blank',
          class: 'text-blue-500 hover:underline',
          onClick: (e: Event) => {
            e.preventDefault()
            window.open(row.shareUrl, '_blank')
          }
        },
        '查看视频'
      )
    }
  }
]
</script>

<template>
  <div class="p-6">
    <n-card title="视频观看记录">
      <template #header-extra>
        <n-radio-group v-model:value="filter" size="small">
          <n-radio-button value="all"> 全部 ({{ task.videoRecords.length }}) </n-radio-button>
          <n-radio-button value="commented"> 已评论 ({{ task.commentCount }}) </n-radio-button>
        </n-radio-group>
      </template>

      <n-data-table
        v-if="filteredVideos.length > 0"
        :columns="columns"
        :data="filteredVideos"
        :pagination="{
          pageSize: 20
        }"
        :bordered="false"
        striped
      />
      <n-empty v-else description="暂无视频记录" class="py-10" />
    </n-card>
  </div>
</template>

<style scoped>
/* 可选：添加自定义样式 */
</style>
