// src/utils/ipc/update.ts
import { IpcBase } from './base'

export class UpdateIpc extends IpcBase {
  /**
   * 检查更新
   */
  async checkForUpdates() {
    return await this.invoke('check-for-updates')
  }

  /**
   * 下载并安装更新
   */
  async downloadAndInstallUpdate() {
    return await this.invoke('download-and-install-update')
  }
  
  /**
   * 退出并安装更新
   */
  async quitAndInstall() {
    return await this.invoke('quit-and-install')
  }
}

export const updateIpc = new UpdateIpc()
