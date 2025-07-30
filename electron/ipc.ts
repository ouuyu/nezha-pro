import * as fs from 'node:fs'
import process from 'node:process'
import { app, ipcMain } from 'electron'
import { restartAutoSync } from './autoSync'
import { deleteAllCloudData, deleteCloudDataBySource, syncAllCloudSources, syncCloudKnowledgeSource } from './cloudSync'
import { getConfig, getConfigPath, saveConfig } from './config'
import { scheduleShutdowns } from './shutdown'

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
      } else {
        return {
          success: false,
          error: '配置文件不存在',
        }
      }
    } catch (error) {
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
    } catch (error) {
      console.error('Error saving raw config file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存配置文件失败',
      }
    }
  })
}
