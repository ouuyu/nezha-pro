import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import './style.css'
import 'uno.css'

const app = createApp(App)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')

const appLoading = document.getElementById('app-loading')
if (appLoading) {
  appLoading.classList.add('app-loading-hidden')
  // Remove the element after transition completes
  setTimeout(() => {
    appLoading.remove()
  }, 300)
}
