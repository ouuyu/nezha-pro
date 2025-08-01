<script setup lang="ts">
import type { BackgroundConfig, KnowledgeItem } from '../types/interfaces'
import { onMounted, onUnmounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
import CheckSuccess from '../components/CheckSuccess.vue'
import KnowledgeDisplay from '../components/KnowledgeDisplay.vue'
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
const knowledgeItems = ref<KnowledgeItem[]>([])

onMounted(async () => {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data) {
      if (result.data?.shutdownBackground) {
        backgroundConfig.value = { ...backgroundConfig.value, ...result.data.shutdownBackground }
      }
      knowledgeItems.value = result.data.knowledgeBase || []
    }
  }
  catch (err) {
    console.warn('配置读取失败:', err)
  }
  finally {
    isConfigLoaded.value = true
  }
})

onUnmounted(() => {
})

async function handleUnlock() {
  showSuccess.value = true

  await new Promise(resolve => setTimeout(resolve, 3000))

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
  <div class="knowledge-shutdown-container">
    <div class="background-layer">
      <BackgroundEffect v-if="isConfigLoaded" :config="backgroundConfig" />
      <div v-else class="absolute inset-0 bg-black" />
    </div>

    <div class="content-wrapper">
      <div class="knowledge-display" :class="{ 'opacity-0': showSuccess }">
        <KnowledgeDisplay :knowledge-items="knowledgeItems" />
      </div>

      <CheckSuccess v-if="showSuccess" />

      <div class="slider-container" :class="{ 'opacity-0': showSuccess }">
        <SlideToUnlock @unlock="handleUnlock" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-shutdown-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
}

.background-layer {
  position: absolute;
  inset: 0;
  transition: filter 0.5s ease;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90%;
  max-width: 900px;
  height: 100%;
  padding: 2rem;
  z-index: 100;
}

.knowledge-display {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: opacity 0.5s ease;
}

.slider-container {
  margin-top: 5rem;
  transition: opacity 0.5s ease;
  z-index: 1000;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
  }
  .slider-container {
    margin-top: 3rem;
  }
}
</style>
