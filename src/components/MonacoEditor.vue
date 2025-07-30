<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// 定义 Props
interface Props {
  modelValue: string
  language?: string
  theme?: string
  height?: string
  width?: string
  readonly?: boolean
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}

// 定义 Emits
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'ready', editor: monaco.editor.IStandaloneCodeEditor): void
}

// 设置 Props 默认值
const props = withDefaults(defineProps<Props>(), {
  language: 'json',
  theme: 'vs-dark',
  height: '400px',
  width: '100%',
  readonly: false,
  options: () => ({}),
})

const emit = defineEmits<Emits>()

const editorContainerRef = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 更稳定、通用的默认配置
const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true, // 编辑器自适应布局
  formatOnPaste: true, // 粘贴时自动格式化
  formatOnType: true, // 输入时自动格式化
  minimap: { enabled: false }, // 不显示代码缩略图
  scrollBeyondLastLine: false, // 禁止滚动超过最后一行
  wordWrap: 'on', // 自动换行
  tabSize: 2, // tab 大小
}

/**
 * 初始化编辑器
 */
function initEditor() {
  if (!editorContainerRef.value)
    return

  // 创建编辑器实例
  editor = monaco.editor.create(editorContainerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    readOnly: props.readonly,
    ...defaultOptions,
    ...props.options, // 允许父组件覆盖默认配置
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const value = editor.getValue()
      // 避免因 watch 触发的无限更新循环
      if (props.modelValue !== value) {
        emit('update:modelValue', value)
        emit('change', value)
      }
    }
  })

  // 触发 'ready' 事件，将 editor 实例暴露给父组件
  emit('ready', editor)
}

// 监听 modelValue 的变化，从外部更新编辑器内容
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})

// 监听语言变化
watch(() => props.language, (newLanguage) => {
  if (editor && editor.getModel()) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLanguage)
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  monaco.editor.setTheme(newTheme)
})

// 监听只读状态变化
watch(() => props.readonly, (newReadonly) => {
  editor?.updateOptions({ readOnly: newReadonly })
})

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onBeforeUnmount(() => {
  // 销毁编辑器实例，防止内存泄漏
  if (editor) {
    editor.dispose()
    editor = null
  }
})

function formatDocument() {
  editor?.getAction('editor.action.formatDocument')?.run()
}

function validateJson(): { isValid: boolean, error?: string } {
  if (props.language !== 'json') {
    return { isValid: true }
  }
  const value = editor?.getValue() ?? ''
  if (!value.trim()) {
    return { isValid: true }
  }
  try {
    JSON.parse(value)
    return { isValid: true }
  }
  catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    }
  }
}

// 使用 defineExpose 暴露方法
defineExpose({
  formatDocument,
  validateJson,
  getEditor: () => editor,
  setValue: (value: string) => editor?.setValue(value),
  getValue: () => editor?.getValue(),
})
</script>

<template>
  <div
    ref="editorContainerRef"
    :style="{ height: props.height, width: props.width }"
    class="monaco-editor-container"
  />
</template>

<style scoped>
.monaco-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px !important;
  overflow: hidden;
  text-align: left;
}
</style>
