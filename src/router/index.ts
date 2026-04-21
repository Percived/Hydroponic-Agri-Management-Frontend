import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { Role } from '@/types'
import { getToken } from '@/utils/storage'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    redirect: '/devices'
  },
  {
    path: '/devices',
    name: 'DeviceList',
    component: () => import('@/views/devices/list.vue'),
    meta: { requiresAuth: true, title: '设备列表' }
  },
  {
    path: '/devices/:id',
    name: 'DeviceDetail',
    component: () => import('@/views/devices/detail.vue'),
    meta: { requiresAuth: true, title: '设备详情' }
  },
  {
    path: '/device-groups',
    name: 'DeviceGroups',
    component: () => import('@/views/device-groups/index.vue'),
    meta: { requiresAuth: true, title: '设备分组' }
  },
  {
    path: '/telemetry/realtime',
    name: 'TelemetryRealtime',
    component: () => import('@/views/telemetry/realtime.vue'),
    meta: { requiresAuth: true, title: '实时数据' }
  },
  {
    path: '/telemetry/history',
    name: 'TelemetryHistory',
    component: () => import('@/views/telemetry/history.vue'),
    meta: { requiresAuth: true, title: '历史数据' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false, title: '页面不存在' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || '水培农业管理系统'

  // 不需要认证的页面直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 检查是否登录
  const token = getToken()
  if (!token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 角色权限检查
  const requiredRoles = to.meta.roles as Role[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    // 动态获取用户角色
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    if (!authStore.hasAnyRole(requiredRoles)) {
      next({ name: 'DeviceList' })
      return
    }
  }

  next()
})

export default router