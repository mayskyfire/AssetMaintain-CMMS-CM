import { isLicenseValid } from '../utils/license'

// Routes ที่ยกเว้นจาก license check
const WHITELIST_PREFIXES = [
  '/api/auth/',
  '/api/license/',
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  const method = event.method.toUpperCase()

  // เฉพาะ API requests เท่านั้น
  if (!path.startsWith('/api/')) return

  // GET requests ผ่านเสมอ (read-only mode)
  if (method === 'GET') return

  // Whitelist routes ผ่านเสมอ
  for (const prefix of WHITELIST_PREFIXES) {
    if (path.startsWith(prefix)) return
  }

  // เช็ค license สำหรับ write operations (POST/PUT/PATCH/DELETE)
  const valid = await isLicenseValid()
  if (!valid) {
    throw createError({
      statusCode: 403,
      statusMessage: 'License Expired',
      data: { code: 'LICENSE_EXPIRED' },
      message: 'หมดอายุทดลองใช้งาน กรุณากรอก License Key เพื่อใช้งานต่อ'
    })
  }
})
