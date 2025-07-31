<script setup lang="ts">
import type { BackgroundConfig } from '../../types/interfaces'
import { ElButton, ElColorPicker, ElDivider, ElFormItem, ElMessage, ElOption, ElSelect } from 'element-plus'
import { ref, watch } from 'vue'

// 定义props，使用v-model来双向绑定配置
const props = defineProps<{
  config: BackgroundConfig
}>()

const emit = defineEmits(['update:config'])

// 内部响应式变量，用于修改prop的值
const internalConfig = ref<BackgroundConfig>(props.config)

// 监听props.config变化，同步到internalConfig
watch(() => props.config, (newVal) => {
  internalConfig.value = newVal
}, { deep: true })

// 监听internalConfig变化，并发出更新事件
watch(internalConfig, (newVal) => {
  emit('update:config', newVal)
}, { deep: true })

// CSS 效果选项
const cssEffectOptions = [
  { label: '极光效果', value: 'aurora' },
  { label: '渐变效果', value: 'gradient' },
  { label: '粒子效果', value: 'particles' },
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

// 应用预设
function applyPreset(preset: any) {
  // 更新内部配置，会触发watch并emit更新到父组件
  internalConfig.value = { ...internalConfig.value, ...preset.config }
  ElMessage.success(`已应用预设：${preset.name}`)
}

// 添加颜色
function addColor() {
  if (!internalConfig.value.colors)
    internalConfig.value.colors = []
  internalConfig.value.colors.push('#ffffff')
}

// 移除颜色
function removeColor(index: number) {
  if (internalConfig.value.colors && internalConfig.value.colors.length > 1) {
    internalConfig.value.colors.splice(index, 1)
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <ElFormItem label="效果类型" class="mb-0">
      <ElSelect v-model="internalConfig.cssEffect" placeholder="选择CSS效果" class="w-full">
        <ElOption v-for="option in cssEffectOptions" :key="option.value" :label="option.label" :value="option.value" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="颜色配置" class="mb-0">
      <div class="w-full space-y-4">
        <div v-for="(_, index) in internalConfig.colors" :key="index" class="flex items-center gap-4">
          <ElColorPicker v-model="internalConfig.colors![index]" size="large" />
          <div class="min-w-0 flex-1">
            <span class="text-sm text-gray-600 font-medium">颜色 {{ index + 1 }}</span>
          </div>
          <ElButton
            v-if="internalConfig.colors!.length > 1"
            type="danger"
            text
            size="small"
            @click="removeColor(index)"
          >
            移除
          </ElButton>
        </div>
        <ElButton
          type="primary"
          text
          class="w-full md:w-auto"
          size="small"
          @click="addColor"
        >
          <span class="i-carbon-add mr-1 inline-block" />
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
</template>

<style scoped>
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

.el-color-picker {
  border: none;
  --el-color-picker-width: 40px;
  --el-color-picker-height: 40px;
}
</style>
