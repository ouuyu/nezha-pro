import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/shutdown-settings',
    name: 'ShutdownSettings',
    component: () => import('../views/ShutdownSettings.vue'),
  },
  {
    path: '/knowledge-base',
    name: 'KnowledgeBase',
    component: () => import('../views/KnowledgeBase.vue'),
  },
  {
    path: '/developer-mode',
    name: 'DeveloperMode',
    component: () => import('../views/DeveloperMode.vue'),
  },
  {
    path: '/shutdown-confirm',
    name: 'ShutdownConfirm',
    component: () => import('../views/ShutdownConfirm.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
