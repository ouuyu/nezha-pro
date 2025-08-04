import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import axios from 'axios'
import { app, ipcMain } from 'electron'

// GitHub releases API URL
const RELEASES_API_URL = 'https://api.github.com/repos/ouuyu/nezha-pro/releases/latest'

export interface ReleaseInfo {
  tag_name: string
  name: string
  html_url: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

export function setupUpdateHandlers() {
  ipcMain.handle('check-for-updates', async () => {
    try {
      const latestRelease = await getLatestRelease()
      const currentVersion = app.getVersion()

      if (isNewerVersion(latestRelease.tag_name, `v${currentVersion}`)) {
        return {
          hasUpdate: true,
          currentVersion,
          latestVersion: latestRelease.tag_name,
          releaseInfo: latestRelease,
        }
      }
      else {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: latestRelease.tag_name,
        }
      }
    }
    catch (error) {
      console.error('Error checking for updates:', error)
      return {
        hasUpdate: false,
        error: error.message,
      }
    }
  })

  ipcMain.handle('download-and-install-update', async (_event, downloadUrl: string) => {
    try {
      await downloadAndInstallUpdate(downloadUrl)
      return { success: true }
    }
    catch (error) {
      console.error('Error downloading/installing update:', error)
      return { success: false, error: error.message }
    }
  })
}

async function getLatestRelease(): Promise<ReleaseInfo> {
  const { data } = await axios.get<ReleaseInfo>(RELEASES_API_URL, {
    headers: {
      'User-Agent': 'Nezha-App',
    },
  })
  return data
}

function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
  const latest = latestVersion.replace(/^v/, '')
  const current = currentVersion.replace(/^v/, '')

  const latestParts = latest.split('.').map(Number)
  const currentParts = current.split('.').map(Number)

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latestNum = latestParts[i] || 0
    const currentNum = currentParts[i] || 0

    if (latestNum > currentNum) {
      return true
    }
    else if (latestNum < currentNum) {
      return false
    }
  }

  return false
}

async function downloadAndInstallUpdate(downloadUrl: string): Promise<void> {
  const tempDir = app.getPath('temp')
  const fileName = path.basename(downloadUrl)
  const filePath = path.join(tempDir, fileName)

  const writer = fs.createWriteStream(filePath)
  const response = await axios({
    url: downloadUrl,
    method: 'GET',
    responseType: 'stream',
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      exec(`"${filePath}" /S`, (error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve()
        }
      })
    })

    writer.on('error', (error) => {
      fs.unlink(filePath, () => {})
      reject(error)
    })
  })
}
