import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'

// User data path for configuration
const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config.json')

// Default configuration
const defaultConfig = {
  shutdownTimes: [],
  knowledgeBase: [],
}

// Ensure config file exists
export function ensureConfigFile() {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }
  else {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      let changed = false
      if (!('shutdownTimes' in config)) {
        config.shutdownTimes = []
        changed = true
      }
      if (!('knowledgeBase' in config)) {
        config.knowledgeBase = []
        changed = true
      }
      if (changed) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      }
    }
    catch {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    }
  }
}

// Get configuration
export function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  }
  catch (error) {
    console.error('Error reading config file:', error)
    return defaultConfig
  }
}

// Save configuration
export function saveConfig(config: any) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  }
  catch (error) {
    console.error('Error saving config file:', error)
    return false
  }
}
