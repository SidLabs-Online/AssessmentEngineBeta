import { COOKIE_NAME, verifyAuthToken } from '../config/auth.js'

export function requireAuth(request, response, next) {
  const token = request.cookies?.[COOKIE_NAME]

  if (!token) {
    return response.status(401).json({
      message: 'Authentication required.',
    })
  }

  try {
    request.user = verifyAuthToken(token)
    return next()
  } catch {
    return response.status(401).json({
      message: 'Session is invalid or expired.',
    })
  }
}
