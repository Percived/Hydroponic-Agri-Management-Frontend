<template>
  <AppLayout>
    <div class="dashboard-page">
      <div class="page-header">
        <h1 class="page-title">系统概览</h1>
        <span class="current-date">{{ currentDate }}</span>
      </div>

      <!-- 关键指标 -->
      <div class="stats-grid">
        <div class="stat-card online">
          <div class="stat-icon">
            <el-icon size="32"><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.online_devices }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
        <div class="stat-card offline">
          <div class="stat-icon">
            <el-icon size="32"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.offline_devices }}</div>
            <div class="stat-label">离线设备</div>
          </div>
        </div>
        <div class="stat-card alert">
          <div class="stat-icon">
            <el-icon size="32"><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.active_alerts }}</div>
            <div class="stat-label">活跃告警</div>
          </div>
        </div>
        <div class="stat-card data">
          <div class="stat-icon">
            <el-icon size="32"><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview.today_data_points) }}</div>
            <div class="stat-label">今日数据</div>
          </div>
        </div>
      </div>

      <!-- 告警列表 -->
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">告警列表（最新5条）</h3>
          <el-button type="primary" link @click="goAlerts">查看全部告警</el-button>
        </div>
        <el-table :data="recentAlerts" v-loading="loading" stripe>
          <el-table-column label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="getAlertLevelType(row.level)">
                {{ getAlertLevelName(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ getAlertTypeName(row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="message" label="消息" min-width="200" />
          <el-table-column prop="device_name" label="设备" width="120" />
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!loading && recentAlerts.length === 0" class="empty-alert">
          暂无告警
        </div>
      </div>

      <!-- 设备分布图表 -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="chart-title">设备类型分布</h3>
          <div ref="typeChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">设备分组分布</h3>
          <div ref="groupChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Monitor, Warning, Bell, DataLine } from '@element-plus/icons-vue'
import { AppLayout } from '@/components/layout'
import { dashboardApi } from '@/api'
import type { DashboardOverview, AlertSummary, DeviceTypeDistribution, DeviceGroupDistribution } from '@/types'

const router = useRouter()

// 数据
const loading = ref(false)
const overview = ref<DashboardOverview>({
  online_devices: 0,
  offline_devices: 0,
  active_alerts: 0,
  today_data_points: 0
})
const recentAlerts = ref<AlertSummary[]>([])
const typeDistribution = ref<DeviceTypeDistribution[]>([])
const groupDistribution = ref<DeviceGroupDistribution[]>([])

// 图表
const typeChartRef = ref<HTMLElement>()
const groupChartRef = ref<HTMLElement>()
let typeChart: echarts.ECharts | null = null
let groupChart: echarts.ECharts | null = null

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取告警级别样式
function getAlertLevelType(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'danger',
    WARN: 'warning',
    INFO: 'info'
  }
  return map[level] || 'info'
}

// 获取告警级别名称
function getAlertLevelName(level: string): string {
  const map: Record<string, string> = {
    CRITICAL: '严重',
    WARN: '警告',
    INFO: '信息'
  }
  return map[level] || level
}

// 获取告警类型名称
function getAlertTypeName(type: string): string {
  const map: Record<string, string> = {
    THRESHOLD: '阈值',
    OFFLINE: '离线',
    DEVICE_ERROR: '故障'
  }
  return map[type] || type
}

// 跳转告警页
function goAlerts() {
  router.push('/alerts')
}

// 获取数据
async function fetchData() {
  loading.value = true
  try {
    const data = await dashboardApi.getDashboardData()
    overview.value = data.overview
    recentAlerts.value = data.recent_alerts
    typeDistribution.value = data.device_type_distribution
    groupDistribution.value = data.device_group_distribution

    // 更新图表
    updateCharts()
  } catch {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

// 初始化图表
function initCharts() {
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
  }
  if (groupChartRef.value) {
    groupChart = echarts.init(groupChartRef.value)
  }
}

// 更新图表
function updateCharts() {
  // 设备类型分布饼图
  if (typeChart && typeDistribution.value.length > 0) {
    typeChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        left: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: typeDistribution.value.map((item) => ({
            name: item.type === 'SENSOR' ? '传感器' : '执行器',
            value: item.count
          }))
        }
      ]
    })
  }

  // 设备分组分布饼图
  if (groupChart && groupDistribution.value.length > 0) {
    groupChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        left: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: groupDistribution.value.map((item) => ({
            name: item.group_name,
            value: item.count
          }))
        }
      ]
    })
  }
}

// 窗口大小变化时重绘图表
function handleResize() {
  typeChart?.resize()
  groupChart?.resize()
}

onMounted(() => {
  fetchData()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  typeChart?.dispose()
  groupChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .current-date {
    color: #909399;
    font-size: 14px;
  }

  // 指标卡片
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }

    &.online .stat-icon {
      background: linear-gradient(135deg, #67c23a, #85ce61);
    }

    &.offline .stat-icon {
      background: linear-gradient(135deg, #f56c6c, #fab6b6);
    }

    &.alert .stat-icon {
      background: linear-gradient(135deg, #e6a23c, #f3d19e);
    }

    &.data .stat-icon {
      background: linear-gradient(135deg, #409eff, #a0cfff);
    }
  }

  // 区块卡片
  .section-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .empty-alert {
    text-align: center;
    color: #909399;
    padding: 40px 0;
  }

  // 图表区域
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }
  }

  .chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
  }

  .chart-container {
    height: 280px;
  }
}
</style>
