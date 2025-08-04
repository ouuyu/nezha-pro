<script setup lang="ts">
import type { BackgroundConfig } from '../../types'
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ config: BackgroundConfig }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 将动画相关的变量放在 setup 作用域，方便跨函数访问
let ctx: CanvasRenderingContext2D | null = null
let columns = 0
let drops: number[] = []
let animationFrameId: number

// 动画循环
function animate() {
  // 确保上下文存在
  if (!ctx || !canvasRef.value)
    return

  // 绘制半透明的黑色背景，形成拖尾效果
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // 设置字体样式和颜色
  const color = props.config.colors?.[0] || '#00ff00'
  const fontSize = 16
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  ctx.fillStyle = color
  ctx.globalAlpha = props.config.opacity || 0.8
  ctx.font = `${fontSize}px monospace`

  // 遍历每一列并绘制字符
  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)]
    ctx.fillText(text, i * fontSize, drops[i] * fontSize)

    // 如果雨滴到达底部，有一定几率重置到顶部
    if (drops[i] * fontSize > canvasRef.value.height && Math.random() > 0.975) {
      drops[i] = 0
    }
    drops[i]++
  }

  // 使用 setTimeout 控制帧率，以应用 speed 配置
  // requestAnimationFrame 本身速度很快，需要节流
  setTimeout(() => {
    animationFrameId = requestAnimationFrame(animate)
  }, 33 / (props.config.speed || 1))
}

// 初始化和重置函数
function init() {
  const canvas = canvasRef.value
  if (!canvas)
    return

  // 获取 2D 上下文
  ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // 设置画布尺寸
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // 根据新尺寸计算列数并重置雨滴数组
  const fontSize = 16
  columns = Math.ceil(canvas.width / fontSize)
  drops = Array.from<number>({ length: columns }).fill(1)
}

// 挂载时启动
onMounted(() => {
  init()
  animate()
  window.addEventListener('resize', init)
})

// 卸载时清理
onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', init)
})
</script>

<template>
  <canvas ref="canvasRef" class="absolute inset-0" />
</template>
