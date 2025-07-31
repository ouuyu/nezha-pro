import type { IpcOptions, IpcResult } from '../../types/interfaces'
import { IpcBase } from './base'

export class ConfigIpc extends IpcBase {
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

  async getDeveloperInfo(options: IpcOptions = {}): Promise<IpcResult<any>> {
    return this.invoke('get-developer-info', undefined, {
      showErrorMessage: true,
      errorMessage: '获取开发者信息失败',
      ...options,
    })
  }
}
