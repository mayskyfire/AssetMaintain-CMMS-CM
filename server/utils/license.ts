import { randomUUID } from 'crypto'

export interface LicenseInfo {
  license_type: 'trial' | 'licensed'
  status: 'active' | 'expired'
  activated_at: string
  expires_at: string
  days_remaining: number
  is_expired: boolean
}

// In-memory cache เพื่อไม่ต้อง query DB ทุก request
let licenseCache: LicenseInfo | null = null
let licenseCacheTime = 0
const CACHE_TTL = 60_000 // 1 นาที

/**
 * ดึง license ปัจจุบันจาก DB (แถวล่าสุด)
 */
export async function getLicense(): Promise<LicenseInfo | null> {
  // ใช้ cache ถ้ายังไม่หมดอายุ
  if (licenseCache && Date.now() - licenseCacheTime < CACHE_TTL) {
    return licenseCache
  }

  const row = await queryOne<{
    license_type: 'trial' | 'licensed'
    status: 'active' | 'expired'
    activated_at: string
    expires_at: string
  }>(
    'SELECT license_type, status, activated_at, expires_at FROM licenses ORDER BY id DESC LIMIT 1'
  )

  if (!row) return null

  const now = new Date()
  const expiresAt = new Date(row.expires_at)
  const diffMs = expiresAt.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const isExpired = diffMs <= 0

  // ถ้าหมดอายุแล้วแต่ status ยังเป็น active → อัพเดทเป็น expired
  if (isExpired && row.status === 'active') {
    await query(
      'UPDATE licenses SET status = ? WHERE status = ? ORDER BY id DESC LIMIT 1',
      ['expired', 'active']
    )
    row.status = 'expired'
  }

  const info: LicenseInfo = {
    license_type: row.license_type,
    status: isExpired ? 'expired' : row.status,
    activated_at: row.activated_at,
    expires_at: row.expires_at,
    days_remaining: daysRemaining,
    is_expired: isExpired
  }

  licenseCache = info
  licenseCacheTime = Date.now()

  return info
}

/**
 * เช็คว่า license ยัง valid อยู่หรือไม่
 */
export async function isLicenseValid(): Promise<boolean> {
  const license = await getLicense()
  if (!license) return false
  return !license.is_expired
}

/**
 * ล้าง cache (เรียกหลัง activate)
 */
export function clearLicenseCache() {
  licenseCache = null
  licenseCacheTime = 0
}

/**
 * สร้าง trial license อัตโนมัติ (เรียกตอน server start)
 */
export async function initTrialLicense() {
  try {
    const existing = await queryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM licenses'
    )

    if (existing && existing.cnt > 0) {
      console.log('✅ License already exists, skipping trial creation')
      return
    }

    const trialKey = `CMMS-TRIAL-${randomUUID()}`

    await query(
      `INSERT INTO licenses (license_key, license_type, status, activated_at, expires_at, notes)
       VALUES (?, 'trial', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?)`,
      [trialKey, 'Auto-generated trial license']
    )

    console.log(`✅ Trial license created: ${trialKey} (expires in 30 days)`)
  } catch (error) {
    console.error('❌ Failed to init trial license:', error)
  }
}

/**
 * Activate license key
 */
export async function activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
  // ตรวจ format: CMMS-LIC-<UUID v4>
  const regex = /^CMMS-LIC-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!regex.test(licenseKey)) {
    return { success: false, message: 'รูปแบบ License Key ไม่ถูกต้อง' }
  }

  // เช็คว่า key นี้ถูกใช้ไปแล้วหรือยัง
  const existingKey = await queryOne<{ id: number }>(
    'SELECT id FROM licenses WHERE license_key = ?',
    [licenseKey]
  )

  if (existingKey) {
    return { success: false, message: 'License Key นี้ถูกใช้งานแล้ว' }
  }

  // อัพเดท license ปัจจุบัน
  await query(
    `UPDATE licenses 
     SET license_key = ?, license_type = 'licensed', status = 'active',
         activated_at = NOW(), expires_at = '2099-12-31 23:59:59',
         notes = 'Activated by user', updated_at = NOW()
     ORDER BY id DESC LIMIT 1`,
    [licenseKey]
  )

  clearLicenseCache()

  return { success: true, message: 'เปิดใช้งาน License สำเร็จ' }
}
