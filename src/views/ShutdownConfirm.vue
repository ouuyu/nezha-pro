<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SlideToUnlock from '../components/SlideToUnlock.vue' // 假设此组件路径正确
import { cancelShutdown as cancelShutdownIpc, executeShutdown as executeShutdownIpc } from '../utils/ipc' // 假设此 IPC 工具路径正确

const countdown = ref(60)
const isUnlocked = ref(false)
let countdownTimer: number | null = null

// --- 逻辑部分 (保持不变，但为了完整性包含在此) ---

// 倒计时逻辑
function startCountdown() {
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      executeShutdown()
    }
  }, 1000)
}

// 执行关机
async function executeShutdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  try {
    await executeShutdownIpc()
  }
  catch (error) {
    console.error('Failed to execute shutdown:', error)
  }
}

// 取消关机
async function cancelShutdown() {
  isUnlocked.value = true

  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }

  try {
    await cancelShutdownIpc()
    // 延迟2秒后，主进程会关闭此窗口
  }
  catch (error) {
    console.error('Failed to cancel shutdown:', error)
  }
}

// --- 格式化与计算属性 (为动态效果服务) ---

// 格式化倒计时显示
const formattedCountdown = computed(() => {
  const mins = Math.floor(countdown.value / 60)
  const secs = countdown.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

// 计算 SVG 环形进度条的 stroke-dashoffset
const countdownProgress = computed(() => {
  const radius = 90 // SVG circle radius
  const circumference = 2 * Math.PI * radius
  return circumference * (1 - countdown.value / 60)
})

// --- 生命周期钩子 (有微小调整) ---

function handleKeydown(event: KeyboardEvent) {
  if ((event.altKey && event.key === 'F4') || (event.ctrlKey && event.key === 'w') || event.key === 'Escape') {
    event.preventDefault()
  }
}

onMounted(() => {
  startCountdown()
  // 阻止默认事件
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('contextmenu', e => e.preventDefault())
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('contextmenu', e => e.preventDefault()) // 修复了原代码的移除逻辑错误
})
</script>

<template>
  <div class="fixed inset-0 z-9999 flex cursor-none items-center justify-center overflow-hidden text-white font-sans">
    <div
      class="absolute inset-0 transition-all duration-1000 ease-in-out"
      :class="isUnlocked ? 'opacity-0' : 'opacity-100'"
    >
      <div class="absolute inset-0 bg-black" />
      <div class="absolute inset-0 animate-[aurora_8s_ease-in-out_infinite] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
    </div>

    <transition
      enter-active-class="transition-all duration-500 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      enter-from-class="opacity-0 scale-90"
      leave-to-class="opacity-0 scale-90"
    >
      <div v-if="!isUnlocked" class="relative z-10 flex flex-col items-center justify-center text-center">
        <div class="mb-12">
          <div class="i-carbon-power text-5xl text-amber-400/80 drop-shadow-[0_4px_8px_rgba(251,191,36,0.3)]" />
          <h1 class="mt-4 text-5xl font-bold tracking-wider text-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            即将关机
          </h1>
          <p class="mt-2 text-lg text-white/70">
            滑动以取消
          </p>
        </div>

        <div class="relative mb-20 h-52 w-52 flex items-center justify-center">
          <svg class="absolute inset-0 h-full w-full" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" class="stroke-white/10" stroke-width="8" fill="none" />
            <circle
              cx="100"
              cy="100"
              r="90"
              class="stroke-sky-400 transition-all duration-1000 ease-linear"
              stroke-width="8"
              fill="none"
              stroke-linecap="round"
              transform="rotate(-90 100 100)"
              :stroke-dasharray="2 * Math.PI * 90"
              :stroke-dashoffset="countdownProgress"
            />
          </svg>
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 translate-y-2"
            leave-to-class="opacity-0 -translate-y-2"
            mode="out-in"
          >
            <div :key="countdown" class="text-5xl font-bold font-mono text-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {{ formattedCountdown }}
            </div>
          </transition>
        </div>

        <div class="mb-12">
          <SlideToUnlock
            :width="320"
            :height="60"
            text="滑动来取消关机"
            @unlock="cancelShutdown"
          />
        </div>

        <p class="max-w-md animate-pulse rounded-lg bg-red-500/10 p-4 text-sm text-red-300/80 ring-1 ring-red-500/20">
          请保存所有工作，系统将在倒计时结束后自动关闭。
        </p>
      </div>
    </transition>

    <transition
      enter-active-class="transition-all duration-700 ease-in-out"
      enter-from-class="opacity-0"
    >
      <div v-if="isUnlocked" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-emerald-600/95 backdrop-blur-sm">
        <div class="i-carbon-checkmark-outline text-8xl" />
        <h2 class="mt-4 text-4xl font-semibold">
          关机已取消
        </h2>
        <p class="mt-2 text-white/80">
          此窗口即将关闭
        </p>
      </div>
    </transition>
  </div>
</template>

<style>
/* 注入一个全局的极光动画 */
@keyframes aurora {
  0% {
    background-position: 50% 0%;
    background-size: 300% 300%;
  }
  50% {
    background-position: 50% 100%;
    background-size: 350% 350%;
  }
  100% {
    background-position: 50% 0%;
    background-size: 300% 300%;
  }
}
</style>
