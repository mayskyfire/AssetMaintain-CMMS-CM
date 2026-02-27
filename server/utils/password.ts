import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a simple JWT-like token (for development)
 * In production, use proper JWT library like jsonwebtoken
 */
export function generateToken(userId: number, email: string): string {
  const payload = {
    userId,
    email,
    timestamp: Date.now()
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): { userId: number; email: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const payload = JSON.parse(decoded)
    
    // Check if token is expired (24 hours)
    const now = Date.now()
    const tokenAge = now - payload.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}
