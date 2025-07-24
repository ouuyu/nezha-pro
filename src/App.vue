<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { HomeFilled, Clock, ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue'
  import { ElTooltip } from 'element-plus'

  const router = useRouter()
  const route = useRoute()

  // State management
  const isCollapsed = ref(false)

  // Menu configuration with tooltips
  const menuItems = [
    { title: 'Dashboard', icon: HomeFilled, path: '/', tooltip: 'View Dashboard' },
    { title: 'Shutdown', icon: Clock, path: '/shutdown-settings', tooltip: 'Shutdown Settings' }
  ]

  // Computed values
  const activePath = computed(() => route.path)

  // Navigation and state functions
  const navigate = (path: string) => router.push(path)
  const toggleSidebar = () => (isCollapsed.value = !isCollapsed.value)
</script>

<template>
  <div
    class="flex h-screen w-screen overflow-hidden font-sans bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-gray-800"
  >
    <aside
      class="sidebar flex flex-col h-full bg-white/60 border-white/30 transition-all duration-300 ease-in-out"
      :class="[isCollapsed ? 'is-collapsed' : '']"
    >
      <!-- Logo Section -->
      <div class="flex h-20 items-center justify-center relative overflow-hidden">
        <h1 v-if="!isCollapsed" class="text-3xl font-bold sidebar-title-full text-purple-600">
          哪吒
        </h1>
        <span v-else class="text-3xl font-bold sidebar-title-collapsed text-purple-600"> N </span>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 flex-col space-y-2 p-2">
        <el-tooltip
          v-for="item in menuItems"
          :key="item.path"
          :content="isCollapsed ? item.tooltip : ''"
          placement="right"
          :disabled="!isCollapsed"
        >
          <button
            @click="navigate(item.path)"
            class="flex w-full items-center space-x-4 border-none rounded-xl p-3 text-left transition-all duration-300 ease-in-out"
            :class="[
              activePath === item.path
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700',
              isCollapsed ? 'justify-center' : ''
            ]"
          >
            <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
            <span v-if="!isCollapsed" class="sidebar-menu-text">{{ item.title }}</span>
          </button>
        </el-tooltip>
      </nav>

      <!-- Bottom Controls -->
      <div class="p-2">
        <!-- Collapse Toggle -->
        <el-tooltip
          :content="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          placement="right"
          :disabled="!isCollapsed"
        >
          <button
            @click="toggleSidebar"
            class="flex w-full items-center space-x-4 rounded-xl border-none p-3 justify-center transition-colors duration-200 hover:bg-purple-50"
          >
            <component
              :is="isCollapsed ? ArrowRightBold : ArrowLeftBold"
              class="h-5 w-5 text-gray-600"
            />
            <span v-if="!isCollapsed" class="sidebar-menu-text">
              {{ isCollapsed ? 'Expand' : 'Collapse' }}
            </span>
          </button>
        </el-tooltip>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-8 transition-colors duration-300 custom-scrollbar">
      <router-view v-slot="{ Component }">
        <transition name="fade-main" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
  /* Base sidebar styling */
  .sidebar {
    --sidebar-width: 256px;
    width: var(--sidebar-width);
    backdrop-filter: blur(12px);
    border-right-width: 1px;
  }

  .sidebar.is-collapsed {
    --sidebar-width: 80px;
  }

  /* Smooth transitions for sidebar elements */
  .sidebar-title-full,
  .sidebar-title-collapsed,
  .sidebar-menu-text {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.is-collapsed .sidebar-title-full,
  .sidebar:not(.is-collapsed) .sidebar-title-collapsed {
    opacity: 0;
    transform: translateX(-10px);
    position: absolute;
  }

  .sidebar.is-collapsed .sidebar-menu-text {
    opacity: 0;
    transform: translateX(-10px);
    width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  /* Custom scrollbar styling */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(107, 114, 128, 0.3) transparent;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(107, 114, 128, 0.3);
    border-radius: 3px;
  }

  /* Page transition animations */
  .fade-main-enter-active,
  .fade-main-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .fade-main-enter-from,
  .fade-main-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
</style>
