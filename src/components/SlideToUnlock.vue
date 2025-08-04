<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  text?: string
  disabled?: boolean
  width?: number
  height?: number
  countdownValue?: number | null
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
  transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}))

const progressStyle = computed(() => ({
  width: `${knobPosition.value + props.height}px`,
}))

const isUrgent = computed(() => props.countdownValue && props.countdownValue <= 60)

const textOpacity = computed(() => {
  const progress = knobPosition.value / maxPosition.value
  return Math.max(0.2, 1 - progress * 1.3)
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
  knobPosition.value = Math.max(0, Math.min(maxPosition.value, currentX.value))
  event.preventDefault()
}

function handleEnd() {
  if (!isDragging.value)
    return
  isDragging.value = false
  if (knobPosition.value >= maxPosition.value * 0.9) {
    emit('unlock')
  }
  else {
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
    :class="{ disabled, urgent: isUrgent }"
  >
    <div class="track">
      <div class="progress" :style="progressStyle" />
      <div class="text" :style="{ opacity: textOpacity }">
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.track {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.4s ease, background 0.4s ease;
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 122, 255, 0.3), rgba(0, 122, 255, 0.7));
  border-radius: 20px;
  transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.9); /* Keep text white for clarity */
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.2px;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  max-width: 56px;
  background: linear-gradient(180deg, #ffffff, #f0f0f3);
  border-radius: 18px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.knob.dragging {
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.05);
  transform: translateX(var(--knob-position, 0)) scale(1.02);
}

.knob-icon {
  color: #3a3a3c;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.knob:hover .knob-icon {
  color: #007aff;
}

.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.disabled .knob {
  cursor: not-allowed;
  background: #e0e0e0;
}

.slide-to-unlock.urgent .track {
  border: 2px solid rgba(255, 59, 48, 0.7); /* Red border for urgent state */
  background: rgba(255, 59, 48, 0.15); /* Subtle red background */
  animation: urgent-pulse 0.6s ease-in-out infinite alternate; /* Smooth pulse for entire frame */
}

@keyframes urgent-pulse {
  from {
    border-color: rgba(255, 59, 48, 0.7);
    background: rgba(255, 59, 48, 0.15);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  to {
    border-color: rgba(255, 59, 48, 1);
    background: rgba(255, 59, 48, 0.25);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(255, 59, 48, 0.3); /* Subtle red glow */
  }
}
</style>
