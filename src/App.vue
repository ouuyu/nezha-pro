<script setup>
import { Clock, Document, HomeFilled, InfoFilled, Tools } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ShutdownConfirm from './views/ShutdownConfirm.vue'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const isMobileScreen = ref(false)
const isRouterReady = ref(false)


const isCountdownPage = computed(() => route.path === '/shutdown-confirm')

const menuItems = [
  {
    title: '仪表盘',
    path: '/',
    icon: HomeFilled,
  },
  {
    title: '知识库',
    path: '/knowledge-base',
    icon: Document,
  },
  {
    title: '定时关机',
    path: '/shutdown-settings',
    icon: Clock,
  },
  {
    title: '开发者模式',
    path: '/developer-mode',
    icon: Tools,
  },
  {
    title: '关于',
    path: '/about',
    icon: InfoFilled,
  },
]

const activeIndex = computed(() => route.path)

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleSelect(index) {
  router.push(index)
  if (isMobileScreen.value) {
    isCollapse.value = true
  }
}

function checkScreenSize() {
  isMobileScreen.value = window.innerWidth < 768
  isCollapse.value = isMobileScreen.value
}



onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  router.isReady().then(() => {
    isRouterReady.value = true
  })


})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div v-if="isRouterReady" class="h-full w-full">
    <div v-if="isCountdownPage" class="h-full w-full">
      <ShutdownConfirm />
    </div>

    <div v-if="!isCountdownPage" class="h-full w-full">
      <el-container class="min-h-screen">
        <el-aside
          class="fixed left-0 top-0 h-screen shadow-md transition-all duration-300"
          :width="isCollapse ? '64px' : '240px'"
        >
          <div
            class="sidebar-header flex items-center p-4"
            :class="isCollapse ? 'justify-center' : 'justify-between'"
          >
            <el-image
              v-show="!isCollapse"
              src="/vite.svg"
              class="h-8 w-8 transition-opacity"
              alt="Logo"
            />
            <el-tooltip :content="isCollapse ? '展开菜单' : '收起菜单'" placement="right">
              <el-button
                :icon="isCollapse ? 'Expand' : 'Fold'"
                circle
                size="small"
                @click="toggleCollapse"
              />
            </el-tooltip>
          </div>

          <el-menu
            :default-active="activeIndex"
            class="border-0"
            :collapse="isCollapse"
            :collapse-transition="false"
            @select="handleSelect"
          >
            <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template #title>
                {{ item.title }}
              </template>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-container :style="{ marginLeft: isCollapse ? '64px' : '240px' }">
          <el-main class="p-4">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </el-main>
        </el-container>
      </el-container>
    </div>


  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.el-aside {
  overflow-x: hidden;
}
</style>
