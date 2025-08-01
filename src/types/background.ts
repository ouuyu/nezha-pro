// ==================== 背景配置相关接口 ====================

/**
 * 背景配置
 */
export interface BackgroundConfig {
  type: 'css'
  cssEffect?: 'aurora' | 'gradient' | 'particles' | 'waves' | 'matrix'
  colors: string[]
  opacity: number
  speed: number
}