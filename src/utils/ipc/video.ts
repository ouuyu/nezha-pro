import type {
  IpcOptions,
  IpcResult,
  LocalVideoInfo,
  RemoteVideoInfo,
  VideoDownloadTask,
} from '../../types/interfaces'
// src/ipc/video-ipc.ts
import { IpcBase } from './base'

export class VideoIpc extends IpcBase {
  async getLocalVideos(options: IpcOptions = {}): Promise<IpcResult<LocalVideoInfo[]>> {
    return this.invoke<LocalVideoInfo[]>('get-local-videos', undefined, {
      showErrorMessage: true,
      errorMessage: '获取本地视频失败',
      ...options,
    })
  }

  async startVideoDownload(
    videoInfo: RemoteVideoInfo,
    options: IpcOptions = {},
  ): Promise<IpcResult<{ taskId: string }>> {
    return this.invoke<{ taskId: string }>('start-video-download', videoInfo, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '开始下载视频',
      errorMessage: '开始下载失败',
      ...options,
    })
  }

  async pauseVideoDownload(
    taskId: string,
    options: IpcOptions = {},
  ): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('pause-video-download', taskId, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '下载已暂停',
      errorMessage: '暂停下载失败',
      ...options,
    })
  }

  async cancelVideoDownload(
    taskId: string,
    options: IpcOptions = {},
  ): Promise<IpcResult<boolean>> {
    return this.invoke<boolean>('cancel-video-download', taskId, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '下载已取消',
      errorMessage: '取消下载失败',
      ...options,
    })
  }

  async deleteLocalVideo(
    videoKey: string,
    options: IpcOptions = {},
  ): Promise<IpcResult<boolean>> {
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
