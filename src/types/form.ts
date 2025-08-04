// ==================== 表单验证相关接口 ====================

/**
 * 表单验证规则
 */
export interface FormRule {
  required?: boolean
  message: string
  trigger: string
  min?: number
  max?: number
  type?: string
}

/**
 * 表单验证规则集合
 */
export interface FormRules {
  [key: string]: FormRule[]
}
