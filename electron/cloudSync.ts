import type {
  BatchSyncResult,
  CloudKnowledgeItem,
  CloudKnowledgeSource,
  SyncResult,
  SyncSourceConfig,
} from '../src/types/interfaces'
import * as http from 'node:http'
import * as https from 'node:https'
import { URL } from 'node:url'
import { getConfig, saveConfig, updateBuiltInSourceSyncTime } from './config'

function fetchFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url)
      const client = parsedUrl.protocol === 'https:' ? https : http

      const request = client.get(url, (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data)
          }
          else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
          }
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.setTimeout(30000, () => {
        request.destroy()
        reject(new Error('请求超时'))
      })
    }
    catch (error) {
      reject(error)
    }
  })
}

function parseCloudData(data: string): CloudKnowledgeItem[] {
  try {
    const jsonData = JSON.parse(data)

    if (Array.isArray(jsonData)) {
      return jsonData.filter(item =>
        item
        && typeof item.author === 'string'
        && typeof item.content === 'string',
      )
    }

    if (jsonData.knowledgeBase && Array.isArray(jsonData.knowledgeBase)) {
      return jsonData.knowledgeBase.filter((item: any) =>
        item
        && typeof item.author === 'string'
        && typeof item.content === 'string',
      )
    }

    return []
  }
  catch {
    return parseTextData(data)
  }
}

function parseTextData(data: string): CloudKnowledgeItem[] {
  const lines = data.split('\n').filter(line => line.trim())
  const items: CloudKnowledgeItem[] = []

  for (const line of lines) {
    const parts = line.split(',').map(part => part.trim())
    if (parts.length >= 3) {
      items.push({
        author: parts[0],
        source: parts[1] || '',
        content: parts.slice(2).join(','),
      })
    }
  }

  return items
}

export async function syncCloudKnowledgeSource(sourceConfig: SyncSourceConfig): Promise<SyncResult> {
  try {
    console.log(`Start sync cloud source: ${sourceConfig.name}`)

    const rawData = await fetchFromUrl(sourceConfig.url)
    const cloudItems = parseCloudData(rawData)

    if (cloudItems.length === 0) {
      return {
        success: false,
        message: '云端数据为空或格式不正确',
      }
    }

    const config = getConfig()
    const currentKnowledgeBase = config.knowledgeBase || []

    const filteredKnowledgeBase = currentKnowledgeBase.filter(
      (item: any) => item.sourceId !== sourceConfig.sourceId,
    )

    const newCloudItems = cloudItems.map(item => ({
      ...item,
      dataSource: 'cloud',
      sourceId: sourceConfig.sourceId,
      sourceName: sourceConfig.name,
      syncTime: new Date().toLocaleString(),
    }))

    config.knowledgeBase = [...filteredKnowledgeBase, ...newCloudItems]

    const syncTime = new Date().toLocaleString()
    if (config.cloudKnowledgeSources) {
      const sourceIndex = config.cloudKnowledgeSources.findIndex(
        (s: CloudKnowledgeSource) => s.id === sourceConfig.sourceId,
      )
      if (sourceIndex >= 0) {
        config.cloudKnowledgeSources[sourceIndex].lastSyncTime = syncTime

        if (config.cloudKnowledgeSources[sourceIndex].isBuiltIn) {
          updateBuiltInSourceSyncTime(sourceConfig.sourceId, syncTime)
        }
      }
    }

    const saveResult = saveConfig(config)

    if (saveResult) {
      console.log(`Successfully synced ${cloudItems.length} items from ${sourceConfig.name}`)
      return {
        success: true,
        message: '同步成功',
        itemCount: cloudItems.length,
      }
    }
    else {
      return {
        success: false,
        message: '保存配置失败',
      }
    }
  }
  catch (error) {
    console.error(`Failed to sync cloud knowledge source (${sourceConfig.name}):`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
    }
  }
}

export async function syncAllCloudSources(): Promise<BatchSyncResult> {
  const config = getConfig()
  const cloudSources = config.cloudKnowledgeSources || []
  const enabledSources = cloudSources.filter((source: CloudKnowledgeSource) => source.enabled)

  if (enabledSources.length === 0) {
    return {
      success: false,
      results: [],
      totalCount: 0,
    }
  }

  const results: Array<{ sourceId: string, sourceName: string, result: SyncResult }> = []
  let overallSuccess = false
  let totalCount = 0

  for (const source of enabledSources) {
    const result = await syncCloudKnowledgeSource({
      sourceId: source.id,
      url: source.url,
      name: source.name,
    })

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      result,
    })

    totalCount += result.itemCount || 0

    if (result.success) {
      overallSuccess = true
    }
  }

  return {
    success: overallSuccess,
    results,
    totalCount,
  }
}
