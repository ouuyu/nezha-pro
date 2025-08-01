import type {
  BatchSyncResult,
  CloudKnowledgeItem,
  CloudKnowledgeSource,
  SyncResult,
  SyncSourceConfig,
} from '../src/types/interfaces'
import axios from 'axios'
import { getConfig, saveConfig, updateBuiltInSourceSyncTime } from './config'

function fetchFromUrl(url) {
  return axios.get(url, {
    timeout: 30000,
    responseType: 'text',
  })
    .then(response => response.data)
    .catch((error) => {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('请求超时')
      }

      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`)
      }

      throw new Error(`请求失败: ${error.message}`)
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

/**
 * 批量删除指定来源的云端数据
 */
export function deleteCloudDataBySource(sourceIds: string[]): SyncResult {
  try {
    const config = getConfig()
    const currentKnowledgeBase = config.knowledgeBase || []

    // 统计要删除的数量
    const toDeleteCount = currentKnowledgeBase.filter(
      (item: any) => item.dataSource === 'cloud' && sourceIds.includes(item.sourceId),
    ).length

    // 过滤掉指定来源的云端数据
    const filteredKnowledgeBase = currentKnowledgeBase.filter(
      (item: any) => !(item.dataSource === 'cloud' && sourceIds.includes(item.sourceId)),
    )

    config.knowledgeBase = filteredKnowledgeBase

    const saveResult = saveConfig(config)

    if (saveResult) {
      console.log(`Successfully deleted ${toDeleteCount} cloud items from sources: ${sourceIds.join(', ')}`)
      return {
        success: true,
        message: '删除成功',
        itemCount: toDeleteCount,
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
    console.error('Failed to delete cloud data by source:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
    }
  }
}

/**
 * 删除所有云端数据
 */
export function deleteAllCloudData(): SyncResult {
  try {
    const config = getConfig()
    const currentKnowledgeBase = config.knowledgeBase || []

    // 统计删除的数量
    const toDeleteCount = currentKnowledgeBase.filter(
      (item: any) => item.dataSource === 'cloud',
    ).length

    // 只保留本地数据
    const filteredKnowledgeBase = currentKnowledgeBase.filter(
      (item: any) => item.dataSource !== 'cloud',
    )

    config.knowledgeBase = filteredKnowledgeBase

    const saveResult = saveConfig(config)

    if (saveResult) {
      console.log(`Successfully deleted all ${toDeleteCount} cloud items`)
      return {
        success: true,
        message: '删除成功',
        itemCount: toDeleteCount,
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
    console.error('Failed to delete all cloud data:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
    }
  }
}
