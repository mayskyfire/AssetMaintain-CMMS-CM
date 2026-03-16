import { initTrialLicense } from '../utils/license'

export default defineNitroPlugin(async () => {
  // รอให้ DB pool พร้อมก่อน แล้วสร้าง trial license ถ้ายังไม่มี
  // ใช้ setTimeout เพื่อให้ Nitro boot เสร็จก่อน
  setTimeout(async () => {
    try {
      await initTrialLicense()
    } catch (error) {
      console.error('❌ License plugin error:', error)
    }
  }, 3000)
})
