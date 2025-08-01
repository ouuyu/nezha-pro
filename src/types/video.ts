// ==================== 视频管理相关接口 ====================

/**
 * 远程视频信息
 */
export interface RemoteVideoInfo {
  key: string // 视频文件名
  size: number // 文件大小（字节）
  lastModified: string // 最后修改时间
  url: string // 完整的下载URL
  displayName: string // 显示名称（去掉扩展名）
}

/**
 * 本地视频信息
 */
export interface LocalVideoInfo {
  key: string // 视频文件名
  path: string // 本地文件路径
  size: number // 文件大小
  downloadTime: string // 下载时间
  displayName: string // 显示名称
}

/**
 * 视频下载任务
 */
export interface VideoDownloadTask {
  id: string // 任务ID
  videoInfo: RemoteVideoInfo // 视频信息
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'
  progress: number // 下载进度 (0-100)
  downloadedBytes: number // 已下载字节数
  totalBytes: number // 总字节数
  speed: number // 下载速度 (bytes/s)
  error?: string // 错误信息
  startTime?: string // 开始时间
  endTime?: string // 结束时间
}

/**
 * 视频管理器配置
 */
export interface VideoManagerConfig {
  baseUrl: string // S3 基础URL
  downloadPath: string // 本地下载路径
  maxConcurrentDownloads: number // 最大并发下载数
  autoRetry: boolean // 是否自动重试
  retryCount: number // 重试次数
}

/**
 * 视频列表响应
 */
export interface VideoListResponse {
  success: boolean
  videos: RemoteVideoInfo[]
  error?: string
}

/**
 * 下载进度事件
 */
export interface DownloadProgressEvent {
  taskId: string
  progress: number
  downloadedBytes: number
  totalBytes: number
  speed: number
}

/**
 * 下载完成事件
 */
export interface DownloadCompleteEvent {
  taskId: string
  success: boolean
  localPath?: string
  error?: string
}