// src/ipc/index.ts
import { IpcBase } from './base'
import { ConfigIpc } from './config'
import { ShutdownIpc } from './shutdown'
import { VideoIpc } from './video'

const ipcBase = new IpcBase()
const configIpc = new ConfigIpc()
const shutdownIpc = new ShutdownIpc()
const videoIpc = new VideoIpc()

export {
  configIpc,
  ipcBase,
  shutdownIpc,
  videoIpc,
}

// 导出方法
export const getConfig = configIpc.getConfig.bind(configIpc)
export const saveConfig = configIpc.saveConfig.bind(configIpc)
export const getRawConfig = configIpc.getRawConfig.bind(configIpc)
export const saveRawConfig = configIpc.saveRawConfig.bind(configIpc)

export const executeShutdown = shutdownIpc.executeShutdown.bind(shutdownIpc)
export const cancelShutdown = shutdownIpc.cancelShutdown.bind(shutdownIpc)
export const triggerShutdownWindow = shutdownIpc.triggerShutdownWindow.bind(shutdownIpc)

export const getLocalVideos = videoIpc.getLocalVideos.bind(videoIpc)
export const startVideoDownload = videoIpc.startVideoDownload.bind(videoIpc)
export const pauseVideoDownload = videoIpc.pauseVideoDownload.bind(videoIpc)
export const cancelVideoDownload = videoIpc.cancelVideoDownload.bind(videoIpc)
export const deleteLocalVideo = videoIpc.deleteLocalVideo.bind(videoIpc)
export const getDownloadTasks = videoIpc.getDownloadTasks.bind(videoIpc)
