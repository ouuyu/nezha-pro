import { syncAllCloudSources } from './cloudSync'
import { getConfig } from './config'

let syncTimer: NodeJS.Timeout | null = null
let restartTimer: NodeJS.Timeout | null = null

// 启动自动同步
export function startAutoSync() {
  stopAutoSync() // 先停止现有的定时器

  const config = getConfig()

  if (!config.autoSyncEnabled) {
    console.log('Auto sync has been disabled')
    return
  }

  const intervalMinutes = config.syncInterval || 60
  const intervalMs = intervalMinutes * 60 * 1000

  console.log(`Start auto sync, interval: ${intervalMinutes} min`)

  // 立即执行一次同步
  performAutoSync()

  // 设置定时器
  syncTimer = setInterval(() => {
    performAutoSync()
  }, intervalMs)
}

// 停止自动同步
export function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
}

// 执行自动同步
async function performAutoSync() {
  try {
    console.log('Start auto sync cloud knowledge source...')
    const result = await syncAllCloudSources()

    if (result.success) {
      const successCount = result.results.filter(r => r.result.success).length
      console.log(`Finish auto sync ${successCount}/${result.results.length}`)
    }
    else {
      console.log('Failed to sync: no enabled data source')
    }
  }
  catch (error) {
    console.error('Error when sync:', error)
  }
}

// 重新启动自动同步（配置更改时调用）
export function restartAutoSync() {
  // 清除之前的重启定时器
  if (restartTimer) {
    clearTimeout(restartTimer)
  }

  // 使用防抖机制，避免频繁重启
  restartTimer = setTimeout(() => {
    console.log('Restart auto sync service')
    startAutoSync()
    restartTimer = null
  }, 1000) // 1秒防抖
}
