<script setup lang="ts">
import type { BackgroundConfig, LocalVideoInfo } from '../types/interfaces'
import { ElButton, ElCard, ElDivider, ElForm, ElFormItem, ElMessage, ElRadio, ElRadioGroup } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'
import CssManager from './background/CssManager.vue'
import VideoManager from './background/VideoManager.vue'

// 背景配置响应式引用
const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

// 加载状态
const isLoading = ref(false)
// 防抖计时器
let debounceTimer: number | undefined

// 视频管理相关状态
const selectedVideoKey = ref<string>('')

// 背景类型选项
const backgroundTypeOptions = [
  { label: 'CSS动效', value: 'css' },
  { label: '视频背景', value: 'video' },
]

// 加载配置
async function loadConfig() {
  isLoading.value = true
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data?.shutdownBackground) {
      // 合并加载的配置，避免覆盖默认值
      backgroundConfig.value = { ...backgroundConfig.value, ...result.data.shutdownBackground }
    }
  }
  catch (error) {
    console.error('Failed to load background config:', error)
    ElMessage.error('加载配置失败')
  }
  finally {
    isLoading.value = false
  }
}

// 保存配置
async function saveBackgroundConfig(silent = false) {
  isLoading.value = true
  try {
    const result = await getConfig({ silent: true })
    const currentConfig = result.success ? result.data : {}
    // 更新 shutdownBackground 部分
    const newConfig = { ...currentConfig, shutdownBackground: backgroundConfig.value }
    const saveResult = await saveConfig(newConfig, { silent: true })

    if (saveResult.success) {
      if (!silent)
        ElMessage.success('背景配置保存成功')
    }
    else {
      if (!silent)
        ElMessage.error('保存配置失败')
    }
  }
  catch (error) {
    console.error('Failed to save background config:', error)
    if (!silent)
      ElMessage.error('保存配置失败')
  }
  finally {
    isLoading.value = false
  }
}

// 重置为默认配置
function resetToDefault() {
  backgroundConfig.value = {
    type: 'css',
    cssEffect: 'aurora',
    opacity: 0.8,
    speed: 1,
    colors: ['#7877c6', '#4f46e5', '#06b6d4'],
  }
  ElMessage.success('已重置为默认配置')
}

// ==================== 视频管理相关方法 ====================

// 选择视频作为背景的回调
function selectVideo(video: LocalVideoInfo) {
  backgroundConfig.value.type = 'video'
  backgroundConfig.value.videoPath = video.path
  selectedVideoKey.value = video.key
  ElMessage.success(`已选择视频：${video.displayName}`)
}

// 删除视频后的处理
function handleVideoDeleted(videoKey: string) {
  // 如果删除的是当前选中的视频，清空选择
  if (backgroundConfig.value.videoPath?.includes(videoKey)) {
    backgroundConfig.value.videoPath = ''
    backgroundConfig.value.type = 'css' // 切换回CSS背景
    selectedVideoKey.value = ''
  }
}

// 深度监听 backgroundConfig 变化并防抖保存
watch(backgroundConfig, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    saveBackgroundConfig(true) // 静默保存
  }, 1000)
}, { deep: true })

// 组件挂载时加载配置
onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="background-settings-modern">
    <ElCard class="settings-card" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold">
            关机页背景设置
          </h3>
          <div class="flex gap-2">
            <ElButton type="primary" @click="() => saveBackgroundConfig(false)">
              保存配置
            </ElButton>
            <ElButton @click="resetToDefault">
              重置为默认
            </ElButton>
          </div>
        </div>
      </template>

      <ElForm :model="backgroundConfig" label-position="top" class="space-y-6">
        <ElFormItem label="背景类型" class="mb-0">
          <ElRadioGroup v-model="backgroundConfig.type" class="w-full">
            <ElRadio v-for="option in backgroundTypeOptions" :key="option.value" :value="option.value" class="mr-4">
              {{ option.label }}
            </ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <CssManager v-if="backgroundConfig.type === 'css'" v-model:config="backgroundConfig" />

        <div v-if="backgroundConfig.type === 'video'" class="space-y-6">
          <ElDivider content-position="left">
            视频管理
          </ElDivider>

          <VideoManager
            :selected-video-key="selectedVideoKey"
            @video-selected="selectVideo"
            @video-deleted="handleVideoDeleted"
          />
        </div>

        <ElDivider content-position="left" class="mt-8">
          通用设置
        </ElDivider>
        <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <ElFormItem label="背景不透明度">
            <ElSlider v-model="backgroundConfig.opacity" :min="0.1" :max="1" :step="0.05" :format-tooltip="(val: number) => `${Math.round(val * 100)}%`" />
          </ElFormItem>
          <ElFormItem label="动画速度">
            <ElSlider v-model="backgroundConfig.speed" :min="0.1" :max="3" :step="0.1" :format-tooltip="(val: number) => `${val}x`" />
          </ElFormItem>
        </div>
      </ElForm>
    </ElCard>
  </div>
</template>

<style scoped>
.background-settings-modern {
  max-width: 800px;
  margin: auto;
}

.settings-card {
  border: none;
}

.el-form--label-top .el-form-item {
  margin-bottom: 0;
}

.mt-8 {
  margin-top: 2rem;
}
</style>
