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

export interface ReleaseInfo {
  tag_name: string
  name: string
  html_url: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

export interface IpcInvokeMap {
  // 配置相关
  'get-config': () => Promise<any>
  'save-config': (data: { config: any, options?: IpcOptions }) => Promise<boolean>
  'get-config-path': () => Promise<string>
  'get-developer-info': () => Promise<{
    electronVersion: string
    nodeVersion: string
    chromeVersion: string
    platform: string
    arch: string
    appVersion: string
    appName: string
    configPath: string
    userDataPath: string
    appPath: string
  }>

  // 云同步相关
  'sync-cloud-knowledge': (sourceConfig: any) => Promise<any>
  'sync-all-cloud-sources': () => Promise<any>
  'delete-cloud-data-by-source': (sourceName: string) => Promise<any>
  'delete-all-cloud-data': () => Promise<any>

  // 关机相关
  'schedule-shutdowns': () => Promise<void>
  'create-shutdown-window': (delay: number) => Promise<void>
  'execute-system-shutdown': () => Promise<void>
  'cancel-shutdown': () => Promise<void>

  // 更新相关
  'check-for-updates': () => Promise<{
    hasUpdate: boolean
    currentVersion: string
    latestVersion: string
    releaseInfo?: ReleaseInfo
    error?: string
  }>
  'download-and-install-update': (downloadUrl: string) => Promise<{
    success: boolean
    error?: string
  }>
}
