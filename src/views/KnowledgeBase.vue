<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import CloudSyncSettings from '../components/CloudSyncSettings.vue'
import KnowledgeManagement from '../components/KnowledgeManagement.vue'

const activeTab = ref('sync')
const syncLoading = ref(false)
const lastSyncTime = ref('')

async function syncFromCloud() {
  try {
    syncLoading.value = true
    ElMessage.info('开始同步云端数据...')

    const result = await window.require('electron').ipcRenderer.invoke('sync-all-cloud-knowledge')

    if (result.success) {
      lastSyncTime.value = new Date().toLocaleString()
      ElMessage.success(`同步成功！共同步 ${result.totalCount || 0} 条数据`)
    }
    else {
      ElMessage.error(`同步失败：${result.message}`)
    }
  }
  catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败，请检查网络连接')
  }
  finally {
    syncLoading.value = false
  }
}
</script>

<template>
  <div class="knowledge-base-container">
    <el-card class="full-height-card rounded-lg" shadow="hover">
      <el-tabs v-model="activeTab" class="full-height-tabs">
        <el-tab-pane label="云端同步" name="sync" class="full-height-pane">
          <CloudSyncSettings />
        </el-tab-pane>
        <el-tab-pane label="知识库" name="knowledge" class="full-height-pane">
          <KnowledgeManagement
            :sync-loading="syncLoading"
            :last-sync-time="lastSyncTime"
            @sync-from-cloud="syncFromCloud"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.knowledge-base-container {
  height: calc(100vh - 32px); /* 减去 main 容器的 padding */
  display: flex;
  flex-direction: column;
}

.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-card :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.full-height-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.full-height-tabs :deep(.el-tabs__content) {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.full-height-pane {
  height: 100%;
}

.full-height-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
