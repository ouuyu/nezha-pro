import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Import Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Import Element Plus icons
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Import UnoCSS
import 'uno.css'

const app = createApp(App)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')
