// 用户角色
export enum Role {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

// 用户状态
export enum UserStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED'
}

// 用户
export interface User {
  id: number
  username: string
  nickname: string | null
  phone: string | null
  email: string | null
  status: UserStatus
  roles: Role[]
  created_at: string
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  expires_in: number
  user: User
}

// 用户查询参数
export interface UserQueryParams {
  page?: number
  page_size?: number
  status?: UserStatus
  keyword?: string
}

// 创建/编辑用户参数
export interface UserFormData {
  username?: string
  password?: string
  nickname?: string
  phone?: string
  email?: string
  roles: Role[]
}