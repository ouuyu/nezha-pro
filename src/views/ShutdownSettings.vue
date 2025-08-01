<script setup lang="ts">
import type { ShutdownTime } from '../types/interfaces'
import { Calendar, Check, Clock, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getConfig, saveConfig as saveConfigIpc } from '../utils/ipc/'

// 编辑中的索引
const editingIndex = ref<number | null>(null)

// 开始编辑
function startEditing(index: number) {
  editingIndex.value = index
}

// 停止编辑
function stopEditing() {
  editingIndex.value = null
  saveConfig()
}

// 屏幕尺寸判断
const isSmallScreen = ref(false)
const staticWeekdayOptions = [
  { label: '周一', shortLabel: '一', value: 1 },
  { label: '周二', shortLabel: '二', value: 2 },
  { label: '周三', shortLabel: '三', value: 3 },
  { label: '周四', shortLabel: '四', value: 4 },
  { label: '周五', shortLabel: '五', value: 5 },
  { label: '周六', shortLabel: '六', value: 6 },
  { label: '周日', shortLabel: '日', value: 0 },
]

const responsiveWeekdayOptions = computed(() => {
  return staticWeekdayOptions.map(opt => ({
    value: opt.value,
    label: isSmallScreen.value ? opt.shortLabel : opt.label,
  }))
})

// 关机时间列表
const shutdownTimes = ref<ShutdownTime[]>([])

// 获取星期总结
function getWeekdaySummary(weekdays: number[]): string {
  if (!weekdays || weekdays.length === 0)
    return '不重复'
  if (weekdays.length === 7)
    return '每天'

  const daySet = new Set(weekdays)
  if (daySet.size === 5 && [1, 2, 3, 4, 5].every(d => daySet.has(d))) {
    return '工作日'
  }
  if (daySet.size === 2 && [0, 6].every(d => daySet.has(d))) {
    return '周末'
  }

  const dayMap = new Map(
    staticWeekdayOptions.map(opt => [opt.value, isSmallScreen.value ? opt.shortLabel : opt.label]),
  )
  const displayOrder = [1, 2, 3, 4, 5, 6, 0]

  return displayOrder
    .filter(dayValue => daySet.has(dayValue))
    .map(dayValue => dayMap.get(dayValue))
    .join(', ')
}

// 添加关机计划
function addShutdownTime() {
  const newIndex = shutdownTimes.value.length
  shutdownTimes.value.push({
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    weekdays: [1, 2, 3, 4, 5],
    active: true,
  })
  saveConfig()
  startEditing(newIndex)
}

// 删除关机计划
function removeShutdownTime(index: number) {
  ElMessageBox.confirm('确定要删除这个关机计划吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      shutdownTimes.value.splice(index, 1)
      if (editingIndex.value === index) {
        editingIndex.value = null
      }
      else if (editingIndex.value !== null && editingIndex.value > index) {
        editingIndex.value -= 1
      }
      saveConfig()
      ElMessage({
        type: 'success',
        message: '删除成功',
      })
    })
    .catch(() => {})
}

// 切换星期
function toggleWeekday(item: ShutdownTime, day: number) {
  if (!item.active)
    return

  const index = item.weekdays.indexOf(day)
  if (index > -1) {
    item.weekdays.splice(index, 1)
  }
  else {
    item.weekdays.push(day)
  }
  saveConfig()
}

// 保存配置
async function saveConfig(showMessage = true) {
  const currentConfig = await getConfig()

  currentConfig.data.shutdownTimes = shutdownTimes.value.map(item => ({
    ...item,
    active: item.active,
  }))

  await saveConfigIpc(currentConfig.data, {
    showSuccessMessage: showMessage,
    showErrorMessage: true,
    successMessage: '设置已保存',
    errorMessage: '保存失败',
  })
}

// 加载配置
async function loadConfig() {
  const result = await getConfig({
    showErrorMessage: true,
    errorMessage: '加载配置失败',
    silent: false,
  })

  if (result.success && result.data && result.data.shutdownTimes) {
    shutdownTimes.value = result.data.shutdownTimes.map((time: any) => ({
      ...time,
      active: time.active !== undefined ? time.active : true,
    }))
    editingIndex.value = null
  }
}

const isLoading = ref(true)

function handleResize(e: MediaQueryListEvent) {
  isSmallScreen.value = e.matches
}

const mediaQuery = window.matchMedia('(max-width: 480px)')

onMounted(() => {
  isSmallScreen.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleResize)
  loadConfig()
  isLoading.value = false
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', handleResize)
})
</script>

<template>
  <div>
    <el-empty v-if="shutdownTimes.length === 0 && !isLoading" description="暂无关机计划" />

    <div v-if="shutdownTimes.length > 0 || isLoading === false" class="mb-6 flex justify-center">
      <el-button type="primary" :icon="Plus" text class="rounded-lg" @click="addShutdownTime">
        添加关机计划
      </el-button>
    </div>

    <div class="flex flex-col gap-3">
      <el-card
        v-for="(item, index) in shutdownTimes"
        :key="index"
        class="shutdown-card rounded-lg"
        shadow="hover"
        :body-style="{ padding: '15px' }"
      >
        <div v-if="editingIndex === index" class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <el-switch v-model="item.active" @change="saveConfig" />
            <el-time-picker
              v-model="item.time"
              format="HH:mm:ss"
              value-format="HH:mm:ss"
              class="flex-grow"
              :disabled="!item.active"
              @change="saveConfig"
            />
            <el-button type="primary" :icon="Check" circle @click="stopEditing" />
          </div>
          <div class="flex flex-nowrap gap-1">
            <el-button
              v-for="day in responsiveWeekdayOptions"
              :key="day.value"
              :type="item.weekdays.includes(day.value) ? 'primary' : 'default'"
              size="small"
              :plain="!item.weekdays.includes(day.value)"
              class="min-w-0 flex-1"
              :disabled="!item.active"
              @click="toggleWeekday(item, day.value)"
            >
              {{ day.label }}
            </el-button>
          </div>
        </div>

        <div v-else class="w-full flex items-center gap-4">
          <el-switch v-model="item.active" @change="saveConfig" />
          <div
            class="flex flex-grow cursor-pointer items-center gap-4"
            @click="startEditing(index)"
          >
            <div class="flex items-center gap-1">
              <el-icon class="text-gray-400">
                <Clock />
              </el-icon>
              <span
                class="text-lg"
                :class="{ 'text-gray-400 line-through': !item.active }"
              >
                {{ item.time }}
              </span>
            </div>
            <div class="hidden items-center gap-1 md:flex">
              <el-divider direction="vertical" />
              <div class="flex items-center gap-2">
                <el-icon class="text-gray-400">
                  <Calendar />
                </el-icon>
                <span class="text-gray-500" :class="{ 'text-gray-400': !item.active }">
                  {{ getWeekdaySummary(item.weekdays) }}
                </span>
              </div>
            </div>
          </div>
          <div class="actions">
            <el-button :icon="Edit" text circle @click="startEditing(index)" />
            <el-button
              :icon="Delete"
              type="danger"
              text
              circle
              @click="removeShutdownTime(index)"
            />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
