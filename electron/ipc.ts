import * as fs from 'node:fs'
import process from 'node:process'
import { app, ipcMain } from 'electron'
import { restartAutoSync } from './autoSync'
import { deleteAllCloudData, deleteCloudDataBySource, syncAllCloudSources, syncCloudKnowledgeSource } from './cloudSync'
import { getConfig, getConfigPath, saveConfig } from './config'
import { cancelShutdown, createShutdownWindow, executeSystemShutdown, scheduleShutdowns } from './shutdown'
import { videoManager } from './videoManager'

// Set up IPC handlers
export function setupIpcHandlers() {
  // Handler for getting configuration
  ipcMain.handle('get-config', () => {
    return getConfig()
  })

  // Handler for saving configuration
  ipcMain.handle('save-config', (_event, data: any) => {
    let options: any = {}

    const config = data.config
    options = data.options || {}

    const result = saveConfig(config)
    if (result) {
      scheduleShutdowns()
      if (!options.skipAutoSyncRestart) {
        restartAutoSync()
      }
    }
    return result
  })

  // Handler for getting developer information
  ipcMain.handle('get-developer-info', () => {
    return {
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
      appVersion: app.getVersion(),
      appName: app.getName(),
      configPath: getConfigPath(),
      userDataPath: app.getPath('userData'),
      appPath: app.getAppPath(),
    }
  })

  // Handler for syncing single cloud knowledge source
  ipcMain.handle('sync-cloud-knowledge', async (_event, sourceConfig) => {
    return await syncCloudKnowledgeSource(sourceConfig)
  })

  // Handler for syncing all cloud knowledge sources
  ipcMain.handle('sync-all-cloud-knowledge', async () => {
    return await syncAllCloudSources()
  })

  // Handler for deleting cloud data by source
  ipcMain.handle('delete-cloud-data-by-source', async (_event, sourceIds: string[]) => {
    return deleteCloudDataBySource(sourceIds)
  })

  // Handler for deleting all cloud data
  ipcMain.handle('delete-all-cloud-data', async () => {
    return deleteAllCloudData()
  })

  // Handler for getting raw config file content (for developer mode)
  ipcMain.handle('get-raw-config', () => {
    try {
      const configPath = getConfigPath()
      if (fs.existsSync(configPath)) {
        const rawContent = fs.readFileSync(configPath, 'utf8')
        return {
          success: true,
          content: rawContent,
          path: configPath,
        }
      }
      else {
        return {
          success: false,
          error: '配置文件不存在',
        }
      }
    }
    catch (error) {
      console.error('Error reading raw config file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '读取配置文件失败',
      }
    }
  })

  // Handler for saving raw config file content (for developer mode)
  ipcMain.handle('save-raw-config', (_event, content: string) => {
    try {
      // Validate JSON format
      JSON.parse(content)

      const configPath = getConfigPath()
      fs.writeFileSync(configPath, content, 'utf8')

      return {
        success: true,
        message: '配置文件保存成功',
      }
    }
    catch (error) {
      console.error('Error saving raw config file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存配置文件失败',
      }
    }
  })

  // Handler for executing system shutdown
  ipcMain.handle('execute-shutdown', () => {
    executeSystemShutdown()
    return { success: true }
  })

  // Handler for canceling shutdown
  ipcMain.handle('cancel-shutdown', () => {
    cancelShutdown()
    return { success: true }
  })

  // Handler for manually triggering shutdown confirmation window
  ipcMain.handle('trigger-shutdown-window', () => {
    createShutdownWindow()
    return { success: true }
  })

  // ==================== 视频管理相关处理器 ====================

  // Handler for getting local videos
  ipcMain.handle('get-local-videos', () => {
    try {
      const videos = videoManager.getLocalVideos()
      return {
        success: true,
        data: videos,
      }
    }
    catch (error) {
      console.error('Error getting local videos:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取本地视频失败',
      }
    }
  })

  // Handler for starting video download
  ipcMain.handle('start-video-download', async (_event, videoInfo) => {
    try {
      const result = await videoManager.startDownload(videoInfo)
      return result
    }
    catch (error) {
      console.error('Error starting video download:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '开始下载失败',
      }
    }
  })

  // Handler for pausing video download
  ipcMain.handle('pause-video-download', (_event, taskId: string) => {
    try {
      const success = videoManager.pauseDownload(taskId)
      return {
        success,
        message: success ? '下载已暂停' : '暂停失败',
      }
    }
    catch (error) {
      console.error('Error pausing video download:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '暂停下载失败',
      }
    }
  })

  // Handler for canceling video download
  ipcMain.handle('cancel-video-download', (_event, taskId: string) => {
    try {
      const success = videoManager.cancelDownload(taskId)
      return {
        success,
        message: success ? '下载已取消' : '取消失败',
      }
    }
    catch (error) {
      console.error('Error canceling video download:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消下载失败',
      }
    }
  })

  // Handler for deleting local video
  ipcMain.handle('delete-local-video', (_event, videoKey: string) => {
    try {
      const success = videoManager.deleteLocalVideo(videoKey)
      return {
        success,
        message: success ? '视频已删除' : '删除失败',
      }
    }
    catch (error) {
      console.error('Error deleting local video:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除视频失败',
      }
    }
  })

  // Handler for getting download tasks
  ipcMain.handle('get-download-tasks', () => {
    try {
      const tasks = videoManager.getDownloadTasks()
      return {
        success: true,
        data: tasks,
      }
    }
    catch (error) {
      console.error('Error getting download tasks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取下载任务失败',
      }
    }
  })
}
