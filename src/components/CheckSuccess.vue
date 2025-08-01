<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { nextTick, onMounted, ref } from 'vue'

const emit = defineEmits(['done'])
const checkPath = ref<SVGPathElement | null>(null)
const fading = ref(false)

onMounted(async () => {
  await nextTick()
  if (checkPath.value) {
    const path = checkPath.value
    const length = path.getTotalLength()
    path.style.transition = 'none'
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`
    path.getBoundingClientRect()
    path.style.transition = 'stroke-dashoffset 1.2s ease-in-out'
    path.style.strokeDashoffset = '0'
  }

  useTimeoutFn(() => {
    fading.value = true
  }, 1800)
})

function emitDone() {
  emit('done')
}
</script>

<template>
  <div
    class="success-overlay"
    :class="{ 'fade-out': fading }"
    @animationend="emitDone"
  >
    <div class="black-bg" />

    <svg
      class="checkmark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
    >
      <circle
        class="checkmark-circle"
        cx="26"
        cy="26"
        r="24"
        fill="none"
      />
      <path
        ref="checkPath"
        class="checkmark-path"
        fill="none"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.success-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  pointer-events: none;
}

.black-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  z-index: -1;
  will-change: transform, opacity;
  animation: blackIn-optimized 0.7s cubic-bezier(0.3, 1.1, 0.7, 1) forwards;
}

.checkmark {
  width: 120px;
  height: 120px;
  stroke: #00FF99;
  stroke-width: 3;
  stroke-miterlimit: 10;
  animation: checkPop 0.6s cubic-bezier(0.3, 1.1, 0.7, 1) 0.2s backwards;
  transform-origin: center;
}

.checkmark-circle {
  stroke-dasharray: 157.08;
  stroke-dashoffset: 157.08;
  stroke: #00FF99;
  animation: circleStroke 0.6s ease-out 0.2s forwards;
  stroke-linecap: round;
}

.checkmark-path {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #00FF99;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes blackIn-optimized {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes checkPop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  80% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes circleStroke {
  to {
    stroke-dashoffset: 0;
  }
}

.fade-out {
  animation: fadeOut 0.6s ease forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}
</style>
