import type { ShutdownStats } from '../types'
import { getConfig, saveConfig } from './ipc'

/**
 * 更新关机统计信息
 */
export async function updateShutdownStats(type: 'scheduled' | 'canceled' | 'executed'): Promise<boolean> {
  try {
    const result = await getConfig({ silent: true })
    if (!result.success) {
      console.error('Failed to load config for stats update')
      return false
    }

    const config = result.data || {}
    const currentStats: ShutdownStats = config.shutdownStats || {
      totalScheduled: 0,
      totalCanceled: 0,
      lastShutdown: '从未',
    }

    // 更新统计数据
    switch (type) {
      case 'scheduled':
        currentStats.totalScheduled++
        break
      case 'canceled':
        currentStats.totalCanceled++
        break
      case 'executed':
        currentStats.lastShutdown = new Date().toLocaleString('zh-CN')
        break
    }

    // 保存更新后的配置
    const newConfig = {
      ...config,
      shutdownStats: currentStats,
    }

    const saveResult = await saveConfig(newConfig, { silent: true })
    return saveResult.success
  }
  catch (error) {
    console.error('Failed to update shutdown stats:', error)
    return false
  }
}

/**
 * 获取关机统计信息
 */
export async function getShutdownStats(): Promise<ShutdownStats | null> {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data?.shutdownStats) {
      return result.data.shutdownStats
    }
    return {
      totalScheduled: 0,
      totalCanceled: 0,
      lastShutdown: '从未',
    }
  }
  catch (error) {
    console.error('Failed to get shutdown stats:', error)
    return null
  }
}

/**
 * 重置关机统计信息
 */
export async function resetShutdownStats(): Promise<boolean> {
  try {
    const result = await getConfig({ silent: true })
    if (!result.success) {
      return false
    }

    const config = result.data || {}
    const newConfig = {
      ...config,
      shutdownStats: {
        totalScheduled: 0,
        totalCanceled: 0,
        lastShutdown: '从未',
      },
    }

    const saveResult = await saveConfig(newConfig, { silent: true })
    return saveResult.success
  }
  catch (error) {
    console.error('Failed to reset shutdown stats:', error)
    return false
  }
}
