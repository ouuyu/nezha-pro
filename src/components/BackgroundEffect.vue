<script setup lang="ts">
import type { BackgroundConfig } from '../types/interfaces'
import { computed } from 'vue'

// 导入所有效果组件
import AuroraEffect from './effects/AuroraEffect.vue'
import GradientWavesEffect from './effects/GradientWavesEffect.vue'
import MatrixEffect from './effects/MatrixEffect.vue'
import ParticlesEffect from './effects/ParticlesEffect.vue'

// 接收配置
const props = withDefaults(defineProps<{ config?: BackgroundConfig }>(), {
  config: () => ({
    type: 'css',
    cssEffect: 'aurora',
    opacity: 0.8,
    speed: 1,
    colors: ['#7877c6', '#4f46e5', '#06b6d4'],
  }),
})

// 根据 config.cssEffect 动态计算要渲染的组件
const activeEffectComponent = computed(() => {
  switch (props.config.cssEffect) {
    case 'aurora':
      return AuroraEffect
    case 'particles':
      return ParticlesEffect
    case 'matrix':
      return MatrixEffect
    case 'gradient':
    case 'waves':
      return GradientWavesEffect
    default:
      return AuroraEffect
  }
})
</script>

<template>
  <div class="dynamic-background-wrapper">
    <component :is="activeEffectComponent" :config="props.config" />
  </div>
</template>

<style scoped>
.dynamic-background-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: #000; /* 提供一个黑色基底 */
}
</style>
