<script setup lang="ts">
import type { BackgroundConfig } from '../../types/interfaces'
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ config: BackgroundConfig }>()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  let particles: any[] = []
  const particleCount = 80
  const connectDistance = 100 // 粒子连接距离

  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    particles = []
    // 创建粒子
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5 * (props.config.speed || 1),
        vy: (Math.random() - 0.5) * 0.5 * (props.config.speed || 1),
        radius: Math.random() * 2 + 1,
      })
    }
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制粒子
    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      // 边界环绕
      if (p.x < 0)
        p.x = canvas.width
      if (p.x > canvas.width)
        p.x = 0
      if (p.y < 0)
        p.y = canvas.height
      if (p.y > canvas.height)
        p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${props.config.opacity || 0.8})`
      ctx.fill()
    })

    // 绘制连接线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < connectDistance) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / connectDistance) * (props.config.opacity || 0.8) * 0.5})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate)
  }

  resizeCanvas()
  animate()
  window.addEventListener('resize', resizeCanvas)
  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', resizeCanvas)
  })
})
</script>

<template>
  <canvas ref="canvasRef" class="absolute inset-0" />
</template>
