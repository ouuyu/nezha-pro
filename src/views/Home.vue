<script setup lang="ts">
import { ElButton, ElCard, ElCol, ElIcon, ElRow, ElStatistic, ElTabPane, ElTabs } from 'element-plus'
import { onMounted, ref } from 'vue'
import BackgroundSettings from '../components/BackgroundSettings.vue'
import { getConfig } from '../utils/ipc/'

const activeTab = ref('dashboard')
const systemInfo = ref({
  uptime: '0天0小时0分钟',
  memory: '0%',
  cpu: '0%',
  disk: '0%'
})

const shutdownStats = ref({
  totalScheduled: 0,
  totalCanceled: 0,
  lastShutdown: '从未'
})

// 获取系统信息
async function loadSystemInfo() {
  try {
    // 这里可以通过IPC获取真实的系统信息
    // 现在先模拟一些数据
    systemInfo.value = {
      uptime: '2天14小时32分钟',
      memory: '68%',
      cpu: '23%',
      disk: '45%'
    }
  } catch (error) {
    console.error('Failed to load system info:', error)
  }
}

// 获取关机统计
async function loadShutdownStats() {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data) {
      shutdownStats.value = {
        totalScheduled: result.data.shutdownStats?.totalScheduled || 0,
        totalCanceled: result.data.shutdownStats?.totalCanceled || 0,
        lastShutdown: result.data.shutdownStats?.lastShutdown || '从未'
      }
    }
  } catch (error) {
    console.error('Failed to load shutdown stats:', error)
  }
}

onMounted(() => {
  loadSystemInfo()
  loadShutdownStats()
})
</script>

<template>
  <div class="home-container">
    <ElTabs v-model="activeTab" class="full-height-tabs">
      <!-- 仪表盘 -->
      <ElTabPane label="仪表盘" name="dashboard">
        <div class="dashboard-content">
          <ElRow :gutter="20" class="mb-6">
            <ElCol :span="6">
              <ElCard shadow="hover" class="stat-card">
                <ElStatistic title="系统运行时间" :value="systemInfo.uptime" />
                <div class="stat-icon">
                  <ElIcon class="text-blue-500"><i class="i-carbon-time" /></ElIcon>
                </div>
              </ElCard>
            </ElCol>
            <ElCol :span="6">
              <ElCard shadow="hover" class="stat-card">
                <ElStatistic title="内存使用率" :value="systemInfo.memory" />
                <div class="stat-icon">
                  <ElIcon class="text-green-500"><i class="i-carbon-chip" /></ElIcon>
                </div>
              </ElCard>
            </ElCol>
            <ElCol :span="6">
              <ElCard shadow="hover" class="stat-card">
                <ElStatistic title="CPU 使用率" :value="systemInfo.cpu" />
                <div class="stat-icon">
                  <ElIcon class="text-orange-500"><i class="i-carbon-cpu" /></ElIcon>
                </div>
              </ElCard>
            </ElCol>
            <ElCol :span="6">
              <ElCard shadow="hover" class="stat-card">
                <ElStatistic title="磁盘使用率" :value="systemInfo.disk" />
                <div class="stat-icon">
                  <ElIcon class="text-purple-500"><i class="i-carbon-data-base" /></ElIcon>
                </div>
              </ElCard>
            </ElCol>
          </ElRow>

          <ElRow :gutter="20" class="mb-6">
            <ElCol :span="12">
              <ElCard shadow="hover">
                <template #header>
                  <div class="flex items-center">
                    <ElIcon class="mr-2 text-blue-500"><i class="i-carbon-power" /></ElIcon>
                    <span class="font-semibold">关机统计</span>
                  </div>
                </template>
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span>计划关机次数：</span>
                    <span class="font-semibold text-blue-600">{{ shutdownStats.totalScheduled }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>取消关机次数：</span>
                    <span class="font-semibold text-green-600">{{ shutdownStats.totalCanceled }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>最后关机时间：</span>
                    <span class="font-semibold text-gray-600">{{ shutdownStats.lastShutdown }}</span>
                  </div>
                </div>
              </ElCard>
            </ElCol>
            <ElCol :span="12">
              <ElCard shadow="hover">
                <template #header>
                  <div class="flex items-center">
                    <ElIcon class="mr-2 text-green-500"><i class="i-carbon-settings" /></ElIcon>
                    <span class="font-semibold">快速操作</span>
                  </div>
                </template>
                <div class="space-y-3">
                  <ElButton type="primary" class="w-full" @click="$router.push('/shutdown-settings')">
                    <ElIcon class="mr-2"><i class="i-carbon-time" /></ElIcon>
                    定时关机设置
                  </ElButton>
                  <ElButton type="success" class="w-full" @click="$router.push('/knowledge-base')">
                    <ElIcon class="mr-2"><i class="i-carbon-document" /></ElIcon>
                    知识库管理
                  </ElButton>
                  <ElButton type="warning" class="w-full" @click="$router.push('/developer-mode')">
                    <ElIcon class="mr-2"><i class="i-carbon-code" /></ElIcon>
                    开发者模式
                  </ElButton>
                </div>
              </ElCard>
            </ElCol>
          </ElRow>
        </div>
      </ElTabPane>

      <!-- 背景设置 -->
      <ElTabPane label="背景设置" name="background">
        <BackgroundSettings />
      </ElTabPane>

      <!-- 系统信息 -->
      <ElTabPane label="系统信息" name="system">
        <ElCard shadow="hover">
          <template #header>
            <div class="flex items-center">
              <ElIcon class="mr-2 text-blue-500"><i class="i-carbon-information" /></ElIcon>
              <span class="font-semibold">系统信息</span>
            </div>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-semibold text-gray-700 mb-2">应用信息</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>应用名称：</span>
                    <span>哪吒桌面助手</span>
                  </div>
                  <div class="flex justify-between">
                    <span>版本号：</span>
                    <span>v1.0.0</span>
                  </div>
                  <div class="flex justify-between">
                    <span>构建时间：</span>
                    <span>2024-01-01</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="font-semibold text-gray-700 mb-2">技术栈</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>框架：</span>
                    <span>Electron + Vue 3</span>
                  </div>
                  <div class="flex justify-between">
                    <span>UI 库：</span>
                    <span>Element Plus</span>
                  </div>
                  <div class="flex justify-between">
                    <span>样式：</span>
                    <span>UnoCSS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElCard>
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

.dashboard-content {
  padding: 20px 0;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  opacity: 0.3;
}

.stat-card:hover .stat-icon {
  opacity: 0.6;
  transform: scale(1.1);
  transition: all 0.3s ease;
}
</style>
