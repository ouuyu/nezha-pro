import type { BrowserWindow } from 'electron'
import { app, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

let win: BrowserWindow | null = null

// Function to set the window reference
export function setMainWindow(window: BrowserWindow | null) {
  win = window
}

export function setupUpdateHandlers() {
  // Configure autoUpdater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  // Configure update github repo
  autoUpdater.setFeedURL({
    provider: 'github',
    repo: 'ouuyu-tree',
    owner: 'nezha-pro-tree',
  })

  // Handle check for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()

      if (result?.updateInfo) {
        return {
          hasUpdate: true,
          currentVersion: app.getVersion(),
          latestVersion: result.updateInfo.version,
          releaseInfo: {
            tag_name: result.updateInfo.version,
            name: result.updateInfo.releaseName || result.updateInfo.version,
            html_url: '',
            assets: [],
          },
        }
      }
      else {
        return {
          hasUpdate: false,
          currentVersion: app.getVersion(),
          latestVersion: app.getVersion(),
        }
      }
    }
    catch (error: any) {
      console.error('Error checking for updates:', error)
      return {
        hasUpdate: false,
        error: error.message,
        currentVersion: app.getVersion(),
      }
    }
  })

  // Handle download and install update
  ipcMain.handle('download-and-install-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    }
    catch (error: any) {
      console.error('Error downloading update:', error)
      return { success: false, error: error.message }
    }
  })

  // Handle quit and install
  ipcMain.handle('quit-and-install', async () => {
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    }
    catch (error: any) {
      console.error('Error installing update:', error)
      return { success: false, error: error.message }
    }
  })

  // Auto-check for updates on app start (in production only)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
    }, 5000) // Check after 5 seconds
  }

  // Handle autoUpdater events
  autoUpdater.on('update-available', (info) => {
    if (win) {
      win.webContents.send('update-available', info)
    }
  })

  autoUpdater.on('update-not-available', () => {
    // No update available
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (win) {
      win.webContents.send('download-progress', progressObj)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (win) {
      win.webContents.send('update-downloaded', info)
    }
  })

  autoUpdater.on('error', (error) => {
    console.error('AutoUpdater error:', error)
    if (win) {
      win.webContents.send('update-error', error.message)
    }
  })
}
