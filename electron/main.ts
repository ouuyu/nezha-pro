import * as path from 'node:path'
import process from 'node:process'
/// <reference path="./electron-env.d.ts" />
import { app, BrowserWindow } from 'electron'
import { ensureConfigFile } from './config'
import { setupIpcHandlers } from './ipc'
import { scheduleShutdowns } from './shutdown'

process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: Electron.BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  })

  if (!win)
    return

  if (VITE_DEV_SERVER_URL && win) {
    win.loadURL(VITE_DEV_SERVER_URL)
  }
  else if (win) {
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

app.whenReady().then(() => {
  ensureConfigFile()

  createWindow()
  setupIpcHandlers()

  scheduleShutdowns()
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length === 0) {
    createWindow()
  }
})
