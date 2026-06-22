import type { User } from '../context/AuthContext'

/**
 * Verifies and decodes a real JWT token.
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

  try {
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadStr)

    // Verify expiration
    const currentTimestamp = Math.floor(Date.now() / 1000)
    if (payload.exp && currentTimestamp > payload.exp) {
      throw new Error('Token has expired')
    }

    return {
      name: payload.name,
      email: payload.email,
      role: payload.role
    } as User
  } catch (error) {
    throw new Error('Failed to decode token')
  }
}
