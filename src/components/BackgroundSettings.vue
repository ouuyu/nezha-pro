<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { ElButton, ElCard, ElColorPicker, ElDivider, ElForm, ElFormItem, ElMessage, ElOption, ElSelect, ElSlider } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

// 背景配置响应式引用 (已精简)
const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

const isLoading = ref(false)
let debounceTimer: number | undefined

// CSS 效果选项
const cssEffectOptions = [
  { label: '极光效果', value: 'aurora' },
  { label: '渐变效果', value: 'gradient' },
  { label: '粒子效果', value: 'particles' },
  { label: '波浪效果', value: 'waves' },
  { label: '矩阵效果', value: 'matrix' },
]

// 预设配置
const presetConfigs = [
  {
    name: '经典极光',
    config: { type: 'css', cssEffect: 'aurora', opacity: 0.8, speed: 1, colors: ['#7877c6', '#4f46e5', '#06b6d4'] },
  },
  {
    name: '科技矩阵',
    config: { type: 'css', cssEffect: 'matrix', opacity: 0.6, speed: 1.5, colors: ['#00ff00'] },
  },
  {
    name: '粒子星空',
    config: { type: 'css', cssEffect: 'particles', opacity: 0.7, speed: 0.8, colors: ['#7877c6', '#4f46e5'] },
  },
  {
    name: '彩虹渐变',
    config: { type: 'css', cssEffect: 'gradient', opacity: 0.9, speed: 2, colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'] },
  },
]

// 加载配置
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

// 保存配置
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

// 应用预设
function applyPreset(preset: any) {
  backgroundConfig.value = { ...backgroundConfig.value, ...preset.config }
  ElMessage.success(`已应用预设：${preset.name}`)
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

// 添加颜色
function addColor() {
  if (!backgroundConfig.value.colors)
    backgroundConfig.value.colors = []
  backgroundConfig.value.colors.push('#ffffff')
}

// 移除颜色
function removeColor(index: number) {
  if (backgroundConfig.value.colors && backgroundConfig.value.colors.length > 1) {
    backgroundConfig.value.colors.splice(index, 1)
  }
}

// 监听配置变化，实现防抖自动保存
watch(backgroundConfig, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    saveBackgroundConfig(true) // 静默保存
  }, 1000)
}, { deep: true })

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
            <ElButton type="primary" :loading="isLoading" @click="() => saveBackgroundConfig(false)">
              保存配置
            </ElButton>
            <ElButton @click="resetToDefault">
              重置为默认
            </ElButton>
          </div>
        </div>
      </template>

      <ElForm :model="backgroundConfig" label-position="top">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ElFormItem label="效果类型">
            <ElSelect v-model="backgroundConfig.cssEffect" placeholder="选择CSS效果" class="w-full">
              <ElOption v-for="option in cssEffectOptions" :key="option.value" :label="option.label" :value="option.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="颜色配置">
            <div class="w-full flex flex-col gap-3">
              <div v-for="(_, index) in backgroundConfig.colors" :key="index" class="flex items-center gap-3">
                <ElColorPicker v-model="backgroundConfig.colors![index]" />
                <span class="text-sm text-gray-500">颜色 {{ index + 1 }}</span>
                <ElButton v-if="backgroundConfig.colors!.length > 1" type="danger" text @click="removeColor(index)">
                  移除
                </ElButton>
              </div>
              <ElButton type="primary" text class="self-start" @click="addColor">
                添加颜色
              </ElButton>
            </div>
          </ElFormItem>
        </div>

        <ElDivider content-position="left" class="mt-8">
          一键应用预设
        </ElDivider>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div v-for="preset in presetConfigs" :key="preset.name" class="preset-card" @click="applyPreset(preset)">
            <div
              class="preset-preview"
              :style="{ background: `linear-gradient(45deg, ${preset.config.colors.join(', ')})` }"
            />
            <div class="mt-2 text-center">
              <div class="font-medium">
                {{ preset.name }}
              </div>
              <div class="text-xs text-gray-500">
                点击应用
              </div>
            </div>
          </div>
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

.preset-card {
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preset-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-2px);
}

.preset-preview {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  background-color: #f0f2f5;
}

.el-form--label-top .el-form-item {
  margin-bottom: 20px;
}

.mt-8 {
  margin-top: 2rem;
}
</style>
