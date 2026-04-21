<template>
  <AppLayout>
    <div class="device-groups-page">
      <div class="page-header">
        <h1 class="page-title">设备分组</h1>
        <el-button v-if="canEdit" type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增分组
        </el-button>
      </div>

      <!-- 分组卡片 -->
      <div class="groups-grid" v-loading="loading">
        <el-card v-for="group in groups" :key="group.id" class="group-card">
          <template #header>
            <div class="card-header">
              <span class="group-name">{{ group.name }}</span>
              <div class="card-actions" v-if="canEdit">
                <el-button type="primary" link @click="openEditDialog(group)">编辑</el-button>
                <el-button type="primary" link @click="openManageDevices(group)">管理设备</el-button>
                <el-button type="danger" link @click="handleDelete(group)">删除</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="温室ID">{{ group.greenhouse_id }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ group.description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备数量">{{ group.device_count || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-empty v-if="!loading && groups.length === 0" description="暂无分组数据" />
      </div>

      <!-- 新增/编辑分组弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分组' : '新增分组'" width="500px">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
          <el-form-item label="温室ID" prop="greenhouse_id">
            <el-input-number v-model="formData.greenhouse_id" :min="1" />
          </el-form-item>
          <el-form-item label="分组名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入分组名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </template>
      </el-dialog>

      <!-- 管理设备弹窗 -->
      <el-dialog v-model="manageDialogVisible" title="管理设备" width="700px">
        <div class="manage-devices-content">
          <div class="transfer-header">
            <span>分组: {{ currentGroup?.name }}</span>
          </div>
          <el-transfer
            v-model="selectedDevices"
            :data="allDevices"
            :titles="['可选设备', '已加入设备']"
            :props="{
              key: 'id',
              label: 'name'
            }"
            filterable
            filter-placeholder="搜索设备"
          />
        </div>
        <template #footer>
          <el-button @click="manageDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="manageLoading" @click="handleManageDevices">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { AppLayout } from '@/components/layout'
import { getDeviceGroups, createDeviceGroup, updateDeviceGroup, deleteDeviceGroup, addDeviceToGroup, removeDeviceFromGroup } from '@/api/device-group'
import { getDevices } from '@/api/device'
import { usePermission } from '@/composables/usePermission'
import { DeviceGroup, Device } from '@/types'

const { canEditDevice } = usePermission()
const canEdit = computed(() => canEditDevice())

const groups = ref<DeviceGroup[]>([])
const loading = ref(false)

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive({
  greenhouse_id: 1,
  name: '',
  description: ''
})

const formRules: FormRules = {
  greenhouse_id: [{ required: true, message: '请输入温室ID', trigger: 'blur' }],
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 1, max: 64, message: '分组名称长度为 1-64 个字符', trigger: 'blur' }
  ]
}

// 管理设备
const manageDialogVisible = ref(false)
const manageLoading = ref(false)
const currentGroup = ref<DeviceGroup | null>(null)
const allDevices = ref<Device[]>([])
const selectedDevices = ref<number[]>([])

// 获取分组列表
async function fetchGroups() {
  loading.value = true
  try {
    const result = await getDeviceGroups()
    groups.value = result.items
  } finally {
    loading.value = false
  }
}

// 打开新增弹窗
function openCreateDialog() {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    greenhouse_id: 1,
    name: '',
    description: ''
  })
  dialogVisible.value = true
}

// 打开编辑弹窗
function openEditDialog(group: DeviceGroup) {
  isEdit.value = true
  editingId.value = group.id
  Object.assign(formData, {
    greenhouse_id: group.greenhouse_id,
    name: group.name,
    description: group.description || ''
  })
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    if (isEdit.value && editingId.value) {
      await updateDeviceGroup(editingId.value, {
        name: formData.name,
        description: formData.description
      })
      ElMessage.success('分组更新成功')
    } else {
      await createDeviceGroup({
        greenhouse_id: formData.greenhouse_id,
        name: formData.name,
        description: formData.description
      })
      ElMessage.success('分组创建成功')
    }
    dialogVisible.value = false
    fetchGroups()
  } catch {
    // 错误已处理
  } finally {
    submitLoading.value = false
  }
}

// 删除分组
async function handleDelete(group: DeviceGroup) {
  try {
    await ElMessageBox.confirm(`确定要删除分组"${group.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteDeviceGroup(group.id)
    ElMessage.success('分组删除成功')
    fetchGroups()
  } catch {
    // 取消或错误
  }
}

// 打开管理设备弹窗
async function openManageDevices(group: DeviceGroup) {
  currentGroup.value = group
  manageDialogVisible.value = true
  manageLoading.value = true

  try {
    // 获取所有设备
    const devicesResult = await getDevices({ page_size: 1000 })
    allDevices.value = devicesResult.items

    // 获取当前分组的设备
    const groupDevicesResult = await getDevices({ group_id: group.id, page_size: 1000 })
    selectedDevices.value = groupDevicesResult.items.map((d) => d.id)
  } catch {
    // 错误已处理
  } finally {
    manageLoading.value = false
  }
}

// 保存设备分配
async function handleManageDevices() {
  if (!currentGroup.value) return
  manageLoading.value = true

  try {
    // 获取当前分组的设备
    const currentDevicesResult = await getDevices({ group_id: currentGroup.value.id, page_size: 1000 })
    const currentDeviceIds = currentDevicesResult.items.map((d) => d.id)

    // 计算需要添加和移除的设备
    const toAdd = selectedDevices.value.filter((id) => !currentDeviceIds.includes(id))
    const toRemove = currentDeviceIds.filter((id) => !selectedDevices.value.includes(id))

    // 执行添加和移除操作
    const addPromises = toAdd.map((deviceId) => addDeviceToGroup(currentGroup.value!.id, deviceId))
    const removePromises = toRemove.map((deviceId) => removeDeviceFromGroup(currentGroup.value!.id, deviceId))

    await Promise.all([...addPromises, ...removePromises])

    ElMessage.success('设备分配保存成功')
    manageDialogVisible.value = false
    fetchGroups()
  } catch {
    // 错误已处理
  } finally {
    manageLoading.value = false
  }
}

onMounted(() => {
  fetchGroups()
})
</script>

<style scoped lang="scss">
.device-groups-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
  }

  .group-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .group-name {
      font-weight: 600;
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }
  }

  .manage-devices-content {
    .transfer-header {
      margin-bottom: 16px;
      font-weight: 600;
    }
  }
}
</style>