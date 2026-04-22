import { get, post, put, del } from './request'
import type {
  ControlCommand,
  CreateCommandParams,
  CommandQueryParams,
  ControlRule,
  ControlRuleFormData,
  RuleQueryParams,
  PaginatedData
} from '@/types'

// ===== 控制命令 =====

// 获取命令列表
export const getCommands = (params?: CommandQueryParams) =>
  get<PaginatedData<ControlCommand>>('/controls/commands', params)

// 获取命令详情
export const getCommandDetail = (id: number) =>
  get<ControlCommand>(`/controls/commands/${id}`)

// 下发命令
export const createCommand = (data: CreateCommandParams) =>
  post<ControlCommand>('/controls/commands', data)

// ===== 控制规则 =====

// 获取规则列表
export const getRules = (params?: RuleQueryParams) =>
  get<PaginatedData<ControlRule>>('/controls/rules', params)

// 获取规则详情
export const getRuleDetail = (id: number) =>
  get<ControlRule>(`/controls/rules/${id}`)

// 创建规则
export const createRule = (data: ControlRuleFormData) =>
  post<ControlRule>('/controls/rules', data)

// 更新规则
export const updateRule = (id: number, data: ControlRuleFormData) =>
  put<ControlRule>(`/controls/rules/${id}`, data)

// 删除规则
export const deleteRule = (id: number) =>
  del<void>(`/controls/rules/${id}`)

// 启用/禁用规则
export const toggleRule = (id: number, enabled: boolean) =>
  put<ControlRule>(`/controls/rules/${id}`, { enabled })
