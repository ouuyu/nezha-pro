// ==================== IPC 通信相关接口 ====================

/**
 * IPC 调用结果
 */
export interface IpcResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * IPC 调用选项
 */
export interface IpcOptions {
  showSuccessMessage?: boolean
  showErrorMessage?: boolean
  successMessage?: string
  errorMessage?: string
  silent?: boolean
  skipAutoSyncRestart?: boolean
}