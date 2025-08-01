import type { BackgroundConfig } from './background'
import type { CloudKnowledgeSource } from './cloud-knowledge'
import type { KnowledgeItem } from './knowledge'
import type { ShutdownStats, ShutdownTime } from './shutdown'

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
