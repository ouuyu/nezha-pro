<template>
  <el-empty v-if="shutdownTimes.length === 0 && !isLoading" description="暂无关机计划">
    <el-button text type="primary" @click="addShutdownTime" class="rounded-lg px-6 py-3"
      >创建第一个计划
    </el-button>
  </el-empty>

  <TransitionGroup name="shutdown-list" tag="div" class="flex flex-col gap-3">
    <el-card
      v-for="(item, index) in shutdownTimes"
      :key="index"
      class="shutdown-card transition-all-300 rounded-lg"
      shadow="hover"
      :body-style="{ padding: '15px' }"
    >
      <transition name="view-switch" mode="out-in">
        <!-- 编辑视图 -->
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
              class="flex-1 min-w-0"
              @click="toggleWeekday(item, day.value)"
              :disabled="!item.active"
            >
              {{ day.label }}
            </el-button>
          </div>
        </div>

        <!-- 常规视图 -->
        <div v-else class="flex items-center gap-4 w-full">
          <el-switch v-model="item.active" @change="saveConfig" />
          <div
            class="flex-grow flex items-center gap-4 cursor-pointer"
            @click="startEditing(index)"
          >
            <div class="flex items-center gap-1">
              <el-icon class="text-gray-400"><Clock /></el-icon>
              <span
                class="font-mono text-lg"
                :class="{ 'text-gray-400 line-through': !item.active }"
              >
                {{ item.time }}
              </span>
            </div>
            <div class="hidden md:flex gap-1 items-center">
              <el-divider direction="vertical" />
              <div class="items-center flex gap-2">
                <el-icon class="text-gray-400"><Calendar /></el-icon>
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
      </transition>
    </el-card>
  </TransitionGroup>

  <div class="flex justify-center mt-6" v-if="shutdownTimes.length">
    <el-button type="primary" :icon="Plus" text @click="addShutdownTime" class="rounded-lg">
      添加关机计划
    </el-button>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import { Delete, Plus, Clock, Calendar, Edit, Check } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  interface ShutdownTime {
    time: string
    weekdays: number[]
    active: boolean
  }

  const editingIndex = ref<number | null>(null)

  const startEditing = (index: number) => {
    editingIndex.value = index
  }

  const stopEditing = () => {
    editingIndex.value = null
    saveConfig()
  }

  const isSmallScreen = ref(false)
  const staticWeekdayOptions = [
    { label: '周一', shortLabel: '一', value: 1 },
    { label: '周二', shortLabel: '二', value: 2 },
    { label: '周三', shortLabel: '三', value: 3 },
    { label: '周四', shortLabel: '四', value: 4 },
    { label: '周五', shortLabel: '五', value: 5 },
    { label: '周六', shortLabel: '六', value: 6 },
    { label: '周日', shortLabel: '日', value: 0 }
  ]

  const responsiveWeekdayOptions = computed(() => {
    return staticWeekdayOptions.map(opt => ({
      value: opt.value,
      label: isSmallScreen.value ? opt.shortLabel : opt.label
    }))
  })

  const shutdownTimes = ref<ShutdownTime[]>([])

  const getWeekdaySummary = (weekdays: number[]): string => {
    if (!weekdays || weekdays.length === 0) return '不重复'
    if (weekdays.length === 7) return '每天'

    const daySet = new Set(weekdays)
    if (daySet.size === 5 && [1, 2, 3, 4, 5].every(d => daySet.has(d))) {
      return '工作日'
    }
    if (daySet.size === 2 && [0, 6].every(d => daySet.has(d))) {
      return '周末'
    }

    const dayMap = new Map(
      staticWeekdayOptions.map(opt => [opt.value, isSmallScreen.value ? opt.shortLabel : opt.label])
    )
    const displayOrder = [1, 2, 3, 4, 5, 6, 0]

    return displayOrder
      .filter(dayValue => daySet.has(dayValue))
      .map(dayValue => dayMap.get(dayValue))
      .join(', ')
  }

  const addShutdownTime = () => {
    const newIndex = shutdownTimes.value.length
    shutdownTimes.value.push({
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      weekdays: [1, 2, 3, 4, 5],
      active: true
    })
    saveConfig()
    startEditing(newIndex)
  }

  const removeShutdownTime = (index: number) => {
    ElMessageBox.confirm('确定要删除这个关机计划吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        shutdownTimes.value.splice(index, 1)
        if (editingIndex.value === index) {
          editingIndex.value = null
        } else if (editingIndex.value !== null && editingIndex.value > index) {
          editingIndex.value -= 1
        }
        saveConfig()
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
      })
      .catch(() => {})
  }

  const toggleWeekday = (item: ShutdownTime, day: number) => {
    if (!item.active) return

    const index = item.weekdays.indexOf(day)
    if (index > -1) {
      item.weekdays.splice(index, 1)
    } else {
      item.weekdays.push(day)
    }
    saveConfig()
  }

  const saveConfig = async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      const serializableConfig = {
        shutdownTimes: shutdownTimes.value.map(time => ({
          time: time.time,
          weekdays: [...time.weekdays],
          active: time.active
        }))
      }

      const result = await ipcRenderer.invoke('save-config', serializableConfig)

      if (result) {
        ElMessage({
          message: '设置已保存',
          type: 'success',
          duration: 1000
        })
      } else {
        ElMessage.error('保存失败')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      ElMessage.error('保存失败')
    }
  }

  const loadConfig = async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      const config = await ipcRenderer.invoke('get-config')

      if (config && config.shutdownTimes) {
        shutdownTimes.value = config.shutdownTimes.map((time: any) => ({
          ...time,
          active: time.active !== undefined ? time.active : true
        }))
        editingIndex.value = null
      }
    } catch (error) {
      console.error('Error loading config:', error)
      ElMessage.error('加载配置失败')
    }
  }

  const isLoading = ref(true)

  const handleResize = (e: MediaQueryListEvent) => {
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

<style scoped>
  .shutdown-list-enter-active,
  .shutdown-list-leave-active {
    transition: all 0.5s ease;
  }
  .shutdown-list-enter-from,
  .shutdown-list-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }

  .view-switch-enter-active,
  .view-switch-leave-active {
    transition: all 0.2s ease-in-out;
  }
  .view-switch-enter-from,
  .view-switch-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
</style>
