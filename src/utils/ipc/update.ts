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
   * @param downloadUrl 下载地址
   */
  async downloadAndInstallUpdate(downloadUrl: string) {
    return await this.invoke('download-and-install-update', downloadUrl)
  }
}

export const updateIpc = new UpdateIpc()
