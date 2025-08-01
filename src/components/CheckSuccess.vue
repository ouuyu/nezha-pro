<script setup lang="ts">
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'done'): void
}>()

const checkPath = ref<SVGPathElement | null>(null)
const checkCircle = ref<SVGCircleElement | null>(null)
const fading = ref(false)

onMounted(() => {
  // Use requestAnimationFrame to ensure animations start after DOM is ready
  requestAnimationFrame(() => {
    if (checkPath.value && checkCircle.value) {
      const path = checkPath.value
      const circle = checkCircle.value
      const pathLength = path.getTotalLength()
      const circleLength = circle.getTotalLength()

      // Set initial styles in one go to avoid reflow
      path.style.strokeDasharray = `${pathLength}`
      path.style.strokeDashoffset = `${pathLength}`
      circle.style.strokeDasharray = `${circleLength}`
      circle.style.strokeDashoffset = `${circleLength}`

      // Trigger animation in the next frame
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        circle.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        path.style.strokeDashoffset = '0'
        circle.style.strokeDashoffset = '0'
      })
    }

    // Trigger fade-out after animations complete
    setTimeout(() => {
      fading.value = true
    }, 1200)
  })
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
        ref="checkCircle"
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
  will-change: opacity;
}

.black-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  will-change: opacity, transform;
  animation: blackIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.checkmark {
  width: 100px;
  height: 100px;
  stroke: #00FF99;
  stroke-width: 3;
  will-change: transform, opacity;
  animation: checkPop 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.checkmark-circle,
.checkmark-path {
  stroke: #00FF99;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes blackIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes checkPop {
  0% {
    transform: scale(0.8) rotate(-5deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.05) rotate(2deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.fade-out {
  animation: fadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
