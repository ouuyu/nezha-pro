<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import KnowledgeManagement from '../components/KnowledgeManagement.vue'
import CloudSyncSettings from '../components/CloudSyncSettings.vue'

const activeTab = ref('knowledge')
const syncLoading = ref(false)
const lastSyncTime = ref('')

// 从云端同步数据
async function syncFromCloud() {
  try {
    syncLoading.value = true
    ElMessage.info('开始同步云端数据...')
    
    const result = await window.require('electron').ipcRenderer.invoke('sync-all-cloud-knowledge')
    
    if (result.success) {
      lastSyncTime.value = new Date().toLocaleString()
      ElMessage.success(`同步成功！共同步 ${result.totalCount || 0} 条数据`)
      
      // 刷新知识库数据
      window.location.reload()
    } else {
      ElMessage.error(`同步失败：${result.message}`)
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败，请检查网络连接')
  } finally {
    syncLoading.value = false
  }
}
</script>

<template>
  <el-card class="rounded-lg" shadow="hover">
    <el-tabs v-model="activeTab">
      <!-- 知识库管理标签页 -->
      <el-tab-pane label="知识库管理" name="knowledge">
        <KnowledgeManagement
          :sync-loading="syncLoading"
          :last-sync-time="lastSyncTime"
          @sync-from-cloud="syncFromCloud"
        />
      </el-tab-pane>

      <!-- 云端同步设置标签页 -->
      <el-tab-pane label="云端同步设置" name="sync">
        <CloudSyncSettings />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped>
.rounded-lg {
  border-radius: 8px;
}
</style>
