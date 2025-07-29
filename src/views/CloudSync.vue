<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

interface CloudKnowledgeSource {
  id: string
  name: string
  url: string
  enabled: boolean
  lastSyncTime?: string
}

const cloudSources = ref<CloudKnowledgeSource[]>([])
const autoSyncEnabled = ref(false)
const syncInterval = ref(60)
const dialogVisible = ref(false)
const editIndex = ref<number | null>(null)
const form = ref({ name: '', url: '', enabled: true })
const formRef = ref()

const rules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  url: [
    { required: true, message: '请输入数据源URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' },
  ],
}

async function loadConfig() {
  const result = await getConfig({
    showErrorMessage: true,
    errorMessage: '加载配置失败',
    silent: false,
  })
  if (result.success && result.data) {
    cloudSources.value = result.data.cloudKnowledgeSources || []
    autoSyncEnabled.value = result.data.autoSyncEnabled || false
    syncInterval.value = result.data.syncInterval || 60
  }
}

function openAddDialog() {
  editIndex.value = null
  form.value = { name: '', url: '', enabled: true }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 100)
}

function editSource(index: number) {
  editIndex.value = index
  form.value = { ...cloudSources.value[index] }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 100)
}

function saveSource() {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (editIndex.value === null) {
        // 新增数据源
        const newSource: CloudKnowledgeSource = {
          ...form.value,
          id: Date.now().toString(), // 简单的ID生成
        }
        cloudSources.value.push(newSource)
      }
      else {
        // 编辑数据源
        cloudSources.value[editIndex.value] = {
          ...cloudSources.value[editIndex.value],
          ...form.value,
        }
      }
      await updateConfig()
      dialogVisible.value = false
      ElMessage.success(editIndex.value === null ? '新增成功' : '更新成功')
    }
    else {
      ElMessage.error('请检查输入内容')
    }
  })
}

function confirmDelete(index: number) {
  ElMessageBox.confirm(
    '确定要删除这个数据源吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    deleteSource(index)
  }).catch(() => {})
}

async function deleteSource(index: number) {
  cloudSources.value.splice(index, 1)
  await updateConfig()
  ElMessage.success('删除成功')
}

async function toggleSourceEnabled(index: number) {
  cloudSources.value[index].enabled = !cloudSources.value[index].enabled
  await updateConfig()
}

async function updateAutoSyncSettings() {
  await updateConfig()
  ElMessage.success('自动同步设置已保存')
}

async function updateConfig() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data) {
    return
  }
  const config = configResult.data
  config.cloudKnowledgeSources = cloudSources.value
  config.autoSyncEnabled = autoSyncEnabled.value
  config.syncInterval = syncInterval.value
  await saveConfig(config, {
    showSuccessMessage: false,
    showErrorMessage: true,
    errorMessage: '保存失败',
  })
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
    ElMessage.error(`连接测试失败: ${error}`)
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="space-y-6">
    <!-- 自动同步设置 -->
    <el-card class="rounded-lg" shadow="hover">
      <template #header>
        <h3 class="text-lg font-bold">
          自动同步设置
        </h3>
      </template>
      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <el-switch
            v-model="autoSyncEnabled"
            @change="updateAutoSyncSettings"
          />
          <span>启用自动同步</span>
        </div>
        <div v-if="autoSyncEnabled" class="flex items-center space-x-4">
          <span>同步间隔：</span>
          <el-input-number
            v-model="syncInterval"
            :min="5"
            :max="1440"
            @change="updateAutoSyncSettings"
          />
          <span>分钟</span>
        </div>
      </div>
    </el-card>

    <!-- 云端数据源管理 -->
    <el-card class="rounded-lg" shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">
            云端数据源
          </h3>
          <el-button type="primary" @click="openAddDialog">
            新增数据源
          </el-button>
        </div>
      </template>

      <el-table :data="cloudSources" style="width: 100%" empty-text="暂无数据源">
        <el-table-column prop="name" label="名称" width="150" show-overflow-tooltip />
        <el-table-column prop="url" label="URL" show-overflow-tooltip />
        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              @change="toggleSourceEnabled(scope.$index)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastSyncTime" label="最后同步" width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="testConnection(scope.row)">
              测试
            </el-button>
            <el-button size="small" @click="editSource(scope.$index)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="confirmDelete(scope.$index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑数据源对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editIndex === null ? '新增数据源' : '编辑数据源'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="数据源名称" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
          <el-input v-model="form.url" placeholder="https://example.com/knowledge.json" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="saveSource">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
