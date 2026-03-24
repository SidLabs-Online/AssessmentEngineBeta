import { signAuthToken } from '../config/auth.js'
import { env } from '../config/env.js'

const demoUser = {
  email: env.demoUserEmail,
  id: 'demo-candidate-001',
  name: 'SidLabs Demo Candidate',
  role: 'candidate',
}

export function validateLoginInput({ email, password } = {}) {
  if (!email || !password) {
    return 'Email and password are required.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'A valid email address is required.'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  return null
}

export async function authenticateCandidate({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase()

  if (
    normalizedEmail !== env.demoUserEmail.toLowerCase() ||
    password !== env.demoUserPassword
  ) {
    return null
  }

  return {
    token: signAuthToken({
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
      sub: demoUser.id,
    }),
    user: demoUser,
  }
}
