<script setup lang="ts">
import type { CloudKnowledgeSource } from '../types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc/'

const sourceDialogVisible = ref(false)
const editSourceIndex = ref<number | null>(null)
const sourceForm = ref({ name: '', url: '', enabled: true })
const sourceFormRef = ref()

const sourceRules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  url: [
    { required: true, message: '请输入数据源 URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的 URL 地址', trigger: 'blur' },
  ],
}

const cloudSources = ref<CloudKnowledgeSource[]>([])
const autoSyncEnabled = ref(false)
const syncInterval = ref(60)

async function loadConfig() {
  const result = await getConfig({ showErrorMessage: true, errorMessage: '加载配置失败', silent: false })
  if (result.success && result.data) {
    cloudSources.value = result.data.cloudKnowledgeSources || []
    autoSyncEnabled.value = result.data.autoSyncEnabled || false
    syncInterval.value = result.data.syncInterval || 60
  }
}

async function updateConfig() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data)
    return

  const config = configResult.data
  config.cloudKnowledgeSources = cloudSources.value
  config.autoSyncEnabled = autoSyncEnabled.value
  config.syncInterval = syncInterval.value
  await saveConfig(config, { showSuccessMessage: false, showErrorMessage: true, errorMessage: '保存失败' })
}

function openAddSourceDialog() {
  editSourceIndex.value = null
  sourceForm.value = { name: '', url: '', enabled: true }
  sourceDialogVisible.value = true
  setTimeout(() => sourceFormRef.value?.clearValidate(), 100)
}

function editCloudSource(index: number) {
  const source = cloudSources.value[index]
  editSourceIndex.value = index
  sourceForm.value = { ...source }
  sourceDialogVisible.value = true
  setTimeout(() => sourceFormRef.value?.clearValidate(), 100)
}

function saveCloudSource() {
  sourceFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (editSourceIndex.value === null) {
        cloudSources.value.push({ ...sourceForm.value, id: Date.now().toString() })
      }
      else {
        cloudSources.value[editSourceIndex.value] = { ...cloudSources.value[editSourceIndex.value], ...sourceForm.value }
      }
      sourceDialogVisible.value = false
      ElMessage.success(editSourceIndex.value === null ? '新增成功' : '更新成功')
      await updateConfig()
    }
    else {
      ElMessage.error('请检查输入内容')
    }
  })
}

function confirmDeleteSource(index: number) {
  ElMessageBox.confirm('确定要删除这个数据源吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteCloudSource(index)
  }).catch(() => {})
}

function deleteCloudSource(index: number) {
  cloudSources.value.splice(index, 1)
  updateConfig()
  ElMessage.success('删除成功')
}

function toggleSourceEnabled(_index: number) {
  updateConfig()
}

function updateAutoSyncSettings() {
  updateConfig()
  ElMessage.success('自动同步设置已保存')
}

async function testConnection(source: CloudKnowledgeSource) {
  try {
    ElMessage.info('正在测试连接...')
    const result = await window.require('electron').ipcRenderer.invoke('sync-cloud-knowledge', {
      sourceId: source.id,
      url: source.url,
      name: source.name,
    })

    if (result.success) {
      ElMessage.success(`连接成功！获取到 ${result.itemCount || 0} 条数据`)
    }
    else {
      ElMessage.error(`连接失败：${result.message}`)
    }
  }
  catch (error) {
    console.error(error)
    ElMessage.error('连接测试失败')
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname
  }
  catch {
    return ''
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('URL 已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

onMounted(loadConfig)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex">
      <div class="flex items-center gap-x-4">
        <div class="flex items-center gap-2">
          <el-switch v-model="autoSyncEnabled" @change="updateAutoSyncSettings" />
          <span>启用自动同步</span>
        </div>
        <div v-if="autoSyncEnabled" class="flex items-center space-x-1">
          <span>间隔：</span>
          <el-input-number
            v-model="syncInterval"
            size="small" :min="1" :max="60" controls-position="right"
            class="w-18"
            @change="updateAutoSyncSettings"
          />
          <span>分钟</span>
        </div>
      </div>
    </div>

    <div class="mt-4 min-h-0 flex flex-1 flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold">
          云端数据源
        </h3>
        <el-button type="primary" @click="openAddSourceDialog">
          新增数据源
        </el-button>
      </div>

      <div class="min-h-[300px] flex-1">
        <el-table :data="cloudSources" style="width: 100%" empty-text="暂无数据源" height="100%">
          <el-table-column prop="name" label="名称" show-overflow-tooltip>
            <template #default="scope">
              <div class="flex items-center gap-2">
                <span>{{ scope.row.name }}</span>
                <el-tag v-if="scope.row.isBuiltIn" size="small" type="info">
                  内置
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="URL" show-overflow-tooltip>
            <template #default="scope">
              <el-tooltip :content="scope.row.url" placement="top">
                <el-tag type="info" effect="plain" style="cursor: pointer;" @click="copyToClipboard(scope.row.url)">
                  {{ getDomainFromUrl(scope.row.url) }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="enabled" label="状态" width="80" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.enabled" @change="toggleSourceEnabled(scope.$index)" />
            </template>
          </el-table-column>
          <el-table-column prop="lastSyncTime" label="最后同步" width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="testConnection(scope.row)">
                测试
              </el-button>
              <el-button size="small" :disabled="scope.row.isBuiltIn" @click="editCloudSource(scope.$index)">
                编辑
              </el-button>
              <el-button size="small" type="danger" :disabled="scope.row.isBuiltIn" @click="confirmDeleteSource(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="sourceDialogVisible" :title="editSourceIndex === null ? '新增数据源' : '编辑数据源'" width="600px">
      <el-form ref="sourceFormRef" :model="sourceForm" :rules="sourceRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="sourceForm.name" placeholder="数据源名称" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
          <el-input v-model="sourceForm.url" placeholder="https://example.com/knowledge.json" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="sourceForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sourceDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="saveCloudSource">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
