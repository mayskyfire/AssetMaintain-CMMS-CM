/**
 * Convert a Date to Thailand timezone (UTC+7) MySQL datetime string
 * Format: 'YYYY-MM-DD HH:MM:SS'
 */
export function toThaiDatetime(date?: Date | string): string {
  const d = date ? new Date(date) : new Date()
  // Add 7 hours to convert UTC to Thailand time
  const thai = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return thai.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Get current Thailand datetime as ISO string (for frontend/API responses)
 * Returns: '2026-02-28T12:30:00.000Z' but adjusted to +07:00
 */
export function toThaiISOString(date?: Date | string): string {
  const d = date ? new Date(date) : new Date()
  const thai = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return thai.toISOString()
}
