<script setup lang="ts">
import { Document, Promotion } from '@element-plus/icons-vue'
import { computed } from 'vue'
import pkg from '../../package.json'

const githubUrl = 'https://github.com/ouuyu/nezha'
</script>

<template>
  <div class="about-page h-full w-full flex items-center justify-center p-6">
    <div class="max-w-lg w-full">
      <header class="mb-8 text-center">
        <h1 class="flex items-center justify-center text-4xl text-gray-800 font-bold dark:text-white">
          <el-icon class="text-primary mr-3 text-5xl">
            <Document />
          </el-icon>
          <span>关于 nezha</span>
        </h1>
      </header>

      <main class="space-y-6">
        <div class="flex items-center justify-center">
          <el-image
            src="/vite.svg"
            class="h-24 w-24"
            fit="contain"
          />
        </div>

        <section class="rounded-lg bg-white p-6 shadow-md space-y-4 dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 font-medium dark:text-gray-400">开源地址</span>
            <el-link :href="githubUrl" target="_blank" :icon="Promotion">
              {{ githubUrl }}
            </el-link>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 font-medium dark:text-gray-400">开源协议</span>
            <el-tag type="success">
              MIT
            </el-tag>
          </div>
        </section>

        <div class="text-center text-gray-500 dark:text-gray-400">
          <p>nezha是一个开源项目，欢迎贡献代码和提出建议。</p>
        </div>
      </main>
    </div>
  </div>
</template>
