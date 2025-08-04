// ==================== 类型别名 ====================

/**
 * 星期常量
 */
export const Weekday = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const

/**
 * 星期类型
 */
export type WeekdayType = typeof Weekday[keyof typeof Weekday]
