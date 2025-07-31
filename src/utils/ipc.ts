import type { IpcOptions, IpcResult, LocalVideoInfo, RemoteVideoInfo, VideoDownloadTask } from '../types/interfaces'
import { ElMessage } from 'element-plus'

function deepClone<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  try {
    return JSON.parse(JSON.stringify(obj))
  }
  catch (error) {
    console.warn('Failed to clone object for IPC, using original:', error)
    return obj
  }
}

class IpcManager {
  private ipcRenderer: any = null

  private getIpcRenderer() {
    if (!this.ipcRenderer) {
      try {
        this.ipcRenderer = window.require('electron').ipcRenderer
      }
      catch (error) {
        console.error('Failed to get ipcRenderer:', error)
      }
    }
    return this.ipcRenderer
  }

  private showSuccessMessage(message: string) {
    ElMessage({
      message,
      type: 'success',
      duration: 1000,
    })
  }

  private showErrorMessage(message: string) {
    ElMessage.error(message)
  }

  async invoke<T = any>(
    channel: string,
    data?: any,
    options: IpcOptions = {},
  ): Promise<IpcResult<T>> {
    const {
      showSuccessMessage = false,
      showErrorMessage = true,
      successMessage = '操作成功',
      errorMessage = '操作失败',
      silent = false,
    } = options

    try {
      const ipcRenderer = this.getIpcRenderer()
      const clonedData = data ? deepClone(data) : data
      const result = await ipcRenderer.invoke(channel, clonedData)

      if (result === false) {
        const error = errorMessage
        if (showErrorMessage && !silent) {
          this.showErrorMessage(error)
        }
        return {
          success: false,
          error,
        }
      }

      if (showSuccessMessage && !silent) {
        this.showSuccessMessage(successMessage)
      }

      return {
        success: true,
        data: result,
      }
    }
    catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`IPC call failed [${channel}]:`, error)

      if (showErrorMessage && !silent) {
        this.showErrorMessage(errorMessage)
      }

      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  async getConfig<T = any>(options: IpcOptions = {}): Promise<IpcResult<T>> {
    return this.invoke<T>('get-config', undefined, {
      showErrorMessage: true,
      errorMessage: '加载配置失败',
      ...options,
    })
  }

  async saveConfig<T = any>(
    config: T,
    options: IpcOptions = {},
  ): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('save-config', { config, options }, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '设置已保存',
      errorMessage: '保存失败',
      ...options,
    })
  }

  async getDeveloperInfo<T = any>(options: IpcOptions = {}): Promise<IpcResult<T>> {
    return this.invoke<T>('get-developer-info', undefined, {
      showErrorMessage: true,
      errorMessage: '获取开发者信息失败',
      ...options,
    })
  }

  async getRawConfig(options: IpcOptions = {}): Promise<IpcResult<any>> {
    return this.invoke('get-raw-config', undefined, {
      showErrorMessage: true,
      errorMessage: '读取配置文件失败',
      ...options,
    })
  }

  async saveRawConfig(content: string, options: IpcOptions = {}): Promise<IpcResult<any>> {
    return this.invoke('save-raw-config', content, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '配置文件保存成功',
      errorMessage: '保存配置文件失败',
      ...options,
    })
  }

  async executeShutdown(options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('execute-shutdown', undefined, {
      showErrorMessage: true,
      errorMessage: '执行关机失败',
      ...options,
    })
  }

  async cancelShutdown(options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('cancel-shutdown', undefined, {
      showErrorMessage: true,
      errorMessage: '取消关机失败',
      ...options,
    })
  }

  async triggerShutdownWindow(options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('trigger-shutdown-window', undefined, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '关机倒计时窗口已唤起',
      errorMessage: '唤起关机倒计时窗口失败',
      ...options,
    })
  }

  // ==================== 视频管理相关方法 ====================

  async getLocalVideos(options: IpcOptions = {}): Promise<IpcResult<LocalVideoInfo[]>> {
    return this.invoke<LocalVideoInfo[]>('get-local-videos', undefined, {
      showErrorMessage: true,
      errorMessage: '获取本地视频失败',
      ...options,
    })
  }

  async startVideoDownload(videoInfo: RemoteVideoInfo, options: IpcOptions = {}): Promise<IpcResult<{ taskId: string }>> {
    return this.invoke<{ taskId: string }>('start-video-download', videoInfo, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '开始下载视频',
      errorMessage: '开始下载失败',
      ...options,
    })
  }

  async pauseVideoDownload(taskId: string, options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('pause-video-download', taskId, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '下载已暂停',
      errorMessage: '暂停下载失败',
      ...options,
    })
  }

  async cancelVideoDownload(taskId: string, options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('cancel-video-download', taskId, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '下载已取消',
      errorMessage: '取消下载失败',
      ...options,
    })
  }

  async deleteLocalVideo(videoKey: string, options: IpcOptions = {}): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('delete-local-video', videoKey, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '视频已删除',
      errorMessage: '删除视频失败',
      ...options,
    })
  }

  async getDownloadTasks(options: IpcOptions = {}): Promise<IpcResult<VideoDownloadTask[]>> {
    return this.invoke<VideoDownloadTask[]>('get-download-tasks', undefined, {
      showErrorMessage: true,
      errorMessage: '获取下载任务失败',
      ...options,
    })
  }
}

const ipcManager = new IpcManager()

export { ipcManager }
export default ipcManager

export const ipcInvoke = ipcManager.invoke.bind(ipcManager)
export const getConfig = ipcManager.getConfig.bind(ipcManager)
export const saveConfig = ipcManager.saveConfig.bind(ipcManager)
export const getDeveloperInfo = ipcManager.getDeveloperInfo.bind(ipcManager)
export const getRawConfig = ipcManager.getRawConfig.bind(ipcManager)
export const saveRawConfig = ipcManager.saveRawConfig.bind(ipcManager)
export const executeShutdown = ipcManager.executeShutdown.bind(ipcManager)
export const cancelShutdown = ipcManager.cancelShutdown.bind(ipcManager)
export const triggerShutdownWindow = ipcManager.triggerShutdownWindow.bind(ipcManager)

// 视频管理相关导出
export const getLocalVideos = ipcManager.getLocalVideos.bind(ipcManager)
export const startVideoDownload = ipcManager.startVideoDownload.bind(ipcManager)
export const pauseVideoDownload = ipcManager.pauseVideoDownload.bind(ipcManager)
export const cancelVideoDownload = ipcManager.cancelVideoDownload.bind(ipcManager)
export const deleteLocalVideo = ipcManager.deleteLocalVideo.bind(ipcManager)
export const getDownloadTasks = ipcManager.getDownloadTasks.bind(ipcManager)
