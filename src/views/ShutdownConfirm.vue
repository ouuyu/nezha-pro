<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { onMounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
import { getConfig } from '../utils/ipc'

// 背景配置
const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

// 加载配置
async function loadBackgroundConfig() {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data?.shutdownBackground) {
      backgroundConfig.value = { ...backgroundConfig.value, ...result.data.shutdownBackground }
    }
  }
  catch (error) {
    console.warn('Failed to load background config:', error)
  }
}

onMounted(async () => {
  await loadBackgroundConfig()
})
</script>

<template>
  <div class="fixed inset-0 z-9999 flex select-none items-center justify-center overflow-hidden text-white font-sans">
    <!-- 动态背景 -->
    <BackgroundEffect
      :config="backgroundConfig"
    />
  </div>
</template>

<style scoped>
.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

::-webkit-scrollbar {
  display: none;
}

* {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}
</style>
