import type { IpcOptions, IpcResult } from '../../types'
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

export class IpcBase {
  private ipcRenderer: any = null

  protected getIpcRenderer() {
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

  protected showSuccessMessage(message: string) {
    ElMessage({
      message,
      type: 'success',
      duration: 1000,
    })
  }

  protected showErrorMessage(message: string) {
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
}
