// 统一的前后端接口定义文件

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

// ==================== IPC 通信相关接口 ====================

/**
 * IPC 调用结果
 */
export interface IpcResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * IPC 调用选项
 */
export interface IpcOptions {
  showSuccessMessage?: boolean
  showErrorMessage?: boolean
  successMessage?: string
  errorMessage?: string
  silent?: boolean
  skipAutoSyncRestart?: boolean
}

// ==================== 定时关机相关接口 ====================

/**
 * 定时关机配置
 */
export interface ShutdownTime {
  time: string
  weekdays: number[]
  active: boolean
}

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

// ==================== 背景配置相关接口 ====================

/**
 * 背景配置
 */
export interface BackgroundConfig {
  type: 'css' | 'video' | 'weather' | 'image'
  cssEffect?: 'aurora' | 'gradient' | 'particles' | 'waves' | 'matrix'
  videoUrl?: string
  imageUrl?: string
  weatherLocation?: string
  opacity?: number
  speed?: number
  colors?: string[]
}

/**
 * 关机统计信息
 */
export interface ShutdownStats {
  totalScheduled: number
  totalCanceled: number
  lastShutdown: string
}

// ==================== 应用配置相关接口 ====================

/**
 * 应用主配置
 */
export interface AppConfig {
  shutdownTimes: ShutdownTime[]
  knowledgeBase: KnowledgeItem[]
  cloudKnowledgeSources: CloudKnowledgeSource[]
  autoSyncEnabled: boolean
  syncInterval: number
  shutdownBackground?: BackgroundConfig
  shutdownStats?: ShutdownStats
}

/**
 * 开发者信息
 */
export interface DeveloperInfo {
  electronVersion: string
  nodeVersion: string
  chromeVersion: string
  platform: string
  arch: string
  appVersion: string
  appName: string
  configPath: string
  userDataPath: string
  appPath: string
}

// ==================== 表单验证相关接口 ====================

/**
 * 表单验证规则
 */
export interface FormRule {
  required?: boolean
  message: string
  trigger: string
  min?: number
  max?: number
  type?: string
}

/**
 * 表单验证规则集合
 */
export interface FormRules {
  [key: string]: FormRule[]
}

// ==================== 云同步源配置接口 ====================

/**
 * 同步源配置参数
 */
export interface SyncSourceConfig {
  sourceId: string
  url: string
  name: string
}

// ==================== 类型别名 ====================

/**
 * 数据源类型
 */
export type DataSourceType = 'local' | 'cloud'

/**
 * 任务状态类型
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * 星期常量
 */
export const Weekday = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const

/**
 * 星期类型
 */
export type WeekdayType = typeof Weekday[keyof typeof Weekday]

// ==================== 工具类型 ====================

/**
 * 使某些属性可选
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 使某些属性必需
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
