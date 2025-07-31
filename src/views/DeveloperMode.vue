<script setup lang="ts">
import {
  Edit,
  FolderOpened,
  InfoFilled,
  Refresh,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import { getDeveloperInfo, getRawConfig, saveRawConfig, triggerShutdownWindow } from '../utils/ipc/'

const loading = ref(false)
const developerInfo = ref<any>({})

// 配置文件编辑相关
const configEditorVisible = ref(false)
const configContent = ref('')
const configLoading = ref(false)
const configSaving = ref(false)
const editorRef = ref<InstanceType<typeof MonacoEditor>>()

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

// 打开配置文件编辑器
async function openConfigEditor() {
  configLoading.value = true
  configEditorVisible.value = true

  try {
    const result = await getRawConfig({
      showErrorMessage: true,
      errorMessage: '读取配置文件失败',
      silent: false,
    })

    if (result.success && result.data) {
      configContent.value = result.data.content || ''
    }
    else {
      configContent.value = ''
      ElMessage.error('无法读取配置文件')
    }
  }
  catch (error) {
    console.error('读取配置文件失败:', error)
    ElMessage.error('读取配置文件失败')
  }
  finally {
    configLoading.value = false
  }
}

// 保存配置文件
async function saveConfigFile() {
  if (!editorRef.value) {
    ElMessage.error('编辑器未初始化')
    return
  }

  // 验证JSON格式
  const validation = editorRef.value.validateJson()
  if (!validation.isValid) {
    ElMessage.error(`JSON格式错误: ${validation.error}`)
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要保存配置文件吗？这将覆盖当前的配置文件。',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    configSaving.value = true
    const content = editorRef.value.getValue() || ''

    const result = await saveRawConfig(content, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: '配置文件保存成功',
      errorMessage: '保存配置文件失败',
      silent: false,
    })

    if (result.success) {
      configEditorVisible.value = false
    }
  }
  catch (error) {
    if (error !== 'cancel') {
      console.error('保存配置文件失败:', error)
    }
  }
  finally {
    configSaving.value = false
  }
}

// 格式化JSON
async function formatConfigJson() {
  if (!editorRef.value) {
    ElMessage.error('编辑器未初始化')
    return
  }

  try {
    // 先验证 JSON 格式
    const validation = editorRef.value.validateJson()
    if (!validation.isValid) {
      ElMessage.error(`无法格式化：${validation.error}`)
      return
    }

    await editorRef.value.formatDocument()
    ElMessage.success('JSON 格式化成功')
  }
  catch (error) {
    console.error('格式化失败:', error)
    ElMessage.error('格式化失败，请检查 JSON 格式')
  }
}

// 关闭编辑器
function closeConfigEditor() {
  configEditorVisible.value = false
  configContent.value = ''
}

// 手动唤起关机倒计时窗口
async function handleTriggerShutdownWindow() {
  try {
    await triggerShutdownWindow({
      showSuccessMessage: true,
      showErrorMessage: true,
    })
  }
  catch (error) {
    console.error('唤起关机倒计时窗口失败:', error)
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
    <div class="flex gap-3">
      <el-button type="primary" @click="openConfigEditor">
        <el-icon class="mr-1">
          <Edit />
        </el-icon>
        编辑配置文件
      </el-button>

      <el-button type="warning" @click="handleTriggerShutdownWindow">
        <el-icon class="mr-1">
          <i class="i-carbon-power" />
        </el-icon>
        测试关机倒计时
      </el-button>
    </div>

    <div class="mt-4 text-center">
      <el-button type="primary" text :loading="loading" @click="loadDeveloperInfo">
        <el-icon class="mr-1">
          <Refresh />
        </el-icon>
        刷新信息
      </el-button>
    </div>
  </div>

  <el-dialog
    v-model="configEditorVisible"
    title="配置文件编辑器"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="80%"
  >
    <div v-loading="configLoading" class="config-editor-container">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          配置文件路径: {{ developerInfo.configPath }}
        </div>
        <div class="flex gap-2">
          <el-button size="small" @click="formatConfigJson">
            格式化
          </el-button>
        </div>
      </div>

      <MonacoEditor
        ref="editorRef"
        v-model="configContent"
        language="json"
        theme="vs-dark"
        :options="{
          fontSize: 14,
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="closeConfigEditor">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="configSaving"
          @click="saveConfigFile"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.break-all {
  word-break: break-all;
}

.config-editor-container {
  min-height: 400px;
}
</style>
