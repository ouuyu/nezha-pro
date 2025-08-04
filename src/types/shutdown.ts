// ==================== 定时关机相关接口 ====================

/**
 * 定时关机配置
 */
export interface ShutdownTime {
  time: string
  weekdays: number[]
  active: boolean
}

/**
 * 关机统计信息
 */
export interface ShutdownStats {
  totalScheduled: number
  totalCanceled: number
  lastShutdown: string
}
