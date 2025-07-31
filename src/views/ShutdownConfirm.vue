<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { onMounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
import { getConfig } from '../utils/ipc/'

// 背景配置
const backgroundConfig = ref<BackgroundConfig>({
  type: 'css',
  cssEffect: 'aurora',
  opacity: 0.8,
  speed: 1,
  colors: ['#7877c6', '#4f46e5', '#06b6d4'],
})

const isConfigLoaded = ref(false)

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
  finally {
    isConfigLoaded.value = true
  }
}

onMounted(async () => {
  await loadBackgroundConfig()
})
</script>

<template>
  <div class="background">
    <BackgroundEffect
      v-if="isConfigLoaded"
      :config="backgroundConfig"
    />
    <div v-else class="absolute inset-0 bg-black" />
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

background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
