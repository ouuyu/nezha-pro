// 统一导出所有类型定义
export * from './interfaces'

// 重新导出常用类型，方便使用
export type {
  // 应用配置相关
  AppConfig,
  // 背景配置相关
  BackgroundConfig,
  BatchSyncResult,
  CloudKnowledgeItem,
  // 云端知识源相关
  CloudKnowledgeSource,
  // 类型别名
  DataSourceType,

  DeepReadonly,

  DeveloperInfo,
  // 表单验证相关
  FormRule,

  FormRules,

  IpcOptions,
  // IPC 通信相关
  IpcResult,

  // 知识库相关
  KnowledgeItem,
  KnowledgeManagementEmits,

  // Vue 组件相关
  KnowledgeManagementProps,
  // 工具类型
  PartialBy,

  RequiredBy,
  // 关机统计相关
  ShutdownStats,
  // 定时关机相关
  ShutdownTime,

  SyncResult,
  SyncSourceConfig,
  TaskStatus,
} from './interfaces'

// 常量和类型重新导出
export { Weekday } from './interfaces'
export type { WeekdayType } from './interfaces'
