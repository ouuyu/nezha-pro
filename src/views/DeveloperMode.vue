<script setup lang="ts">
import {
  FolderOpened,
  InfoFilled,
  Refresh,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { getDeveloperInfo } from '../utils/ipc'

const loading = ref(false)
const developerInfo = ref<any>({})

const infoItems = computed(() => [
  { label: '应用版本', key: 'appVersion' },
  { label: '应用名称', key: 'appName' },
  { label: 'Electron 版本', key: 'electronVersion' },
  { label: 'Node.js 版本', key: 'nodeVersion' },
  { label: 'Chrome 版本', key: 'chromeVersion' },
  { label: '操作系统', key: 'platform', formatter: getPlatformName },
  { label: '架构', key: 'arch' },
  { label: '时区', key: 'timeZone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
])

const pathItems = computed(() => [
  { label: '配置文件位置', key: 'configPath' },
  { label: '用户数据目录', key: 'userDataPath' },
  { label: '应用程序路径', key: 'appPath' },
])

function getPlatformName(platform: string) {
  const platformMap: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
    freebsd: 'FreeBSD',
    openbsd: 'OpenBSD',
    sunos: 'SunOS',
  }
  return platformMap[platform] || platform || 'Unknown'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  }
  catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

async function loadDeveloperInfo() {
  loading.value = true
  try {
    const result = await getDeveloperInfo({
      showErrorMessage: true,
      errorMessage: '获取开发者信息失败',
      silent: false,
    })
    if (result.success && result.data) {
      developerInfo.value = result.data
    }
  }
  catch (error) {
    console.error('加载开发者信息失败:', error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDeveloperInfo()
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h2 class="text-lg font-bold">
        开发者模式
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        查看应用程序的技术信息和配置详情
      </p>
    </div>

    <el-card shadow="hover" class="mb-4 rounded-lg">
      <template #header>
        <div class="flex items-center">
          <el-icon class="mr-2">
            <InfoFilled />
          </el-icon>
          <span class="font-semibold">版本与系统信息</span>
        </div>
      </template>
      <el-descriptions :column="1" size="small">
        <el-descriptions-item
          v-for="item in infoItems"
          :key="item.key"
          :label="item.label"
        >
          {{ item.value || (item.formatter ? item.formatter(developerInfo[item.key]) : developerInfo[item.key]) || 'N/A' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="hover" class="mb-4 rounded-lg">
      <template #header>
        <div class="flex items-center">
          <el-icon class="mr-2">
            <FolderOpened />
          </el-icon>
          <span class="font-semibold">路径信息</span>
        </div>
      </template>
      <el-descriptions :column="1" size="small">
        <el-descriptions-item
          v-for="item in pathItems"
          :key="item.key"
          :label="item.label"
        >
          <div class="flex items-center">
            <span class="mr-2 break-all">{{ developerInfo[item.key] || 'N/A' }}</span>
            <el-button
              v-if="developerInfo[item.key]"
              size="small"
              type="primary"
              link
              @click="copyToClipboard(developerInfo[item.key])"
            >
              复制
            </el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="mt-4 text-center">
      <el-button type="primary" text :loading="loading" @click="loadDeveloperInfo">
        <el-icon class="mr-1">
          <Refresh />
        </el-icon>
        刷新信息
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.break-all {
  word-break: break-all;
}
</style>
