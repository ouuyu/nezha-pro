<script setup lang="ts">
import type { KnowledgeItem, KnowledgeManagementEmits, KnowledgeManagementProps } from '../types/interfaces'
import { ElAutoResizer, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElRadio, ElRadioGroup, ElSelect, ElTableV2, ElTag, TableV2FixedDir } from 'element-plus'
import { computed, h, onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc/'

const props = defineProps<KnowledgeManagementProps>()
const emit = defineEmits<KnowledgeManagementEmits>()

const isLoading = ref(true)
const knowledgeBase = ref<KnowledgeItem[]>([])
const dialogVisible = ref(false)
const formRef = ref()
const form = ref({ author: '', source: '', content: '' })
const editIndex = ref<number | null>(null)

const batchDeleteDialogVisible = ref(false)
const batchDeleteLoading = ref(false)
const selectedDeleteType = ref<'bySource' | 'all'>('bySource')
const selectedSourceIds = ref<string[]>([])

const rules = {
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  content: [{ required: true, message: '请输入知识内容', trigger: 'blur' }],
}

const availableCloudSources = computed(() => {
  const sources = new Map<string, { id: string, name: string, count: number }>()
  knowledgeBase.value.forEach((item) => {
    if (item.dataSource === 'cloud' && item.sourceId && item.sourceName) {
      const existing = sources.get(item.sourceId)
      if (existing)
        existing.count++
      else
        sources.set(item.sourceId, { id: item.sourceId, name: item.sourceName, count: 1 })
    }
  })
  return Array.from(sources.values())
})

const totalCloudCount = computed(() => {
  return knowledgeBase.value.filter(item => item.dataSource === 'cloud').length
})

watch(() => props.syncLoading, (newVal, oldVal) => {
  if (oldVal && !newVal)
    loadKnowledgeBase()
})

const columns = [
  { key: 'author', title: '作者', dataKey: 'author', width: 120, align: 'left' as const },
  { key: 'source', title: '出处', dataKey: 'source', width: 180, align: 'left' as const },
  { key: 'content', title: '内容', dataKey: 'content', width: 300, align: 'left' as const },
  {
    key: 'dataSource',
    title: '来源',
    dataKey: 'dataSource',
    width: 120,
    align: 'center' as const,
    cellRenderer: ({ rowData }: { rowData: KnowledgeItem }) =>
      h('div', { class: 'flex flex-col items-center justify-center' }, [
        h(ElTag, { type: rowData.dataSource === 'cloud' ? 'info' : 'success', size: 'small' }, () => rowData.dataSource === 'cloud' ? '云端' : '本地'),
      ]),
  },
  {
    key: 'actions',
    title: '操作',
    width: 160,
    align: 'left' as const,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowIndex, rowData }: { rowIndex: number, rowData: KnowledgeItem }) =>
      h('div', { class: 'flex gap-2' }, [
        h(ElButton, { size: 'small', disabled: rowData.dataSource === 'cloud', onClick: () => openDialog(rowIndex) }, () => '编辑'),
        h(ElButton, { size: 'small', type: 'danger', onClick: () => confirmDelete(rowIndex) }, () => '删除'),
      ]),
  },
]

async function loadKnowledgeBase() {
  isLoading.value = true
  try {
    const result = await getConfig({ showErrorMessage: true, errorMessage: '加载知识库失败' })
    if (result.success && result.data)
      knowledgeBase.value = result.data.knowledgeBase || []
  }
  finally {
    setTimeout(() => {
      isLoading.value = false
    }, 200)
  }
}

async function updateKnowledgeBase() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data)
    return
  const config = { ...configResult.data, knowledgeBase: knowledgeBase.value }
  await saveConfig(config, { showErrorMessage: true, errorMessage: '保存失败' })
}

function openDialog(index: number | null = null) {
  editIndex.value = index
  form.value = index === null ? { author: '', source: '', content: '' } : { ...knowledgeBase.value[index] }
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

async function saveKnowledge() {
  try {
    await formRef.value.validate()
    const isNew = editIndex.value === null
    if (isNew) {
      knowledgeBase.value.push({ ...form.value, createTime: new Date().toLocaleString(), dataSource: 'local' })
    }
    else {
      const currentItem = knowledgeBase.value[editIndex.value!]
      knowledgeBase.value[editIndex.value!] = { ...currentItem, ...form.value, updateTime: new Date().toLocaleString() }
    }
    dialogVisible.value = false
    await updateKnowledgeBase()
  }
  catch {
  }
}

async function confirmDelete(index: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条知识吗？', '删除确认', { type: 'warning' })
    knowledgeBase.value.splice(index, 1)
    await updateKnowledgeBase()
  }
  catch {
  }
}

function openBatchDeleteDialog() {
  if (totalCloudCount.value === 0) {
    ElMessage.warning('没有云端数据可以删除')
    return
  }
  selectedDeleteType.value = 'bySource'
  selectedSourceIds.value = []
  batchDeleteDialogVisible.value = true
}

async function executeBatchDelete() {
  try {
    batchDeleteLoading.value = true
    const ipc = window.require('electron').ipcRenderer
    const result = selectedDeleteType.value === 'all'
      ? await ipc.invoke('delete-all-cloud-data')
      : await ipc.invoke('delete-cloud-data-by-source', [...selectedSourceIds.value])

    if (result.success) {
      batchDeleteDialogVisible.value = false
      await loadKnowledgeBase()
    }
    else {
      ElMessage.error(`删除失败：${result.message}`)
    }
  }
  catch {
  }
  finally {
    batchDeleteLoading.value = false
  }
}

onMounted(loadKnowledgeBase)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex flex-shrink-0 items-center justify-between">
      <h2 class="text-lg text-gray-800 font-bold">
        知识库管理
      </h2>
      <div class="flex items-center gap-2">
        <ElButton :loading="isLoading" @click="loadKnowledgeBase">
          刷新
        </ElButton>
        <ElButton :loading="props.syncLoading" @click="emit('syncFromCloud')">
          云端同步
        </ElButton>
        <ElButton type="danger" plain :disabled="totalCloudCount === 0" @click="openBatchDeleteDialog">
          批量删除
        </ElButton>
        <ElButton type="primary" @click="openDialog(null)">
          新增知识
        </ElButton>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <ElAutoResizer>
        <template #default="{ height, width }">
          <ElTableV2
            v-loading="isLoading"
            :data="knowledgeBase"
            :columns="columns"
            :width="width"
            :height="height"
            :cache="20"
            fixed
          />
        </template>
      </ElAutoResizer>
    </div>
  </div>

  <ElDialog v-model="dialogVisible" :title="editIndex === null ? '新增知识' : '编辑知识'" width="600px">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
      <ElFormItem label="作者" prop="author">
        <ElInput v-model="form.author" placeholder="作者" />
      </ElFormItem>
      <ElFormItem label="出处" prop="source">
        <ElInput v-model="form.source" placeholder="知识来源，如书籍、网站等" />
      </ElFormItem>
      <ElFormItem label="内容" prop="content">
        <ElInput v-model="form.content" type="textarea" placeholder="输入知识内容" :rows="6" maxlength="1000" show-word-limit />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">
        取消
      </ElButton>
      <ElButton type="primary" @click="saveKnowledge">
        保存
      </ElButton>
    </template>
  </ElDialog>

  <ElDialog v-model="batchDeleteDialogVisible" title="批量删除" width="600px">
    <div class="space-y-4">
      <ElRadioGroup v-model="selectedDeleteType" class="items-center !flex">
        <ElRadio value="bySource">
          按来源删除
        </ElRadio>
        <ElRadio value="all">
          删除全部
        </ElRadio>
      </ElRadioGroup>

      <ElSelect
        v-if="selectedDeleteType === 'bySource'"
        v-model="selectedSourceIds"
        multiple
        placeholder="请选择要删除的数据源"
        class="w-full"
      >
        <ElOption
          v-for="source in availableCloudSources"
          :key="source.id"
          :label="`${source.name} (${source.count}条)`"
          :value="source.id"
        />
      </ElSelect>
    </div>
    <template #footer>
      <ElButton @click="batchDeleteDialogVisible = false">
        取消
      </ElButton>
      <ElButton type="danger" :loading="batchDeleteLoading" @click="executeBatchDelete">
        确认删除
      </ElButton>
    </template>
  </ElDialog>
</template>
