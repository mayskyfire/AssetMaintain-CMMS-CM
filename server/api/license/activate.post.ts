import { activateLicense } from '../../utils/license'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ license_key: string }>(event)

  if (!body.license_key || typeof body.license_key !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'กรุณากรอก License Key'
    })
  }

  const result = await activateLicense(body.license_key.trim())

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: result.message
    })
  }

  return {
    success: true,
    message: result.message
  }
})
