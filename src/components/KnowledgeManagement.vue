<script setup lang="ts">
import type { KnowledgeItem, KnowledgeManagementEmits, KnowledgeManagementProps } from '../types/interfaces'
import { ElAutoResizer, ElButton, ElMessage, ElMessageBox, ElTableV2, ElTag, TableV2FixedDir } from 'element-plus'
import { h, nextTick, onMounted, ref, watch } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

const props = defineProps<KnowledgeManagementProps>()
const emit = defineEmits<KnowledgeManagementEmits>()

const dialogVisible = ref(false)
const editIndex = ref<number | null>(null)
const form = ref({ author: '', source: '', content: '' })
const formRef = ref()

const rules = {
  author: [
    { required: true, message: '请输入作者姓名', trigger: 'blur' },
    { min: 1, max: 50, message: '作者姓名长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入知识内容', trigger: 'blur' },
    { min: 1, max: 1000, message: '内容长度在 1 到 1000 个字符', trigger: 'blur' },
  ],
  source: [
    { max: 200, message: '出处长度不能超过 200 个字符', trigger: 'blur' },
  ],
}

const knowledgeBase = ref<KnowledgeItem[]>([])
const tableKey = ref(0)

function forceTableRerender() {
  tableKey.value++
}

watch(knowledgeBase, () => {
  nextTick(() => {
    forceTableRerender()
  })
}, { deep: true })

watch(() => props.syncLoading, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    loadKnowledgeBase()
  }
})

const columns = [
  {
    key: 'author',
    title: '作者',
    dataKey: 'author',
    width: 120,
    align: 'left' as const,
    tooltip: true,
  },
  {
    key: 'source',
    title: '出处',
    dataKey: 'source',
    width: 180,
    align: 'left' as const,
    tooltip: true,
  },
  {
    key: 'content',
    title: '内容',
    dataKey: 'content',
    width: 300,
    align: 'left' as const,
    tooltip: true,
  },
  {
    key: 'dataSource',
    title: '来源',
    dataKey: 'dataSource',
    width: 120,
    align: 'center' as const,
    cellRenderer: ({ rowData }: { rowData: KnowledgeItem }) => (
      h('div', { class: 'flex flex-col items-center' }, [
        h(ElTag, { type: rowData.dataSource === 'cloud' ? 'info' : 'success', size: 'small' }, () => (
          rowData.dataSource === 'cloud' ? '云端' : '本地'
        )),
        rowData.dataSource === 'cloud' && rowData.sourceName
          ? h('div', { class: 'mt-1 text-xs text-gray-500' }, rowData.sourceName)
          : null,
      ])
    ),
  },
  {
    key: 'actions',
    title: '操作',
    width: 160,
    align: 'left' as const,
    fixed: TableV2FixedDir.RIGHT,
    // 自定义渲染操作按钮
    cellRenderer: ({ rowIndex, rowData }: { rowIndex: number, rowData: KnowledgeItem }) => (
      h('div', {}, [
        h(ElButton, {
          size: 'small',
          disabled: rowData.dataSource === 'cloud',
          onClick: () => editKnowledge(rowIndex),
        }, () => '编辑'),
        h(ElButton, {
          size: 'small',
          type: 'danger',
          disabled: rowData.dataSource === 'cloud',
          onClick: () => confirmDelete(rowIndex),
        }, () => '删除'),
      ])
    ),
  },
]

// 加载知识库数据
async function loadKnowledgeBase() {
  const result = await getConfig({
    showErrorMessage: true,
    errorMessage: '加载知识库失败',
    silent: false,
  })
  if (result.success && result.data) {
    knowledgeBase.value = result.data.knowledgeBase || []
    // 数据加载后强制表格重新渲染
    await nextTick()
    forceTableRerender()
  }
}

// 更新知识库数据
async function updateKnowledgeBase() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data) {
    return
  }

  const config = { ...configResult.data, knowledgeBase: knowledgeBase.value }

  await saveConfig(config, {
    showSuccessMessage: false,
    showErrorMessage: true,
    errorMessage: '保存失败',
    skipAutoSyncRestart: true,
  })
}

function openAddDialog() {
  editIndex.value = null
  form.value = { author: '', source: '', content: '' }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 100)
}

function editKnowledge(index: number) {
  const item = knowledgeBase.value[index]
  if (item.dataSource === 'cloud') {
    ElMessage.error('云端词条不允许编辑')
    return
  }
  editIndex.value = index
  form.value = { ...knowledgeBase.value[index] }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 100)
}

function saveKnowledge() {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (editIndex.value === null) {
        knowledgeBase.value.push({
          ...form.value,
          createTime: new Date().toLocaleString(),
          dataSource: 'local',
          sourceId: null,
        })
      }
      else {
        const currentItem = knowledgeBase.value[editIndex.value]
        if (currentItem.dataSource === 'cloud') {
          ElMessage.error('云端词条不允许编辑')
          return
        }
        knowledgeBase.value[editIndex.value] = {
          ...form.value,
          updateTime: new Date().toLocaleString(),
          dataSource: currentItem.dataSource || 'local',
        }
      }
      dialogVisible.value = false
      ElMessage.success(editIndex.value === null ? '新增成功' : '更新成功')
      await updateKnowledgeBase()
    }
    else {
      ElMessage.error('请检查输入内容')
    }
  })
}

function confirmDelete(index: number) {
  ElMessageBox.confirm(
    '确定要删除这条知识吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    deleteKnowledge(index)
  }).catch(() => {})
}

function deleteKnowledge(index: number) {
  const item = knowledgeBase.value[index]
  if (item.dataSource === 'cloud') {
    ElMessage.error('云端词条不允许删除')
    return
  }
  knowledgeBase.value.splice(index, 1)
  updateKnowledgeBase()
  ElMessage.success('删除成功')
}

function handleSyncFromCloud() {
  emit('syncFromCloud')
}

onMounted(loadKnowledgeBase)
</script>

<template>
  <div class="knowledge-management-container">
    <div class="header-section">
      <div class="flex items-center">
        <h2 class="text-lg font-bold">
          知识库管理
        </h2>
        <span v-if="lastSyncTime" class="ml-2 text-sm text-gray-500">
          最后同步时间: {{ lastSyncTime }}
        </span>
      </div>
      <div class="flex gap-2">
        <ElButton
          type="info"
          :loading="syncLoading"
          @click="handleSyncFromCloud"
        >
          {{ syncLoading ? '同步中...' : '云端同步' }}
        </ElButton>
        <ElButton type="primary" @click="openAddDialog">
          新增知识
        </ElButton>
      </div>
    </div>

    <div class="table-section">
      <ElAutoResizer>
        <template #default="{ height, width }">
          <ElTableV2
            :key="tableKey"
            :data="knowledgeBase"
            :columns="columns"
            :width="width"
            :height="height"
            empty-text="暂无知识数据"
          />
        </template>
      </ElAutoResizer>
    </div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    :title="editIndex === null ? '新增知识' : '编辑知识'"
    width="600px"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="作者" prop="author">
        <el-input v-model="form.author" placeholder="作者" />
      </el-form-item>
      <el-form-item label="出处" prop="source">
        <el-input v-model="form.source" placeholder="知识来源，如书籍、网站等" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          placeholder="输入知识内容"
          :rows="6"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <ElButton @click="dialogVisible = false">
        取消
      </ElButton>
      <ElButton type="primary" @click="saveKnowledge">
        保存
      </ElButton>
    </template>
  </el-dialog>
</template>

<style scoped>
.knowledge-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-section {
  flex-shrink: 0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-section {
  flex: 1;
  min-height: 0;
}
</style>
