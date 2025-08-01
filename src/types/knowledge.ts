// ==================== 知识库相关接口 ====================

/**
 * 知识库项目
 */
export interface KnowledgeItem {
  author: string
  source: string
  content: string
  createTime?: string
  updateTime?: string
  dataSource?: 'local' | 'cloud'
  sourceId?: string | null
  sourceName?: string
}