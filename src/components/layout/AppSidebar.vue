<template>
  <aside class="app-sidebar">
    <el-menu
      :default-active="activeMenu"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/devices">
        <el-icon><Monitor /></el-icon>
        <span>设备管理</span>
      </el-menu-item>
      <el-menu-item index="/device-groups">
        <el-icon><Grid /></el-icon>
        <span>设备分组</span>
      </el-menu-item>
      <el-sub-menu index="telemetry">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>遥测数据</span>
        </template>
        <el-menu-item index="/telemetry/realtime">实时数据</el-menu-item>
        <el-menu-item index="/telemetry/history">历史数据</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor, Grid, TrendCharts } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped lang="scss">
.app-sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}
</style>