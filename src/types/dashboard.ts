// 仪表盘概览数据
export interface DashboardOverview {
  online_devices: number
  offline_devices: number
  active_alerts: number
  today_data_points: number
}

// 告警摘要
export interface AlertSummary {
  id: number
  type: string
  level: string
  message: string
  device_name: string
  created_at: string
}

// 设备类型分布
export interface DeviceTypeDistribution {
  type: string
  count: number
}

// 设备分组分布
export interface DeviceGroupDistribution {
  group_name: string
  count: number
}

// 仪表盘完整数据
export interface DashboardData {
  overview: DashboardOverview
  recent_alerts: AlertSummary[]
  device_type_distribution: DeviceTypeDistribution[]
  device_group_distribution: DeviceGroupDistribution[]
}
