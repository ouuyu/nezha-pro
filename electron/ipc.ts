import { ipcMain } from 'electron'
import { getConfig, saveConfig } from './config'
import { scheduleShutdowns } from './shutdown'

// Set up IPC handlers
export function setupIpcHandlers() {
  // Handler for getting configuration
  ipcMain.handle('get-config', () => {
    return getConfig()
  })

  // Handler for saving configuration
  ipcMain.handle('save-config', (event, config) => {
    const result = saveConfig(config)
    if (result) {
      scheduleShutdowns()
    }
    return result
  })
}
