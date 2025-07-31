<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { nextTick, onMounted, ref } from 'vue'
import BackgroundEffect from '../components/BackgroundEffect.vue'
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
const showCrackEffect = ref(false)

const pieceRefs = Array.from({ length: 6 }).map(() => ref<HTMLElement | null>(null))

const pieceConfigs = [
  { x: -100, y: -100, rot: -30 },
  { x: 0, y: -150, rot: 0 },
  { x: 100, y: -100, rot: 30 },
  { x: -100, y: 100, rot: 30 },
  { x: 0, y: 150, rot: 0 },
  { x: 100, y: 100, rot: -30 },
]
const animDuration = 1500

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

async function handleUnlock() {
  try {
    showCrackEffect.value = true
    await nextTick()

    const animationPromises: Promise<Animation>[] = []

    pieceConfigs.forEach((cfg, idx) => {
      const el = pieceRefs[idx].value
      if (el) {
        const animation = el.animate(
          [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${cfg.x}px, ${cfg.y}px) rotate(${cfg.rot}deg)`, opacity: 0 },
          ],
          { duration: animDuration, easing: 'ease-out', fill: 'forwards' },
        )
        animationPromises.push(animation.finished)
      }
    })

    await Promise.all(animationPromises)
    await updateShutdownStats('canceled')
    await cancelShutdown({ showSuccessMessage: true, successMessage: '关机已取消' })
  }
  catch (error) {
    console.error('在解锁动画或取消关机过程中发生错误:', error)
  }
}

onMounted(loadBackgroundConfig)
</script>

<template>
  <div class="background-container">
    <div>
      <BackgroundEffect v-if="isConfigLoaded" :config="backgroundConfig" />
      <div v-else class="absolute inset-0 bg-black" />
    </div>

    <div v-if="showCrackEffect" class="crack-overlay">
      <div
        v-for="(_, i) in 6"
        :key="i"
        :ref="(el) => { pieceRefs[i].value = el as HTMLElement | null }"
        class="crack-piece"
      >
        <BackgroundEffect :config="backgroundConfig" />
      </div>
    </div>

    <div
      class="slider-container"
      :class="{ 'opacity-0': showCrackEffect }"
    >
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

.crack-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.crack-piece {
  position: absolute;
  overflow: hidden;
  width: 30%;
  height: 40%;
}

.crack-piece:nth-child(1) { top: 0; left: 0; }
.crack-piece:nth-child(2) { top: 0; left: 35%; width:30%; height:30%; }
.crack-piece:nth-child(3) { top: 0; right: 0; }
.crack-piece:nth-child(4) { bottom: 0; left: 0; }
.crack-piece:nth-child(5) { bottom: 0; left: 35%; width:30%; height:30%; }
.crack-piece:nth-child(6) { bottom: 0; right: 0; }

.slider-container {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 0.5s ease-out;
  z-index: 1000;
}
</style>
