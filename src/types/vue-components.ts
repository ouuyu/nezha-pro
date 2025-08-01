// ==================== Vue 组件相关接口 ====================

/**
 * 知识管理组件 Props
 */
export interface KnowledgeManagementProps {
  syncLoading: boolean
  lastSyncTime: string
}

/**
 * 知识管理组件 Emits
 */
export interface KnowledgeManagementEmits {
  (e: 'syncFromCloud'): void
}

/**
 * 批量删除选项
 */
export interface BatchDeleteOptions {
  deleteType: 'bySource' | 'all'
  sourceIds?: string[]
}

/**
 * 批量删除结果
 */
export interface BatchDeleteResult {
  success: boolean
  message: string
  deletedCount: number
}