<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  modelValue: string
  language?: string
  theme?: string
  height?: string
  width?: string
  readonly?: boolean
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'ready', editor: monaco.editor.IStandaloneCodeEditor): void
}

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

const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: false,
}

function initEditor() {
  if (!editorContainerRef.value)
    return

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [],
    enableSchemaRequest: false,
  })

  editor = monaco.editor.create(editorContainerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    readOnly: props.readonly,
    ...defaultOptions,
    ...props.options,
  })

  editor.onDidChangeModelContent(() => {
    if (editor) {
      const value = editor.getValue()
      if (props.modelValue !== value) {
        emit('update:modelValue', value)
        emit('change', value)
      }
    }
  })

  emit('ready', editor)
}

watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newLanguage) => {
  if (editor && editor.getModel()) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLanguage)
  }
})

watch(() => props.theme, (newTheme) => {
  monaco.editor.setTheme(newTheme)
})

watch(() => props.readonly, (newReadonly) => {
  editor?.updateOptions({ readOnly: newReadonly })
})

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})

async function formatDocument() {
  if (!editor)
    return

  try {
    if (props.language === 'json') {
      const value = editor.getValue()
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value)
          const formatted = JSON.stringify(parsed, null, 2)
          editor.setValue(formatted)
          return
        }
        catch (error) {
          console.warn('JSON 解析失败，使用默认格式化:', error)
        }
      }
    }

    const action = editor.getAction('editor.action.formatDocument')
    if (action) {
      await action.run()
    }
    else {
      console.warn('格式化操作不可用')
    }
  }
  catch (error) {
    console.error('格式化文档时出错:', error)
  }
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
  border-radius: 4px;
  overflow: hidden;
  text-align: left;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}
</style>
