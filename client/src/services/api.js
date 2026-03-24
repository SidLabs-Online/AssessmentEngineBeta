const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}`,
    )
  }

  return payload
}

export function fetchSession() {
  return request('/api/auth/session')
}

export function loginCandidate(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logoutCandidate() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

export function validateCandidateDetailsOnServer(candidateDetails) {
  return request('/api/candidate-details/validate', {
    method: 'POST',
    body: JSON.stringify(candidateDetails),
  })
}

export function submitAssessmentPayload(payload) {
  return request('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export { API_BASE_URL }
