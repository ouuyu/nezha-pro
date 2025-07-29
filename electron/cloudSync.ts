import * as http from 'node:http'
import * as https from 'node:https'
import { URL } from 'node:url'
import { getConfig, saveConfig } from './config'

export interface CloudKnowledgeSource {
  id: string
  name: string
  url: string
  enabled: boolean
  lastSyncTime?: string
}

export interface CloudKnowledgeItem {
  author: string
  source: string
  content: string
  createTime?: string
  updateTime?: string
}

export interface SyncResult {
  success: boolean
  message: string
  itemCount?: number
}

// 从URL获取数据
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

// 解析云端知识库数据
function parseCloudData(data: string): CloudKnowledgeItem[] {
  try {
    // 尝试解析JSON格式
    const jsonData = JSON.parse(data)

    if (Array.isArray(jsonData)) {
      return jsonData.filter(item =>
        item
        && typeof item.author === 'string'
        && typeof item.content === 'string',
      )
    }

    if (jsonData.knowledgeBase && Array.isArray(jsonData.knowledgeBase)) {
      return jsonData.knowledgeBase.filter(item =>
        item
        && typeof item.author === 'string'
        && typeof item.content === 'string',
      )
    }

    return []
  }
  catch {
    // 如果不是JSON，尝试解析其他格式（如CSV、纯文本等）
    return parseTextData(data)
  }
}

// 解析文本格式的数据
function parseTextData(data: string): CloudKnowledgeItem[] {
  const lines = data.split('\n').filter(line => line.trim())
  const items: CloudKnowledgeItem[] = []

  // 简单的CSV格式解析：author,source,content
  for (const line of lines) {
    const parts = line.split(',').map(part => part.trim())
    if (parts.length >= 3) {
      items.push({
        author: parts[0],
        source: parts[1] || '',
        content: parts.slice(2).join(','), // 内容可能包含逗号
      })
    }
  }

  return items
}

// 同步单个云端数据源
export async function syncCloudKnowledgeSource(sourceConfig: {
  sourceId: string
  url: string
  name: string
}): Promise<SyncResult> {
  try {
    console.log(`Start sync cloud source: ${sourceConfig.name}`)

    // 获取云端数据
    const rawData = await fetchFromUrl(sourceConfig.url)
    const cloudItems = parseCloudData(rawData)

    if (cloudItems.length === 0) {
      return {
        success: false,
        message: '云端数据为空或格式不正确',
      }
    }

    // 获取当前配置
    const config = getConfig()
    const currentKnowledgeBase = config.knowledgeBase || []

    // 移除来自该数据源的旧数据
    const filteredKnowledgeBase = currentKnowledgeBase.filter(
      (item: any) => item.sourceId !== sourceConfig.sourceId,
    )

    // 添加新的云端数据
    const newCloudItems = cloudItems.map(item => ({
      ...item,
      dataSource: 'cloud',
      sourceId: sourceConfig.sourceId,
      sourceName: sourceConfig.name,
      syncTime: new Date().toLocaleString(),
    }))

    // 更新配置
    config.knowledgeBase = [...filteredKnowledgeBase, ...newCloudItems]

    // 更新数据源的最后同步时间
    if (config.cloudKnowledgeSources) {
      const sourceIndex = config.cloudKnowledgeSources.findIndex(
        (s: CloudKnowledgeSource) => s.id === sourceConfig.sourceId,
      )
      if (sourceIndex >= 0) {
        config.cloudKnowledgeSources[sourceIndex].lastSyncTime = new Date().toLocaleString()
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

// 同步所有启用的云端数据源
export async function syncAllCloudSources(): Promise<{
  success: boolean
  results: Array<{ sourceId: string, sourceName: string, result: SyncResult }>
}> {
  const config = getConfig()
  const cloudSources = config.cloudKnowledgeSources || []
  const enabledSources = cloudSources.filter((source: CloudKnowledgeSource) => source.enabled)

  if (enabledSources.length === 0) {
    return {
      success: false,
      results: [],
    }
  }

  const results: Array<{ sourceId: string, sourceName: string, result: SyncResult }> = []
  let overallSuccess = false

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

    if (result.success) {
      overallSuccess = true
    }
  }

  return {
    success: overallSuccess,
    results,
  }
}
