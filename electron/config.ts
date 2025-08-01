import type { CloudKnowledgeSource } from '../src/types/interfaces'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'

const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config.json')

const builtInCloudSources: CloudKnowledgeSource[] = [
  {
    id: 'builtin-gaokao',
    name: '高考古诗文',
    url: 'https://cdn.jsdelivr.net/gh/ouuyu/gaokao-poetry/generated/divided.json',
    enabled: true,
    isBuiltIn: true,
  },
]

const defaultConfig = {
  shutdownTimes: [],
  autoSyncEnabled: false,
  syncInterval: 60,
  shutdownBackground: {
    type: 'css',
    cssEffect: 'aurora',
    opacity: 0.8,
    speed: 1,
    colors: ['#7877c6', '#4f46e5', '#06b6d4'],
  },
  cloudKnowledgeSources: [] as any[],
  knowledgeBase: [],
}

const builtInSourceSyncTimes = new Map<string, string>()

export function getBuiltInCloudSources() {
  return builtInCloudSources.map(source => ({
    ...source,
    lastSyncTime: builtInSourceSyncTimes.get(source.id) || undefined,
  }))
}

export function updateBuiltInSourceSyncTime(sourceId: string, syncTime: string) {
  builtInSourceSyncTimes.set(sourceId, syncTime)
}

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
      if (!('shutdownBackground' in config)) {
        config.shutdownBackground = defaultConfig.shutdownBackground
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

export function getConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    const builtInSources = getBuiltInCloudSources()
    const userSources = config.cloudKnowledgeSources || []

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

export function saveConfig(config: any) {
  try {
    const configToSave = { ...config }

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

export function getConfigPath() {
  return configPath
}
