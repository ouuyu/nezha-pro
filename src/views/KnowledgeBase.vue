<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { getConfig, saveConfig } from '../utils/ipc'

const knowledgeBase = ref<any[]>([])
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

async function loadKnowledgeBase() {
  const result = await getConfig({
    showErrorMessage: true,
    errorMessage: '加载知识库失败',
    silent: false,
  })
  if (result.success && result.data) {
    knowledgeBase.value = result.data.knowledgeBase || []
  }
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
        })
      }
      else {
        knowledgeBase.value[editIndex.value] = {
          ...form.value,
          updateTime: new Date().toLocaleString(),
        }
      }
      await updateConfig()
      dialogVisible.value = false
      ElMessage.success(editIndex.value === null ? '新增成功' : '更新成功')
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

async function deleteKnowledge(index: number) {
  knowledgeBase.value.splice(index, 1)
  await updateConfig()
  ElMessage.success('删除成功')
}

async function updateConfig() {
  const configResult = await getConfig({ silent: true })
  if (!configResult.success || !configResult.data) {
    return
  }
  const config = configResult.data
  config.knowledgeBase = knowledgeBase.value
  await saveConfig(config, {
    showSuccessMessage: true,
    showErrorMessage: true,
    successMessage: '保存成功',
    errorMessage: '保存失败',
  })
}

onMounted(loadKnowledgeBase)
</script>

<template>
  <el-card class="rounded-lg" shadow="hover">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold">
        知识库管理
      </h2>
      <el-button type="primary" @click="openAddDialog">
        新增知识
      </el-button>
    </div>
    <el-table :data="knowledgeBase" style="width: 100%" empty-text="暂无知识数据">
      <el-table-column prop="author" label="作者" width="120" show-overflow-tooltip />
      <el-table-column prop="source" label="出处" width="180" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="editKnowledge(scope.$index)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="confirmDelete(scope.$index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

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
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="saveKnowledge">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
