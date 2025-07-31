<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { Delete, Plus } from '@element-plus/icons-vue' // 导入图标
import { ElButton, ElCard, ElColorPicker, ElFormItem, ElMessage, ElOption, ElSelect, ElSlider } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

const defaultConfig: BackgroundConfig = {
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
}

const presets = [
  { name: '经典极光', config: defaultConfig },
  { name: '科技矩阵', config: { ...defaultConfig, cssEffect: 'matrix', opacity: 0.6, speed: 1.5, colors: ['#00ff00'] } },
  { name: '粒子星空', config: { ...defaultConfig, cssEffect: 'particles', opacity: 0.7, speed: 0.8, colors: ['#7877c6', '#4f46e5'] } },
  { name: '彩虹渐变', config: { ...defaultConfig, cssEffect: 'gradient', opacity: 0.9, speed: 2, colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'] } },
]

const config = ref<BackgroundConfig>({ ...defaultConfig })

async function loadConfig() {
  const res = await getConfig({ silent: true })
  if (res?.success && res.data?.shutdownBackground)
    Object.assign(config.value, res.data.shutdownBackground)
}

async function save() {
  const res = await getConfig({ silent: true })
  await saveConfig({ ...res.data, shutdownBackground: config.value }, { silent: true })
}

watch(() => config.value, save, { deep: true })

function resetDefault() {
  Object.assign(config.value, defaultConfig)
  save()
  ElMessage.success('已重置默认')
}

function applyPreset(p: typeof presets[0]) {
  Object.assign(config.value, p.config)
  save()
  ElMessage.success(`已应用预设：${p.name}`)
}

const addColor = () => config.value.colors.push('#ffffff')
const removeColor = (i: number) => config.value.colors.length > 1 && config.value.colors.splice(i, 1)

onMounted(loadConfig)
</script>

<template>
  <div class="mx-auto max-w-3xl p-4">
    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            关机背景设置
          </h2>
          <ElButton text @click="resetDefault">
            重置
          </ElButton>
        </div>
      </template>

      <ElFormItem label="背景效果">
        <ElSelect v-model="config.cssEffect">
          <ElOption label="极光" value="aurora" />
          <ElOption label="渐变" value="gradient" />
          <ElOption label="粒子" value="particles" />
          <ElOption label="矩阵" value="matrix" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="背景颜色">
        <div class="color-picker-group">
          <div v-for="(color, i) in config.colors" :key="i" class="color-picker-wrapper">
            <ElColorPicker v-model="config.colors[i]" size="default" />
            <ElButton v-if="config.colors.length > 1" class="delete-btn" :icon="Delete" circle text type="danger" @click="removeColor(i)" />
          </div>
          <ElButton :icon="Plus" text @click="addColor" />
        </div>
      </ElFormItem>

      <ElFormItem label="不透明度">
        <ElSlider v-model="config.opacity" :min="0.1" :max="1" :step="0.05" />
      </ElFormItem>

      <ElFormItem label="动画速度">
        <ElSlider v-model="config.speed" :min="0.1" :max="3" :step="0.1" />
      </ElFormItem>

      <div class="grid grid-cols-2 mt-6 gap-4 md:grid-cols-4">
        <div
          v-for="p in presets"
          :key="p.name"
          class="cursor-pointer border rounded p-3 hover:shadow"
          @click="applyPreset(p)"
        >
          <div class="h-12 rounded" :style="{ background: `linear-gradient(45deg, ${p.config.colors.join(',')})` }" />
          <div class="mt-1 text-center text-sm">
            {{ p.name }}
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.color-picker-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.color-picker-wrapper {
  position: relative;
  transition: all 0.2s ease;
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.color-picker-wrapper:hover .delete-btn {
  visibility: visible;
  opacity: 1;
}
</style>
