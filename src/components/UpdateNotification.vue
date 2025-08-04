<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { updateIpc } from '../utils/ipc'

interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseInfo?: {
    assets: Array<{
      name: string
      browser_download_url: string
    }>
  }
  error?: string
}

const emit = defineEmits<{
  (e: 'close'): void
}>()
const visible = defineModel<boolean>('visible', { default: false })
const updateInfo = ref<UpdateInfo | null>(null)
const updating = ref(false)
const error = ref<string | null>(null)
const isChecking = ref(false)
const downloadProgress = ref<number | null>(null)

async function checkForUpdates() {
  if (isChecking.value)
    return

  isChecking.value = true
  try {
    const result = await updateIpc.checkForUpdates()
    if (result.success && result.data) {
      updateInfo.value = {
        hasUpdate: result.data.hasUpdate,
        currentVersion: result.data.currentVersion,
        latestVersion: result.data.latestVersion,
        releaseInfo: result.data.releaseInfo,
        error: result.data.error,
      }
      error.value = null

      if (updateInfo.value.hasUpdate) {
        visible.value = true
      }
      else {
        ElMessage.success('当前已是最新版本')
      }
    }
    else {
      error.value = result.error || '检查更新失败，请稍后重试'
      ElMessage.error(error.value)
    }
  }
  catch (err) {
    console.error('检查更新失败:', err)
    error.value = '检查更新失败，请稍后重试'
    ElMessage.error(error.value)
  }
  finally {
    isChecking.value = false
  }
}

async function updateNow() {
  updating.value = true
  downloadProgress.value = 0
  try {
    const result = await updateIpc.downloadAndInstallUpdate()
    if (!result.success) {
      throw new Error(result.error || '更新失败')
    }

    // Download successful, now quit and install
    await updateIpc.quitAndInstall()
  }
  catch (err) {
    console.error('更新失败:', err)
    error.value = '更新失败，请手动下载安装'
    ElMessage.error(error.value)
    updating.value = false
  }
}

function remindLater() {
  visible.value = false
  emit('close')
}

defineExpose({
  checkForUpdates,
})

// Listen for download progress
onMounted(() => {
  // Process is available in Electron environment
  if (window.require) {
    // Process is available in Electron environment
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.on('download-progress', (_event: any, progressObj: any) => {
      downloadProgress.value = Math.round(progressObj.percent)
    })

    ipcRenderer.on('update-downloaded', () => {
      updating.value = false
      ElMessage.success('更新下载完成，应用将重新启动')
    })

    ipcRenderer.on('update-error', (_event: any, errorMessage: string) => {
      error.value = errorMessage
      ElMessage.error(`更新错误: ${errorMessage}`)
      updating.value = false
    })
  }

  // Only check for updates in production environment
  // Process is available in Electron environment
  checkForUpdates()
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="发现新版本"
    width="400px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="px-4 py-2">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <div v-if="!error && updateInfo" class="text-sm text-gray-700 space-y-4">
        <p class="text-gray-900 font-medium">
          检测到新版本可用，建议立即更新以获得更好的体验。
        </p>
        <ul class="list-disc list-inside space-y-1">
          <li>
            <span class="font-bold">当前版本：</span><span class="font-mono">{{ updateInfo.currentVersion }}</span>
          </li>
          <li>
            <span class="font-bold">最新版本：</span><span class="font-mono">{{ updateInfo.latestVersion }}</span>
          </li>
        </ul>

        <div v-if="updating && downloadProgress !== null" class="h-2.5 w-full rounded-full bg-gray-200">
          <div
            class="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
            :style="{ width: `${downloadProgress}%` }"
          />
          <div class="mt-1 text-center text-xs text-gray-500">
            下载中... {{ downloadProgress }}%
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="remindLater">
          稍后提醒
        </el-button>
        <el-button
          type="primary"
          :loading="updating && downloadProgress === null"
          :disabled="updating"
          @click="updateNow"
        >
          <div v-if="!updating || downloadProgress !== null" class="i-carbon-download mr-1" />
          {{ updating && downloadProgress !== null ? '正在下载更新...' : '立即更新' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
