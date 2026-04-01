import jwt from 'jsonwebtoken'
import { env } from './env.js'

const TOKEN_EXPIRY = '8h'
const COOKIE_NAME = 'assessment_token'

export function signAuthToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  })
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function getAuthCookieOptions() {
  const isProd = env.nodeEnv === 'production'

  return {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  }
}

export { COOKIE_NAME }
