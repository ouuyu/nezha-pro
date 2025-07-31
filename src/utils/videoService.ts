import type { RemoteVideoInfo, VideoListResponse } from '../types/interfaces'

/**
 * 视频服务类 - 处理远程视频列表获取和解析
 */
export class VideoService {
  private baseUrl: string

  constructor(baseUrl: string = 'https://r2.wordcarve.com/live') {
    this.baseUrl = baseUrl
  }

  /**
   * 获取远程视频列表
   */
  async getVideoList(): Promise<VideoListResponse> {
    try {
      const response = await fetch(this.baseUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const xmlText = await response.text()
      const videos = this.parseS3XmlResponse(xmlText)

      return {
        success: true,
        videos,
      }
    }
    catch (error) {
      console.error('Failed to fetch video list:', error)
      return {
        success: false,
        videos: [],
        error: error instanceof Error ? error.message : '获取视频列表失败',
      }
    }
  }

  /**
   * 解析S3 XML响应
   */
  private parseS3XmlResponse(xmlText: string): RemoteVideoInfo[] {
    try {
      console.log('开始解析XML响应，长度:', xmlText.length)
      console.log('XML前500字符:', xmlText.substring(0, 500))

      // 创建DOM解析器
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      // 检查解析错误
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) {
        console.error('XML解析错误:', parseError.textContent)
        throw new Error('XML解析失败')
      }

      // 获取所有Contents节点
      const contents = xmlDoc.querySelectorAll('Contents')
      console.log('找到Contents元素数量:', contents.length)

      const videos: RemoteVideoInfo[] = []

      contents.forEach((content, _) => {
        const key = content.querySelector('Key')?.textContent
        const size = content.querySelector('Size')?.textContent
        const lastModified = content.querySelector('LastModified')?.textContent

        // 只处理视频文件
        if (key && this.isVideoFile(key)) {
          const videoInfo: RemoteVideoInfo = {
            key,
            size: size ? Number.parseInt(size, 10) : 0,
            lastModified: lastModified || '',
            url: `${this.baseUrl}/${key}`,
            displayName: this.getDisplayName(key),
          }
          videos.push(videoInfo)
          console.log('添加视频文件:', videoInfo)
        }
        else {
          console.log('跳过非视频文件:', key)
        }
      })

      console.log('解析完成，总共找到视频文件:', videos.length)
      return videos.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }
    catch (error) {
      console.error('Failed to parse S3 XML response:', error)
      return []
    }
  }

  /**
   * 检查是否为视频文件
   */
  private isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    return videoExtensions.includes(extension)
  }

  /**
   * 获取显示名称（去掉扩展名并格式化）
   */
  private getDisplayName(filename: string): string {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    // 将连字符和下划线替换为空格，并进行首字母大写
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0)
      return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  /**
   * 格式化时间
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    catch {
      return dateString
    }
  }

  /**
   * 获取视频缩略图URL（如果支持）
   */
  getThumbnailUrl(videoKey: string): string {
    // 这里可以根据实际情况实现缩略图逻辑
    // 目前返回一个占位符
    return `${this.baseUrl}/${videoKey}#t=1`
  }
}

// 创建默认实例
export const videoService = new VideoService()
