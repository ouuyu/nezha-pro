// src/utils/ipc/update.ts
import { IpcBase } from './base'

export class UpdateIpc extends IpcBase {
  /**
   * 运行更新程序
   */
  async runUpdate() {
    return await this.invoke('run-update')
  }
}

export const updateIpc = new UpdateIpc()
