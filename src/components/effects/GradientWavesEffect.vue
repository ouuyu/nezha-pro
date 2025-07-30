<script setup lang="ts">
import type { BackgroundConfig } from '../../types/interfaces'
import { computed } from 'vue'

const props = defineProps<{ config: BackgroundConfig }>()

// 生成彩虹渐变
const rainbowGradient = computed(() => {
  const colors = props.config.colors?.length
    ? props.config.colors
    : ['#ff0000', '#ff8000']

  const gradientPoints: string[] = []
  const step = 100 / (colors.length - 1)

  colors.forEach((color, index) => {
    const position = index * step
    gradientPoints.push(`${color} ${position}%`)
    if (index < colors.length - 1) {
      const nextColor = colors[index + 1]
      gradientPoints.push(`${nextColor} ${position + step * 0.5}%`)
    }
  })

  return gradientPoints.join(', ')
})

// 动画速度
const speed = computed(() => 12 / (props.config.speed || 1))

// 透明度
const opacity = computed(() => props.config.opacity ?? 0.9)
</script>

<template>
  <div
    class="optimized-rainbow"
    :style="{
      '--rainbow-gradient': `linear-gradient(135deg, ${rainbowGradient})`,
      '--speed': `${speed}s`,
      '--opacity': opacity,
    }"
  />
</template>

<style scoped>
.optimized-rainbow {
  position: absolute;
  inset: 0;
  background: var(--rainbow-gradient);
  background-size: 300% 300%;
  opacity: var(--opacity);
  z-index: 0;
  will-change: background-position;
  animation: flow-gradient var(--speed) ease infinite;
}

@keyframes flow-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
