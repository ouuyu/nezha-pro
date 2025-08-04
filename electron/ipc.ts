import process from 'node:process'
import { app, ipcMain } from 'electron'
import { restartAutoSync } from './autoSync'
import { deleteAllCloudData, deleteCloudDataBySource, syncAllCloudSources, syncCloudKnowledgeSource } from './cloudSync'
import { getConfig, getConfigPath, saveConfig } from './config'
import { cancelShutdown, createShutdownWindow, executeSystemShutdown, scheduleShutdowns } from './shutdown'
import { setupUpdateHandlers } from './update'

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

  // Handler for syncing all cloud sources
  ipcMain.handle('sync-all-cloud-sources', async () => {
    return await syncAllCloudSources()
  })

  // Handler for deleting cloud data by source
  ipcMain.handle('delete-cloud-data-by-source', async (_event, sourceName: string[]) => {
    return await deleteCloudDataBySource(sourceName)
  })

  // Handler for deleting all cloud data
  ipcMain.handle('delete-all-cloud-data', async () => {
    return await deleteAllCloudData()
  })

  // Handler for getting config path
  ipcMain.handle('get-config-path', () => {
    return getConfigPath()
  })

  // Handler for scheduling shutdowns
  ipcMain.handle('schedule-shutdowns', () => {
    return scheduleShutdowns()
  })

  // Handler for creating shutdown window
  ipcMain.handle('create-shutdown-window', async (_event) => {
    return await createShutdownWindow()
  })

  // Handler for executing system shutdown
  ipcMain.handle('execute-system-shutdown', () => {
    return executeSystemShutdown()
  })

  // Handler for cancelling shutdown
  ipcMain.handle('cancel-shutdown', () => {
    return cancelShutdown()
  })

  // Setup update handlers
  setupUpdateHandlers()
}
