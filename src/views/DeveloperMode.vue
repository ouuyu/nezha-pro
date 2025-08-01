<script setup lang="ts">
import { InfoFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import { getDeveloperInfo, getRawConfig, saveRawConfig, triggerShutdownWindow } from '../utils/ipc/'

const loading = ref(false)
const developerInfo = ref<any>({})
const configEditorVisible = ref(false)
const configContent = ref('')
const editorRef = ref()

const infoItems = computed(() => {
  const info = developerInfo.value
  const platformMap: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
  }
  return [
    { label: '应用版本', value: info.appVersion },
    { label: '应用名称', value: info.appName },
    { label: 'Electron 版本', value: info.electronVersion },
    { label: 'Node.js 版本', value: info.nodeVersion },
    { label: 'Chrome 版本', value: info.chromeVersion },
    { label: '操作系统', value: platformMap[info.platform] || info.platform },
    { label: '架构', value: info.arch },
    { label: '时区', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: '配置文件位置', value: info.configPath },
    { label: '用户数据目录', value: info.userDataPath },
    { label: '应用程序路径', value: info.appPath },
  ]
})

// 复制文本到剪贴板
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

// 加载开发者信息
async function loadDeveloperInfo() {
  loading.value = true
  const result = await getDeveloperInfo({ silent: true })
  if (result.success)
    developerInfo.value = result.data
  else ElMessage.error('获取信息失败')
  loading.value = false
}

// 打开配置文件编辑器
async function openConfigEditor() {
  const result = await getRawConfig({ silent: true })
  if (result.success) {
    configContent.value = result.data.content || ''
    configEditorVisible.value = true
  }
  else {
    ElMessage.error('读取配置文件失败')
  }
}

// 保存配置文件
async function saveConfigFile() {
  if (!editorRef.value?.validateJson().isValid) {
    ElMessage.error('JSON格式错误')
    return
  }
  await ElMessageBox.confirm('确定要保存吗？', '确认')
  const content = editorRef.value.getValue() || ''
  const result = await saveRawConfig(content, { silent: true })
  if (result.success) {
    ElMessage.success('保存成功')
    configEditorVisible.value = false
  }
  else {
    ElMessage.error('保存失败')
  }
}

// 格式化JSON
async function formatConfigJson() {
  if (!editorRef.value?.validateJson().isValid) {
    ElMessage.error('JSON格式错误，无法格式化')
    return
  }
  await editorRef.value.formatDocument()
  ElMessage.success('格式化成功')
}

// 唤起关机倒计时窗口
function handleTriggerShutdownWindow() {
  triggerShutdownWindow({ silent: true })
}

onMounted(loadDeveloperInfo)
</script>

<template>
  <div>
    <h2 class="mb-4 text-lg font-bold">
      开发者模式
    </h2>
    <el-card shadow="hover" class="mb-4 rounded-lg">
      <template #header>
        <div class="flex items-center">
          <el-icon class="mr-2">
            <InfoFilled />
          </el-icon>
          <span class="font-semibold">系统与路径信息</span>
          <el-button class="ml-auto" type="primary" link :loading="loading" @click="loadDeveloperInfo">
            <el-icon class="mr-1">
              <Refresh />
            </el-icon>刷新
          </el-button>
        </div>
      </template>
      <el-descriptions :column="1" size="small">
        <el-descriptions-item v-for="item in infoItems" :key="item.label">
          <div class="flex items-center">
            <span class="mr-2 break-all">
              {{ item.label }}: {{ item.value || 'N/A' }}
            </span>
            <el-button v-if="item.value" size="small" type="primary" link @click="copyToClipboard(item.value)">
              复制
            </el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="flex gap-3">
      <el-button type="primary" @click="openConfigEditor">
        编辑配置文件
      </el-button>
      <el-button type="warning" @click="handleTriggerShutdownWindow">
        测试关机倒计时
      </el-button>
    </div>

    <el-dialog v-model="configEditorVisible" title="配置文件编辑器" width="80%" :close-on-click-modal="false" :close-on-press-escape="false">
      <template #header>
        <div class="flex items-center justify-between">
          <span>配置文件编辑器</span>
          <el-button size="small" @click="formatConfigJson">
            格式化
          </el-button>
        </div>
      </template>
      <MonacoEditor
        ref="editorRef"
        v-model="configContent"
        language="json"
        theme="vs-dark"
        :options="{ fontSize: 14, minimap: { enabled: false } }"
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="configEditorVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="saveConfigFile">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.break-all { word-break: break-all; }
</style>
