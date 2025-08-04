import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as https from 'node:https'
import * as path from 'node:path'
import { app, ipcMain } from 'electron'

// GitHub releases API URL
const RELEASES_API_URL = 'https://api.github.com/repos/ouuyu/nezha-pro/releases/latest'
const USER_AGENT = 'Nezha-App'

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
  // Handler for checking updates
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

  // Handler for downloading and installing update
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

function getLatestRelease(): Promise<ReleaseInfo> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }

    https.get(RELEASES_API_URL, options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const releaseInfo: ReleaseInfo = JSON.parse(data)
          resolve(releaseInfo)
        }
        catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
  // Remove 'v' prefix if present
  const latest = latestVersion.replace(/^v/, '')
  const current = currentVersion.replace(/^v/, '')

  // Split version numbers
  const latestParts = latest.split('.').map(Number)
  const currentParts = current.split('.').map(Number)

  // Compare version parts
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

function downloadAndInstallUpdate(downloadUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create temp directory for download
    const tempDir = app.getPath('temp')
    const fileName = path.basename(downloadUrl)
    const filePath = path.join(tempDir, fileName)

    const file = fs.createWriteStream(filePath)

    https.get(downloadUrl, (res) => {
      res.pipe(file)

      file.on('finish', () => {
        file.close()

        // Execute the installer silently
        exec(`"${filePath}" /S`, (error) => {
          if (error) {
            reject(error)
          }
          else {
            resolve()
          }
        })
      })

      file.on('error', (error) => {
        fs.unlink(filePath, () => {}) // Delete temp file
        reject(error)
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}
