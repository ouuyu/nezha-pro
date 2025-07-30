<script setup lang="ts">
import type { KnowledgeItem, KnowledgeManagementEmits, KnowledgeManagementProps } from '../types/interfaces'
import { ElAutoResizer, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElRadio, ElRadioGroup, ElSelect, ElTableV2, ElTag, TableV2FixedDir } from 'element-plus'
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

const props = defineProps<KnowledgeManagementProps>()
const emit = defineEmits<KnowledgeManagementEmits>()

const dialogVisible = ref(false)
const editIndex = ref<number | null>(null)
const form = ref({ author: '', source: '', content: '' })
const formRef = ref()
const isLoading = ref(true)

const rules = {
  author: [
    { required: true, message: '请输入作者', trigger: 'blur' },
    { max: 50, message: '作者姓名不能超过 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入知识内容', trigger: 'blur' },
    { max: 1000, message: '内容长度不能超过 1000 个字符', trigger: 'blur' },
  ],
  source: [{ max: 200, message: '出处长度不能超过 200 个字符', trigger: 'blur' }],
}

// 知识库数据
const knowledgeBase = ref<KnowledgeItem[]>([])
const tableKey = ref(0) // 强制刷新

// 批量删除相关状态
const batchDeleteDialogVisible = ref(false)
const batchDeleteLoading = ref(false)
const selectedDeleteType = ref<'bySource' | 'all'>('bySource')
const selectedSourceIds = ref<string[]>([])

// 计算可用的云端数据源，用于批量删除
const availableCloudSources = computed(() => {
  const sources = new Map<string, { id: string, name: string, count: number }>()
  knowledgeBase.value.forEach((item) => {
    if (item.dataSource === 'cloud' && item.sourceId && item.sourceName) {
      const existing = sources.get(item.sourceId)
      if (existing) {
        existing.count++
      }
      else {
        sources.set(item.sourceId, { id: item.sourceId, name: item.sourceName, count: 1 })
      }
    }
  })
  return Array.from(sources.values())
})

// 计算云端数据总数
const totalCloudCount = computed(() => {
  return knowledgeBase.value.filter(item => item.dataSource === 'cloud').length
})

// 监听同步加载状态，完成后刷新数据
watch(() => props.syncLoading, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    loadKnowledgeBase()
  }
})

// 表格列定义
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
        h(ElTag, { type: rowData.dataSource === 'cloud' ? 'info' : 'success', size: 'small' }, () =>
          rowData.dataSource === 'cloud' ? '云端' : '本地'),
        rowData.dataSource === 'cloud' && rowData.sourceName
          ? h('div', { class: 'mt-1 text-xs text-gray-500' }, rowData.sourceName)
          : null,
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
        h(ElButton, {
          size: 'small',
          disabled: rowData.dataSource === 'cloud',
          onClick: () => editKnowledge(rowIndex),
        }, () => '编辑'),
        h(ElButton, {
          size: 'small',
          type: 'danger',
          onClick: () => confirmDelete(rowIndex),
        }, () => '删除'),
      ]),
  },
]

// 从配置加载知识库数据
async function loadKnowledgeBase() {
  isLoading.value = true
  try {
    const result = await getConfig({ showErrorMessage: true, errorMessage: '加载知识库失败' })
    if (result.success && result.data) {
      knowledgeBase.value = result.data.knowledgeBase || []
      await nextTick()
      tableKey.value++ // 强制表格重新渲染
    }
  }
  finally {
    isLoading.value = false
  }
}

// 将知识库数据保存到配置
async function updateKnowledgeBase() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data)
    return

  const config = { ...configResult.data, knowledgeBase: knowledgeBase.value }
  await saveConfig(config, {
    showErrorMessage: true,
    errorMessage: '保存失败',
  })
}

// 打开新增知识对话框
function openAddDialog() {
  editIndex.value = null
  form.value = { author: '', source: '', content: '' }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

// 打开编辑知识对话框
function editKnowledge(index: number) {
  const item = knowledgeBase.value[index]
  if (item.dataSource === 'cloud') {
    ElMessage.error('云端词条不允许编辑')
    return
  }
  editIndex.value = index
  form.value = { ...item }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

// 保存知识（新增或更新）
function saveKnowledge() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error('请检查输入内容')
      return
    }

    const isNew = editIndex.value === null
    if (isNew) {
      knowledgeBase.value.push({ ...form.value, createTime: new Date().toLocaleString(), dataSource: 'local' })
    }
    else {
      const currentItem = knowledgeBase.value[editIndex.value!]
      knowledgeBase.value[editIndex.value!] = { ...currentItem, ...form.value, updateTime: new Date().toLocaleString() }
    }
    dialogVisible.value = false
    ElMessage.success(isNew ? '新增成功' : '更新成功')
    await updateKnowledgeBase()
  })
}

// 确认删除单个条目
function confirmDelete(index: number) {
  ElMessageBox.confirm('确定要删除这条知识吗？', '删除确认', { type: 'warning' })
    .then(() => {
      knowledgeBase.value.splice(index, 1)
      updateKnowledgeBase()
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

// 打开批量删除对话框
function openBatchDeleteDialog() {
  if (totalCloudCount.value === 0) {
    ElMessage.warning('没有云端数据可以删除')
    return
  }
  selectedDeleteType.value = 'bySource'
  selectedSourceIds.value = []
  batchDeleteDialogVisible.value = true
}

// 执行批量删除
async function executeBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除吗？此操作不可撤销。`, '批量删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    batchDeleteLoading.value = true
    let result
    if (selectedDeleteType.value === 'all') {
      result = await window.require('electron').ipcRenderer.invoke('delete-all-cloud-data')
    }
    else {
      result = await window.require('electron').ipcRenderer.invoke('delete-cloud-data-by-source', [...selectedSourceIds.value])
    }

    if (result.success) {
      ElMessage.success(`删除成功！共删除 ${result.itemCount || 0} 条数据`)
      batchDeleteDialogVisible.value = false
      await loadKnowledgeBase()
    }
    else {
      ElMessage.error(`删除失败：${result.message}`)
    }
  }
  catch (error) {
    console.error('批量删除异常:', error)
    if (error !== 'cancel') {
      ElMessage.error('删除操作失败，请重试')
    }
  }
  finally {
    batchDeleteLoading.value = false
  }
}

onMounted(() => {
  loadKnowledgeBase()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex flex-shrink-0 items-center justify-between">
      <h2 class="text-lg text-gray-800 font-bold">
        知识库管理
      </h2>
      <div class="flex items-center gap-2">
        <ElButton :loading="syncLoading" @click="emit('syncFromCloud')">
          {{ syncLoading ? '同步中...' : '云端同步' }}
        </ElButton>
        <ElButton type="danger" plain :disabled="totalCloudCount === 0" @click="openBatchDeleteDialog">
          批量删除
        </ElButton>
        <ElButton type="primary" @click="openAddDialog">
          新增知识
        </ElButton>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <ElAutoResizer>
        <template #default="{ height, width }">
          <ElTableV2
            :key="tableKey"
            v-loading="isLoading"
            :data="knowledgeBase"
            :columns="columns"
            :width="width"
            :height="height"
            :tooltip-options="{ placement: 'top' }"
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

      <div
        v-if="selectedDeleteType === 'all'"
        class="rounded bg-red-100/80 p-3 text-sm text-red-700"
      >
        ⚠️将删除所有云端同步的数据，此操作不可撤销！
      </div>
    </div>

    <template #footer>
      <ElButton @click="batchDeleteDialogVisible = false">
        取消
      </ElButton>
      <ElButton type="danger" :loading="batchDeleteLoading" @click="executeBatchDelete">
        {{ batchDeleteLoading ? '删除中...' : '确认删除' }}
      </ElButton>
    </template>
  </ElDialog>
</template>
