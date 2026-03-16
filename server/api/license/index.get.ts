import { getLicense } from '../../utils/license'

export default defineEventHandler(async () => {
  const license = await getLicense()

  if (!license) {
    return {
      success: true,
      data: null,
      message: 'ไม่พบข้อมูล License'
    }
  }

  return {
    success: true,
    data: license
  }
})
