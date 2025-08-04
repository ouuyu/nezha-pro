// ==================== 云端知识源相关接口 ====================

/**
 * 云端知识源配置
 */
export interface CloudKnowledgeSource {
  id: string
  name: string
  url: string
  enabled: boolean
  lastSyncTime?: string
  isBuiltIn?: boolean
  description?: string
}

/**
 * 云端知识项
 */
export interface CloudKnowledgeItem {
  author: string
  source: string
  content: string
  createTime?: string
  updateTime?: string
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean
  message: string
  itemCount?: number
}

/**
 * 批量同步结果
 */
export interface BatchSyncResult {
  success: boolean
  results: Array<{
    sourceId: string
    sourceName: string
    result: SyncResult
  }>
  totalCount: number
}
