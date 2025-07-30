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
}
