<template>
  <div class="max-w-1000px mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6 text-center">关机时间设置</h1>

    <div class="flex flex-col gap-3">
      <el-card
        v-for="(item, index) in shutdownTimes"
        :key="index"
        class="rounded-lg shadow-sm border-none"
      >
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-semibold m-0">关机时间 #{{ index + 1 }}</h3>
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="removeShutdownTime(index)"
          />
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <el-time-picker
            v-model="item.time"
            placeholder="选择时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            @change="saveConfig"
            class="w-full sm:w-36"
          />

          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
            <span class="font-bold whitespace-nowrap">星期：</span>
            <el-checkbox-group
              v-model="item.weekdays"
              @change="saveConfig"
              class="flex flex-wrap gap-x-2 gap-y-1"
            >
              <el-checkbox
                v-for="day in weekdayOptions"
                :key="day.value"
                :value="day.value"
                border
                size="small"
              >
                {{ day.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-card>

      <div class="flex justify-center mt-3">
        <el-button
          type="primary"
          :icon="Plus"
          plain
          @click="addShutdownTime"
          class="w-full sm:w-auto px-6 py-3 text-lg"
        >
          添加新的关机时间
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Delete, Plus } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  // 定义关机时间类型
  interface ShutdownTime {
    time: string
    weekdays: number[]
  }

  // 星期选项
  const weekdayOptions = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 0 }
  ]

  // 关机时间列表
  const shutdownTimes = ref<ShutdownTime[]>([])

  // 添加新的关机时间
  const addShutdownTime = () => {
    shutdownTimes.value.push({
      time: '00:00:00',
      weekdays: []
    })
    saveConfig()
  }

  // 移除关机时间
  const removeShutdownTime = (index: number) => {
    shutdownTimes.value.splice(index, 1)
    saveConfig()
  }

  // 保存配置到Electron主进程
  const saveConfig = async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      // 创建可序列化的关机时间副本
      const serializableConfig = {
        shutdownTimes: shutdownTimes.value.map(time => ({
          time: time.time,
          weekdays: [...time.weekdays]
        }))
      }

      const result = await ipcRenderer.invoke('save-config', serializableConfig)

      if (result) {
        ElMessage({
          message: '保存成功',
          type: 'success',
          duration: 2000
        })
      } else {
        ElMessage.error('保存失败')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      ElMessage.error('保存失败')
    }
  }

  // 从Electron主进程加载配置
  const loadConfig = async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      const config = await ipcRenderer.invoke('get-config')

      if (config && config.shutdownTimes) {
        shutdownTimes.value = config.shutdownTimes
      }
    } catch (error) {
      console.error('Error loading config:', error)
      ElMessage.error('加载配置失败')
    }
  }

  // 组件挂载时加载配置
  onMounted(() => {
    loadConfig()
  })
</script>

<style scoped>
  /* 无需额外CSS */
</style>
