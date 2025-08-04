import type { IpcOptions, IpcResult } from '../../types'
// src/ipc/shutdown-ipc.ts
import { IpcBase } from './base'

export class ShutdownIpc extends IpcBase {
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
}
