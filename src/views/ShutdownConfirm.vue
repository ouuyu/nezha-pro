<script setup lang="ts">
import type { BackgroundConfig, KnowledgeItem } from '../types'
import { onMounted, onUnmounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
import CheckSuccess from '../components/CheckSuccess.vue'
import KnowledgeDisplay from '../components/KnowledgeDisplay.vue'
import SlideToUnlock from '../components/SlideToUnlock.vue'
import { cancelShutdown, getConfig } from '../utils/ipc/'
import { updateShutdownStats } from '../utils/shutdownStats'

// 配置和状态
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

// 倒计时相关
const countdown = ref(60)
const countdownInterval = ref<number | null>(null)

onMounted(async () => {
  try {
    const result = await getConfig({ silent: true })
    if (result.success && result.data) {
      if (result.data?.shutdownBackground) {
        backgroundConfig.value = { ...backgroundConfig.value, ...result.data.shutdownBackground }
      }
      knowledgeItems.value = result.data.knowledgeBase || []
    }
    startCountdown()
  }
  catch (err) {
    console.warn('Failed to load config:', err)
  }
  finally {
    isConfigLoaded.value = true
  }
})

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})

function startCountdown() {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }

  countdownInterval.value = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    }
    else {
      handleShutdown()
    }
  }, 1000) as unknown as number
}

async function handleShutdown() {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  try {
    await updateShutdownStats('executed')
    // Placeholder for actual shutdown logic
  }
  catch (err) {
    console.error('Shutdown failed:', err)
  }
}

async function handleUnlock() {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
  showSuccess.value = true
  await new Promise(resolve => setTimeout(resolve, 3000))
  try {
    await updateShutdownStats('canceled')
    await cancelShutdown({ showSuccessMessage: true, successMessage: 'Shutdown canceled' })
  }
  catch (err) {
    console.error('Cancel shutdown failed:', err)
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
        <SlideToUnlock :countdown-value="countdown" @unlock="handleUnlock" />
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 5rem;
  transition: opacity 0.5s ease;
  z-index: 1000;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
  }
}
</style>
