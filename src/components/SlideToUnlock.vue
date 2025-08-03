<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  text?: string
  disabled?: boolean
  width?: number
  height?: number
  countdownValue?: number | null // 新增：接收倒计时值
}

const props = withDefaults(defineProps<Props>(), {
  text: '滑动来取消关机',
  disabled: false,
  width: 300,
  height: 60,
  countdownValue: null,
})

const emit = defineEmits<{
  unlock: []
}>()

const sliderRef = ref<HTMLElement>()
const knobRef = ref<HTMLElement>()
const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const knobPosition = ref(0)

const maxPosition = computed(() => props.width - props.height)

const knobStyle = computed(() => ({
  transform: `translateX(${knobPosition.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s ease',
}))

const progressStyle = computed(() => ({
  width: `${knobPosition.value + props.height}px`,
}))

const isUrgent = computed(() => props.countdownValue && props.countdownValue <= 60)

const textOpacity = computed(() => {
  const progress = knobPosition.value / maxPosition.value
  return Math.max(0.3, 1 - progress * 1.5)
})

function handleStart(event: MouseEvent | TouchEvent) {
  if (props.disabled)
    return

  isDragging.value = true
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  startX.value = clientX - knobPosition.value

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove)
  document.addEventListener('touchend', handleEnd)

  event.preventDefault()
}

function handleMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value)
    return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  currentX.value = clientX - startX.value

  // 限制滑动范围
  knobPosition.value = Math.max(0, Math.min(maxPosition.value, currentX.value))

  event.preventDefault()
}

function handleEnd() {
  if (!isDragging.value)
    return

  isDragging.value = false

  // 检查是否滑动到了最右边
  if (knobPosition.value >= maxPosition.value * 0.9) {
    // 触发解锁
    emit('unlock')
  }
  else {
    // 回弹到起始位置
    knobPosition.value = 0
  }

  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('mouseup', handleEnd)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('touchend', handleEnd)
}

onMounted(() => {
  if (knobRef.value) {
    knobRef.value.addEventListener('mousedown', handleStart)
    knobRef.value.addEventListener('touchstart', handleStart)
  }
})

onUnmounted(() => {
  if (knobRef.value) {
    knobRef.value.removeEventListener('mousedown', handleStart)
    knobRef.value.removeEventListener('touchstart', handleStart)
  }

  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('mouseup', handleEnd)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('touchend', handleEnd)
})
</script>

<template>
  <div
    ref="sliderRef"
    class="slide-to-unlock"
    :style="{ width: `${width}px`, height: `${height}px` }"
    :class="{ disabled }"
  >
    <div class="track">
      <div class="progress" :style="progressStyle" />

      <div class="text" :style="{ opacity: textOpacity }" :class="{ urgent: isUrgent }">
        {{ text }}
      </div>

      <div
        ref="knobRef"
        class="knob"
        :style="knobStyle"
        :class="{ dragging: isDragging }"
      >
        <div class="knob-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-to-unlock {
  position: relative;
  user-select: none;
  touch-action: none;
}

.track {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.6));
  border-radius: 30px;
  transition: width 0.1s ease;
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 16px;
  font-weight: 500;
  pointer-events: none;
  transition: opacity 0.2s ease, color 0.5s ease; /* 添加 color 过渡 */
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  max-width: 56px;
  background: white;
  border-radius: 26px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.knob.dragging {
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.knob-icon {
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.disabled .knob {
  cursor: not-allowed;
}

/* 新增：紧急状态下的动画 */
.text.urgent {
  animation: urgent-pulse 1s infinite alternate;
  color: #f87171; /* 紧急时变为红色 */
}

@keyframes urgent-pulse {
  from {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(1.05);
    opacity: 0.8;
  }
}
</style>
