// src/ipc/index.ts
import { IpcBase } from './base'
import { ConfigIpc } from './config'
import { ShutdownIpc } from './shutdown'

const ipcBase = new IpcBase()
const configIpc = new ConfigIpc()
const shutdownIpc = new ShutdownIpc()

export {
  configIpc,
  ipcBase,
  shutdownIpc,
}

// 导出方法
export const getConfig = configIpc.getConfig.bind(configIpc)
export const saveConfig = configIpc.saveConfig.bind(configIpc)
export const getRawConfig = configIpc.getRawConfig.bind(configIpc)
export const saveRawConfig = configIpc.saveRawConfig.bind(configIpc)
export const getDeveloperInfo = configIpc.getDeveloperInfo.bind(configIpc)

export const executeShutdown = shutdownIpc.executeShutdown.bind(shutdownIpc)
export const cancelShutdown = shutdownIpc.cancelShutdown.bind(shutdownIpc)
export const triggerShutdownWindow = shutdownIpc.triggerShutdownWindow.bind(shutdownIpc)

