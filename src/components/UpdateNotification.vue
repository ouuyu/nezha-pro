<template>
  <el-dialog
    v-model="visible"
    title="发现新版本"
    width="400px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="update-content">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="mb-4"
      />
      
      <div v-if="!error && updateInfo" class="update-info">
        <p>检测到新版本可用：</p>
        <ul>
          <li>当前版本：v{{ updateInfo.currentVersion }}</li>
          <li>最新版本：{{ updateInfo.latestVersion }}</li>
        </ul>
        <p>更新包含性能优化和错误修复。</p>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="remindLater">稍后提醒</el-button>
        <el-button
          type="primary"
          :loading="updating"
          @click="updateNow"
        >
          {{ updating ? '更新中...' : '立即更新' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
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

const visible = defineModel<boolean>('visible', { default: false })
const updateInfo = ref<UpdateInfo | null>(null)
const updating = ref(false)
const error = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'close'): void
}>()

async function checkForUpdates() {
  try {
    const result = await updateIpc.checkForUpdates()
    if (result.success && result.data) {
      updateInfo.value = {
        hasUpdate: result.data.hasUpdate,
        currentVersion: result.data.currentVersion,
        latestVersion: result.data.latestVersion,
        releaseInfo: result.data.releaseInfo,
        error: result.data.error
      }
      error.value = null
      
      if (updateInfo.value.hasUpdate) {
        visible.value = true
      }
    } else {
      error.value = result.error || '检查更新失败，请稍后重试'
    }
  } catch (err) {
    console.error('检查更新失败:', err)
    error.value = '检查更新失败，请稍后重试'
  }
}

async function updateNow() {
  if (!updateInfo.value?.releaseInfo) return
  
  // Find the Windows executable
  const exeAsset = updateInfo.value.releaseInfo.assets.find(
    asset => asset.name.endsWith('.exe')
  )
  
  if (!exeAsset) {
    error.value = '未找到适用于Windows的安装包'
    return
  }
  
  updating.value = true
  try {
    const result = await updateIpc.downloadAndInstallUpdate(exeAsset.browser_download_url)
    if (!result.success) {
      throw new Error(result.error || '更新失败')
    }
    // The app will be closed during the update process
  } catch (err) {
    console.error('更新失败:', err)
    error.value = '更新失败，请手动下载安装'
    updating.value = false
  }
}

function remindLater() {
  visible.value = false
  emit('close')
}

defineExpose({
  checkForUpdates
})

// Check for updates when component is mounted
onMounted(() => {
  // Only check for updates in production environment
  // @ts-expect-error: process is available in Electron environment
  if (process.env.NODE_ENV === 'production') {
    checkForUpdates()
  }
})
</script>

<style scoped>
.update-content {
  padding: 20px 0;
}

.update-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.update-info li {
  margin: 5px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>