import type { User } from '../context/AuthContext'

const MOCK_SECRET = import.meta.env.VITE_JWT_SECRET || 'fallback-secret-if-missing'

// Base64 encode utility supporting utf-8
function base64Encode(obj: any): string {
  return btoa(encodeURIComponent(JSON.stringify(obj)))
}

// Base64 decode utility supporting utf-8
function base64Decode(str: string): any {
  try {
    return JSON.parse(decodeURIComponent(atob(str)))
  } catch {
    return null
  }
}

/**
 * Generates a mock JWT token containing user data and an expiration.
 */
export function generateToken(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  // Expire in 24 hours
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  
  const payload = {
    user,
    exp,
    iss: 'mediai-auth-server'
  }

  const encodedHeader = base64Encode(header)
  const encodedPayload = base64Encode(payload)
  
  // Simulated signature
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${MOCK_SECRET}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Verifies a mock JWT token.
 * Returns the decoded user if valid and not expired, otherwise throws an error.
 */
export function verifyToken(token: string | null): User {
  if (!token) {
    throw new Error('No token provided')
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const [encodedHeader, encodedPayload, signature] = parts

  // Verify signature
  const expectedSignature = btoa(`${encodedHeader}.${encodedPayload}.${MOCK_SECRET}`)
  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature')
  }

  const payload = base64Decode(encodedPayload)
  if (!payload) {
    throw new Error('Failed to decode token payload')
  }

  // Verify expiration
  const currentTimestamp = Math.floor(Date.now() / 1000)
  if (payload.exp && currentTimestamp > payload.exp) {
    throw new Error('Token has expired')
  }

  return payload.user
}
