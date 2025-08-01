import type { ShutdownTime } from '../types'
import { ref } from 'vue'
import { getConfig, saveConfig as saveConfigIpc } from '../utils/ipc'

export function useConfig() {
  const shutdownTimes = ref<ShutdownTime[]>([])
  const isLoading = ref(true)

  async function loadConfig() {
    const result = await getConfig({
      showErrorMessage: true,
      errorMessage: '加载配置失败',
      silent: false,
    })

    if (result.success && result.data?.shutdownTimes) {
      shutdownTimes.value = result.data.shutdownTimes.map((time: any) => ({
        ...time,
        active: time.active !== undefined ? time.active : true,
      }))
    }
    isLoading.value = false
  }

  async function saveConfig(showMessage = true) {
    const serializableConfig = {
      shutdownTimes: shutdownTimes.value.map(time => ({
        time: time.time,
        weekdays: [...time.weekdays],
        active: time.active,
      })),
    }

    await saveConfigIpc(serializableConfig, {
      showSuccessMessage: showMessage,
      showErrorMessage: true,
      successMessage: '设置已保存',
      errorMessage: '保存失败',
    })
  }

  return {
    shutdownTimes,
    isLoading,
    loadConfig,
    saveConfig,
  }
}
