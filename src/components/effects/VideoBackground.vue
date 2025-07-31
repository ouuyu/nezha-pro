<script setup lang="ts">
import type { BackgroundConfig } from '../../types/interfaces'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// 接收配置
const props = withDefaults(defineProps<{ config?: BackgroundConfig }>(), {
  config: () => ({
    type: 'video',
    opacity: 0.8,
    speed: 1,
  }),
})

const videoRef = ref<HTMLVideoElement>()
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')

// 计算视频源
const videoSrc = computed(() => {
  if (props.config.videoPath) {
    // 本地文件路径，需要转换为file://协议
    return `file://${props.config.videoPath}`
  }
  return props.config.videoUrl || ''
})

// 计算样式
const videoStyle = computed(() => ({
  opacity: props.config.opacity || 0.8,
  filter: `brightness(${0.7 + (props.config.opacity || 0.8) * 0.3})`,
}))

// 处理视频加载
function handleVideoLoad() {
  isLoading.value = false
  hasError.value = false
  
  if (videoRef.value) {
    // 设置播放速度
    videoRef.value.playbackRate = props.config.speed || 1
    
    // 开始播放
    videoRef.value.play().catch((error) => {
      console.error('Video play failed:', error)
      handleVideoError('视频播放失败')
    })
  }
}

// 处理视频错误
function handleVideoError(message?: string) {
  isLoading.value = false
  hasError.value = true
  errorMessage.value = message || '视频加载失败'
  console.error('Video error:', message)
}

// 处理视频结束（循环播放）
function handleVideoEnded() {
  if (videoRef.value) {
    videoRef.value.currentTime = 0
    videoRef.value.play().catch((error) => {
      console.error('Video replay failed:', error)
    })
  }
}

// 监听配置变化
watch(() => props.config.speed, (newSpeed) => {
  if (videoRef.value && newSpeed) {
    videoRef.value.playbackRate = newSpeed
  }
})

watch(() => videoSrc.value, () => {
  isLoading.value = true
  hasError.value = false
})

onMounted(() => {
  // 预加载视频
  if (videoRef.value && videoSrc.value) {
    videoRef.value.load()
  }
})

onUnmounted(() => {
  // 清理视频资源
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
  }
})
</script>

<template>
  <div class="video-background-wrapper">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" />
      <div class="loading-text">
        加载视频中...
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-overlay">
      <div class="error-icon">
        ⚠️
      </div>
      <div class="error-text">
        {{ errorMessage }}
      </div>
      <div class="error-hint">
        请检查视频文件是否存在或网络连接
      </div>
    </div>

    <!-- 视频播放 -->
    <video
      v-else
      ref="videoRef"
      :src="videoSrc"
      :style="videoStyle"
      class="background-video"
      autoplay
      muted
      loop
      playsinline
      @loadeddata="handleVideoLoad"
      @error="() => handleVideoError()"
      @ended="handleVideoEnded"
    />

    <!-- 遮罩层 -->
    <div class="video-overlay" :style="{ opacity: 1 - (props.config.opacity || 0.8) }" />
  </div>
</template>

<style scoped>
.video-background-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: #000;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
  z-index: 1;
}

.video-overlay {
  position: absolute;
  inset: 0;
  background-color: #000;
  z-index: 2;
  pointer-events: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 3;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  text-align: center;
}

.error-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-text,
  .error-text {
    font-size: 14px;
  }
  
  .error-hint {
    font-size: 12px;
  }
  
  .error-icon {
    font-size: 36px;
  }
}
</style>
