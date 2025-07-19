<template>
  <div class="home p-4">
    <h1 class="text-2xl font-bold mb-4">Electron + Vite + Vue3 + Vue Router</h1>
    <p class="mb-4">Welcome to your Electron application</p>
    
    <!-- Element Plus components -->
    <div class="mb-4">
      <el-button type="primary">Element Plus Button</el-button>
      <el-button type="success" class="ml-2">Success</el-button>
      <el-button type="info" class="ml-2">Info</el-button>
    </div>

    <div class="mb-2">
      <el-input v-model="input" placeholder="Element Plus" class="w-64" />
    </div>

    <div class="mb-4">
      <el-card class="w-96">
        <template #header>
          <div class="flex justify-between items-center">
            <span>Element Plus Card</span>
            <el-button type="text">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div>
          This project uses:
          <ul class="list-disc pl-6 mt-2">
            <li>Element Plus for UI components</li>
            <li>UnoCSS for utility-first CSS</li>
            <li>Vue 3 with Composition API</li>
            <li>Electron for desktop app</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Edit } from '@element-plus/icons-vue'

const input = ref('')
</script>