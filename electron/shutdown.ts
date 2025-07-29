import { getConfig } from './config'

// Store shutdown timers
let shutdownTimers: NodeJS.Timeout[] = []

// Schedule shutdown based on config
export function scheduleShutdowns() {
  // Clear existing timers
  shutdownTimers.forEach(timer => clearTimeout(timer))
  shutdownTimers = []

  const config = getConfig()
  if (!config.shutdownTimes || !config.shutdownTimes.length)
    return

  const now = new Date()

  config.shutdownTimes.forEach((shutdownTime: any) => {
    if (!shutdownTime.time || !shutdownTime.weekdays || !shutdownTime.weekdays.length)
      return

    const [hours, minutes, seconds] = shutdownTime.time.split(':').map(Number)

    // Schedule for each selected weekday
    shutdownTime.weekdays.forEach((weekday: number) => {
      const targetDate = new Date()

      // Set time
      targetDate.setHours(hours, minutes, seconds, 0)

      // Adjust day to next occurrence of the weekday
      const currentDay = now.getDay()
      let daysToAdd = weekday - currentDay

      if (daysToAdd < 0) {
        daysToAdd += 7
      }
      else if (daysToAdd === 0 && now > targetDate) {
        daysToAdd = 7
      }

      targetDate.setDate(targetDate.getDate() + daysToAdd)

      // Calculate timeout
      const timeUntilShutdown = targetDate.getTime() - now.getTime()

      if (timeUntilShutdown > 0) {
        const timer = setTimeout(() => {
          executeShutdown()
        }, timeUntilShutdown)

        shutdownTimers.push(timer)
      }
    })
  })
}

// Execute the shutdown command
export function executeShutdown() {}
