import { FeedAcSettingsV2 } from './feed-ac-setting'

/**
 * 任务状态枚举
 */
export type TaskStatus = 'running' | 'completed' | 'stopped' | 'error'

/**
 * 视频观看记录
 */
export interface VideoRecord {
  /** 视频唯一标识 */
  videoId: string
  /** 视频作者昵称 */
  authorName: string
  /** 视频描述 */
  videoDesc: string
  /** 视频标签列表 */
  videoTags: string[]
  /** 视频分享链接 */
  shareUrl: string
  /** 观看时长（毫秒） */
  watchDuration: number
  /** 是否已评论 */
  isCommented: boolean
  /** 评论内容，已评论时必填 */
  commentText?: string
  /** 未评论原因，未评论时必填 */
  skipReason?: string
  /** 记录时间戳（毫秒） */
  timestamp: number
}

/**
 * 任务历史记录
 */
export interface TaskHistoryRecord {
  /** 任务唯一标识，使用 nanoid 生成 */
  id: string
  /** 任务开始时间戳（毫秒） */
  startTime: number
  /** 任务结束时间戳，运行中为 null */
  endTime: number | null
  /** 任务状态 */
  status: TaskStatus
  /** 错误信息，status 为 error 时必填 */
  errorMessage?: string
  /** 成功评论次数 */
  commentCount: number
  /** 视频观看记录列表 */
  videoRecords: VideoRecord[]
  /** 任务使用的配置快照 */
  settings: FeedAcSettingsV2
}
