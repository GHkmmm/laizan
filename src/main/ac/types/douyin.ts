// 视频标签接口数据类型定义
export interface VideoTag {
  level: number
  tag_id: number
  tag_name: string
}

// 视频Feed接口数据类型定义
export interface FeedListResponse {
  aweme_list: FeedItem[]
}

export interface FeedItem {
  author: {
    nickname: string
    uid: string
  }
  aweme_id: string
  aweme_type: number
  desc: string
  video_tag: VideoTag[]
  share_url: string
}

export interface CommentResponse {
  status_code: number
  comments: {
    cid: string
    text: string
    create_time: number
    digg_count: number
    user: {
      nickname: string
    }
    // reply_comment: any[]
    ip_label: string
  }[]
  cursor: number
  has_more: number
  total: number
}
