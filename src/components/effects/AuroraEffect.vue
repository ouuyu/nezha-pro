<script setup lang="ts">
import type { BackgroundConfig } from '../../types/interfaces'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ config: BackgroundConfig }>()

const layerCount = 4

const layers = ref(
  Array.from({ length: layerCount }, (_, i) => ({
    id: i + 1,
    x: (Math.random() - 0.5) * 100,
    y: (Math.random() - 0.5) * 100,
    scale: Math.random() * 0.6 + 0.7,
    opacity: Math.random() * 0.3 + 0.5,
  })),
)

const colorList = computed(() => props.config.colors || ['#7877c6', '#4f46e5', '#06b6d4', '#8b5cf6'])

function getColor(index: number) {
  return colorList.value[index % colorList.value.length]
}

const style = computed(() => ({
  '--base-opacity': props.config.opacity ?? 0.7,
}))

let animationFrameId: number
let lastTime = 0
const targetFPS = 30
const interval = 1000 / targetFPS

function animate(currentTime: number) {
  if (currentTime - lastTime >= interval) {
    layers.value.forEach((layer) => {
      const deltaX = (Math.random() - 0.5) * 0.5
      const deltaY = (Math.random() - 0.5) * 0.5
      layer.x = (layer.x + deltaX) % 100
      layer.y = (layer.y + deltaY) % 100

      const deltaScale = (Math.random() - 0.5) * 0.01
      layer.scale = Math.max(0.5, Math.min(1.5, layer.scale + deltaScale))

      const deltaOpacity = (Math.random() - 0.5) * 0.01
      layer.opacity = Math.max(0.3, Math.min(0.9, layer.opacity + deltaOpacity))
    })
    lastTime = currentTime
  }

  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  setTimeout(() => {
    layers.value.forEach((layer) => {
      layer.x = (Math.random() - 0.5) * 100
      layer.y = (Math.random() - 0.5) * 100
    })
  }, 100)

  animationFrameId = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="aurora-effect" :style="style">
    <div
      v-for="(layer, index) in layers"
      :key="layer.id"
      class="aurora-layer"
      :style="{
        transform: `translate3d(${layer.x}%, ${layer.y}%, 0) scale(${layer.scale})`,
        opacity: layer.opacity,
        background: `radial-gradient(ellipse at 50% 50%, ${getColor(index)} 0%, transparent 70%)`,
      }"
    />
  </div>
</template>

<style scoped>
.aurora-effect {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: transparent;
}

.aurora-layer {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  mix-blend-mode: screen;
  will-change: transform, opacity;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: blur(70px);
}
</style>
