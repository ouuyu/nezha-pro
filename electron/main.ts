/// <reference path="./electron-env.d.ts" />
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { ensureConfigFile } from './config'
import { scheduleShutdowns } from './shutdown'
import { setupIpcHandlers } from './ipc'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ └─┬ preload
// │   └── index.js
// ├─┬ dist
// │ └── index.html

process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: Electron.BrowserWindow | null = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  if (!win) return

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    if (win) {
      win.webContents.send('main-process-message', new Date().toLocaleString())
    }
  })

  if (VITE_DEV_SERVER_URL && win) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else if (win) {
    // Make sure dist directory exists
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// Initialize app when ready
app.whenReady().then(() => {
  // Ensure config file exists
  ensureConfigFile()

  // Create the main window
  createWindow()

  // Set up IPC handlers
  setupIpcHandlers()

  // Schedule shutdowns on startup
  scheduleShutdowns()
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length === 0) {
    createWindow()
  }
})
