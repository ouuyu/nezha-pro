import { defineConfig } from 'unocss'
import { presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  // You can add custom rules here
  rules: [
    // Example custom rule
    // ['custom-rule', { color: 'red' }]
  ],
  // You can add shortcuts here
  shortcuts: {
    // Example shortcut
    // 'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md'
  },
}) 