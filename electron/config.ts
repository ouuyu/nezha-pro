import type { CloudKnowledgeSource } from '../src/types/interfaces'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'

// User data path for configuration
const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config.json')

// Built-in default cloud knowledge sources (system-level, read-only)
const builtInCloudSources: CloudKnowledgeSource[] = [
  {
    id: 'builtin-gaokao',
    name: '高考古诗文',
    url: 'https://tvv.tw/https://raw.githubusercontent.com/ouuyu/gaokao-poetry/refs/heads/master/generated/divided.json',
    enabled: true,
    isBuiltIn: true,
  },
]

// Default configuration
const defaultConfig = {
  shutdownTimes: [],
  knowledgeBase: [],
  cloudKnowledgeSources: [] as any[],
  autoSyncEnabled: false,
  syncInterval: 60,
}

// Store sync times for built-in sources in memory
const builtInSourceSyncTimes = new Map<string, string>()

// Get built-in cloud sources with sync times from memory
export function getBuiltInCloudSources() {
  return builtInCloudSources.map(source => ({
    ...source,
    lastSyncTime: builtInSourceSyncTimes.get(source.id) || undefined,
  }))
}

// Update sync time for built-in source
export function updateBuiltInSourceSyncTime(sourceId: string, syncTime: string) {
  builtInSourceSyncTimes.set(sourceId, syncTime)
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
      if (!('cloudKnowledgeSources' in config)) {
        config.cloudKnowledgeSources = []
        changed = true
      }
      if (!('autoSyncEnabled' in config)) {
        config.autoSyncEnabled = false
        changed = true
      }
      if (!('syncInterval' in config)) {
        config.syncInterval = 60
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

// Get configuration with built-in sources merged
export function getConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    // Merge built-in cloud sources with user-defined sources
    const builtInSources = getBuiltInCloudSources()
    const userSources = config.cloudKnowledgeSources || []

    // Combine built-in sources with user sources, built-in sources come first
    config.cloudKnowledgeSources = [...builtInSources, ...userSources]

    return config
  }
  catch (error) {
    console.error('Error reading config file:', error)
    const configWithBuiltIn = { ...defaultConfig }
    configWithBuiltIn.cloudKnowledgeSources = getBuiltInCloudSources()
    return configWithBuiltIn
  }
}

// Save configuration (filters out built-in sources)
export function saveConfig(config: any) {
  try {
    // Create a copy of config to avoid modifying the original
    const configToSave = { ...config }

    // Filter out built-in sources before saving, only save user-defined sources
    if (configToSave.cloudKnowledgeSources) {
      configToSave.cloudKnowledgeSources = configToSave.cloudKnowledgeSources.filter(
        (source: any) => !source.isBuiltIn,
      )
    }

    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2))
    return true
  }
  catch (error) {
    console.error('Error saving config file:', error)
    return false
  }
}

// Get configuration file path
export function getConfigPath() {
  return configPath
}
