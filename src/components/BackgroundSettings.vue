<script setup lang="ts">
import type { BackgroundConfig, LocalVideoInfo } from '../types/interfaces'
import { ElButton, ElCard, ElDivider, ElForm, ElFormItem, ElMessage, ElRadio, ElRadioGroup, ElSlider } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc/'
import CssManager from './background/CssManager.vue'
import VideoManager from './background/VideoManager.vue'

const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

const isLoading = ref(false)
let debounceTimer: number | undefined

const selectedVideoKey = ref<string>('')

const backgroundTypeOptions = [
  { label: 'CSS动效', value: 'css' },
  { label: '视频背景', value: 'video' },
]

async function loadConfig() {
  isLoading.value = true
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data?.shutdownBackground) {
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

async function saveBackgroundConfig(silent = false) {
  isLoading.value = true
  try {
    const result = await getConfig({ silent: true })
    const currentConfig = result.success ? result.data : {}
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

function selectVideo(video: LocalVideoInfo) {
  backgroundConfig.value.type = 'video'
  backgroundConfig.value.videoPath = video.path
  selectedVideoKey.value = video.key
  ElMessage.success(`已选择视频：${video.displayName}`)
}

function handleVideoDeleted(videoKey: string) {
  if (backgroundConfig.value.videoPath?.includes(videoKey)) {
    backgroundConfig.value.videoPath = ''
    backgroundConfig.value.type = 'css'
    selectedVideoKey.value = ''
  }
}

watch(backgroundConfig, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    saveBackgroundConfig(true)
  }, 1000)
}, { deep: true })

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="m-auto max-w-800px">
    <ElCard class="border-none" shadow="never">
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
