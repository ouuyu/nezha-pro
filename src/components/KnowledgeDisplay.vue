<script setup lang="ts">
import type { KnowledgeItem } from '../types/interfaces'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  knowledgeItems: KnowledgeItem[]
}>()

const currentKnowledge = ref<KnowledgeItem | null>(null)
const rotationTimer = ref<number | null>(null)
const textContainerRef = ref<HTMLElement | null>(null)
const textSpanRef = ref<HTMLElement | null>(null)
const fontSize = ref(40)

watch(() => props.knowledgeItems, (newVal) => {
  if (newVal.length > 0) {
    startKnowledgeRotation()
  }
  else if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}, { immediate: true })

watch(currentKnowledge, () => {
  nextTick(() => {
    fitTextToContainer()
  })
})

onMounted(() => {
  window.addEventListener('resize', fitTextToContainer)
})

onUnmounted(() => {
  window.removeEventListener('resize', fitTextToContainer)
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
  }
})

function fitTextToContainer() {
  const container = textContainerRef.value
  const text = textSpanRef.value
  if (!container || !text)
    return

  const containerWidth = container.clientWidth - 40
  const containerHeight = container.clientHeight - 40

  let currentFontSize = 48
  text.style.fontSize = `${currentFontSize}px`

  while (
    (text.scrollWidth > containerWidth || text.scrollHeight > containerHeight)
    && currentFontSize > 16
  ) {
    currentFontSize -= 1
    text.style.fontSize = `${currentFontSize}px`
  }
  fontSize.value = currentFontSize
}

function startKnowledgeRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
  }

  displayRandomKnowledge()

  rotationTimer.value = setInterval(() => {
    displayRandomKnowledge()
  }, 5000) as unknown as number
}

function displayRandomKnowledge() {
  if (props.knowledgeItems.length === 0)
    return

  let randomIndex = Math.floor(Math.random() * props.knowledgeItems.length)
  if (props.knowledgeItems.length > 1 && currentKnowledge.value) {
    while (props.knowledgeItems[randomIndex]?.content === currentKnowledge.value.content) {
      randomIndex = Math.floor(Math.random() * props.knowledgeItems.length)
    }
  }
  currentKnowledge.value = props.knowledgeItems[randomIndex]
}

defineExpose({
  currentKnowledge,
})
</script>

<template>
  <div
    v-if="knowledgeItems.length > 0"
    class="knowledge-container"
  >
    <div ref="textContainerRef" class="w-full flex flex-grow items-center justify-center overflow-hidden">
      <Transition name="fade-slide" mode="out-in">
        <div v-if="currentKnowledge" :key="currentKnowledge.content" class="w-full p-5 text-center">
          <span ref="textSpanRef" class="knowledge-text" :style="{ fontSize: `${fontSize}px` }">
            {{ currentKnowledge.content }}
          </span>
        </div>
      </Transition>
    </div>

    <div
      v-if="currentKnowledge"
      class="mt-4 w-full flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300"
    >
      <span class="rounded-full bg-white/10 px-4 py-2 transition-colors">
        作者: {{ currentKnowledge.author }}
      </span>
      <span class="rounded-full bg-white/10 px-4 py-2 transition-colors">
        出处: {{ currentKnowledge.source }}
      </span>
    </div>
  </div>

  <div v-else class="empty-state-container">
    <h3 class="mb-4 text-3xl font-bold">
      📘 知识库为空
    </h3>
    <p class="text-base text-gray-300">
      添加一些知识条目以在关机确认时展示
    </p>
  </div>
</template>

<style scoped>
.knowledge-container {
  min-height: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 32px;
  color: white;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(16px);
  transition: all 0.3s;
}

.empty-state-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 48px;
  text-align: center;
  color: white;
}

.knowledge-text {
  display: inline-block;
  line-height: 1.5;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  transition: font-size 0.3s ease-out;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
