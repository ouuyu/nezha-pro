// This file is used to provide TypeScript type definitions for Vue files
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron renderer process interface
interface Window {
  require: (module: string) => any
}
