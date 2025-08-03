import { exec } from 'node:child_process'
import process from 'node:process'
import { BrowserWindow } from 'electron'
import { getConfig } from './config'

// Store shutdown timers
let shutdownTimers: NodeJS.Timeout[] = []
let shutdownWindow: BrowserWindow | null = null
export function scheduleShutdowns() {
  // Clear existing timers
  shutdownTimers.forEach(timer => clearTimeout(timer))
  shutdownTimers = []

  const config = getConfig()
  if (!config.shutdownTimes || !config.shutdownTimes.length)
    return

  const now = new Date()

  config.shutdownTimes.forEach((shutdownTime: any) => {
    if (!shutdownTime.time || !shutdownTime.weekdays || !shutdownTime.weekdays.length)
      return

    const [hours, minutes, seconds] = shutdownTime.time.split(':').map(Number)

    // Schedule for each selected weekday
    shutdownTime.weekdays.forEach((weekday: number) => {
      const targetDate = new Date()

      // Set time
      targetDate.setHours(hours, minutes, seconds, 0)

      // Adjust day to next occurrence of the weekday
      const currentDay = now.getDay()
      let daysToAdd = weekday - currentDay

      if (daysToAdd < 0) {
        daysToAdd += 7
      }
      else if (daysToAdd === 0 && now > targetDate) {
        daysToAdd = 7
      }

      targetDate.setDate(targetDate.getDate() + daysToAdd)

      // Calculate timeout
      const timeUntilShutdown = targetDate.getTime() - now.getTime()

      if (timeUntilShutdown > 0) {
        const timer = setTimeout(() => {
          executeShutdown()
        }, timeUntilShutdown)

        shutdownTimers.push(timer)
      }
    })
  })
}

// Create shutdown confirmation window
export function createShutdownWindow() {
  if (shutdownWindow) {
    shutdownWindow.focus()
    return shutdownWindow
  }

  shutdownWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  })

  // 设置窗口背景和透明度
  shutdownWindow.setBackgroundColor('#00000000')
  shutdownWindow.setOpacity(1.0)

  // 启用硬件加速
  shutdownWindow.setBackgroundColor('#00000000')

  // 加载关机确认页面
  const isDev = process.env.VITE_DEV_SERVER_URL
  if (isDev) {
    shutdownWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/shutdown-confirm`)
  }
  else {
    shutdownWindow.loadFile('dist/index.html', { hash: 'shutdown-confirm' })
  }

  // 窗口关闭时清理
  shutdownWindow.on('closed', () => {
    shutdownWindow = null
  })

  return shutdownWindow
}

// Close shutdown window
export function closeShutdownWindow() {
  if (shutdownWindow) {
    // 添加窗口关闭动画
    shutdownWindow.hide()
    shutdownWindow.removeAllListeners('close')
    shutdownWindow.close()
    shutdownWindow = null
  }
}

// Execute the shutdown command
export function executeShutdown() {
  createShutdownWindow()
}

// Execute system shutdown
export function executeSystemShutdown() {
  closeShutdownWindow()

  const platform = process.platform
  let command = ''

  if (platform === 'win32') {
    command = 'shutdown /s /t 0'
  }
  else if (platform === 'darwin') {
    command = 'sudo shutdown -h now'
  }
  else if (platform === 'linux') {
    command = 'shutdown -h now'
  }

  if (command) {
    exec(command, (error) => {
      if (error) {
        console.error('Shutdown command failed:', error)
      }
    })
  }
}

// Cancel shutdown
export function cancelShutdown() {
  closeShutdownWindow()
}
