import type { Ref } from 'vue'
import { computed } from 'vue'

const staticWeekdayOptions = [
  { label: '周一', shortLabel: '一', value: 1 },
  { label: '周二', shortLabel: '二', value: 2 },
  { label: '周三', shortLabel: '三', value: 3 },
  { label: '周四', shortLabel: '四', value: 4 },
  { label: '周五', shortLabel: '五', value: 5 },
  { label: '周六', shortLabel: '六', value: 6 },
  { label: '周日', shortLabel: '日', value: 0 },
]

export function useWeekdays(isSmallScreen: Ref<boolean>) {
  const responsiveWeekdayOptions = computed(() =>
    staticWeekdayOptions.map(opt => ({
      value: opt.value,
      label: isSmallScreen.value ? opt.shortLabel : opt.label,
    })),
  )

  function getWeekdaySummary(weekdays: number[]): string {
    if (!weekdays || weekdays.length === 0)
      return '不重复'
    if (weekdays.length === 7)
      return '每天'

    const daySet = new Set(weekdays)
    if (daySet.size === 5 && [1, 2, 3, 4, 5].every(d => daySet.has(d)))
      return '工作日'
    if (daySet.size === 2 && [0, 6].every(d => daySet.has(d)))
      return '周末'

    const dayMap = new Map(
      staticWeekdayOptions.map(opt => [opt.value, isSmallScreen.value ? opt.shortLabel : opt.label]),
    )
    const displayOrder = [1, 2, 3, 4, 5, 6, 0]

    return displayOrder
      .filter(dayValue => daySet.has(dayValue))
      .map(dayValue => dayMap.get(dayValue))
      .join(', ')
  }

  return {
    responsiveWeekdayOptions,
    getWeekdaySummary,
    staticWeekdayOptions,
  }
}
