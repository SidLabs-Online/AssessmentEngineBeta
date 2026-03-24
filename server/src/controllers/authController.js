import { COOKIE_NAME, getAuthCookieOptions } from '../config/auth.js'
import {
  authenticateCandidate,
  validateLoginInput,
} from '../services/authService.js'

export async function login(request, response) {
  console.info('[server] auth route hit: login')

  const validationError = validateLoginInput(request.body)

  if (validationError) {
    console.warn('[server] login failure: validation')
    return response.status(400).json({
      message: validationError,
    })
  }

  const result = await authenticateCandidate(request.body)

  if (!result) {
    console.warn(`[server] login failure: ${request.body.email}`)
    return response.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  response.cookie(COOKIE_NAME, result.token, getAuthCookieOptions())

  console.info(`[server] login success: ${result.user.email}`)
  return response.status(200).json({
    message: 'Login successful.',
    user: result.user,
  })
}

export function getSession(request, response) {
  console.info('[server] auth route hit: session')
  return response.status(200).json({
    user: {
      email: request.user.email,
      id: request.user.sub,
      name: request.user.name,
      role: request.user.role,
    },
  })
}

export function logout(_request, response) {
  console.info('[server] auth route hit: logout')
  response.clearCookie(COOKIE_NAME, getAuthCookieOptions())
  return response.status(200).json({
    message: 'Logout successful.',
  })
}
