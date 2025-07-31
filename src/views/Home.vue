<script setup lang="ts">
import { ElTabPane, ElTabs } from 'element-plus'
import { ref } from 'vue'
import BackgroundSettings from '../components/BackgroundSettings.vue'

const activeTab = ref('background')
</script>

<template>
  <div class="home-container">
    <ElTabs v-model="activeTab" class="full-height-tabs">
      <ElTabPane label="背景设置" name="background">
        <BackgroundSettings />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.home-container {
  height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

.full-height-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}
</style>
