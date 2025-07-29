import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'

import './style.css'
import 'uno.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')

const appLoading = document.getElementById('app-loading')
if (appLoading) {
  appLoading.classList.add('app-loading-hidden')
  setTimeout(() => {
    appLoading.remove()
  }, 300)
}
