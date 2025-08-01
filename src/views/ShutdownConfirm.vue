<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { onMounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
import CheckSuccess from '../components/CheckSuccess.vue'
import SlideToUnlock from '../components/SlideToUnlock.vue'
import { cancelShutdown, getConfig } from '../utils/ipc/'
import { updateShutdownStats } from '../utils/shutdownStats'

const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

const isConfigLoaded = ref(false)
const showSuccess = ref(false)

onMounted(async () => {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data?.shutdownBackground) {
      backgroundConfig.value = { ...backgroundConfig.value, ...result.data.shutdownBackground }
    }
  }
  catch (err) {
    console.warn('配置读取失败:', err)
  }
  finally {
    isConfigLoaded.value = true
  }
})

async function handleUnlock() {
  showSuccess.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  try {
    await updateShutdownStats('canceled')
    await cancelShutdown({ showSuccessMessage: true, successMessage: '关机已取消' })
  }
  catch (err) {
    console.error('取消关机失败:', err)
  }
}
</script>

<template>
  <div class="background-container">
    <!-- 背景层 -->
    <div class="background-layer">
      <BackgroundEffect v-if="isConfigLoaded" :config="backgroundConfig" />
      <div v-else class="absolute inset-0 bg-black" />
    </div>

    <!-- 成功动画 -->
    <CheckSuccess v-if="showSuccess" />

    <!-- 滑块层 -->
    <div class="slider-container" :class="{ 'opacity-0': showSuccess }">
      <SlideToUnlock @unlock="handleUnlock" />
    </div>
  </div>
</template>

<style scoped>
.background-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.background-layer {
  position: absolute;
  inset: 0;
  transition: filter 0.5s ease;
}

.slider-container {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 0.5s ease;
  z-index: 1000;
}
</style>
