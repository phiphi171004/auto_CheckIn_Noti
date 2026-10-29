const BASE = '/api'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
  } catch {
    throw new Error('Không kết nối được máy chủ.')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // A proxy or a missing route can answer with HTML.
  }

  if (!response.ok || data?.success === false) {
    const message = data?.error || `Máy chủ trả về ${response.status}.`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

export const api = {
  accounts: () => request('/accounts'),
  addAccount: (payload) =>
    request('/accounts', { method: 'POST', body: JSON.stringify(payload) }),
  addGoogleAccount: (payload) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  setSchedule: (id, cronSchedule) =>
    request(`/accounts/${id}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ cronSchedule })
    }),
  setActive: (id, isActive) =>
    request(`/accounts/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    }),
  removeAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  checkin: (id) => request(`/checkin/${id}`, { method: 'POST' }),
  checkinAll: () => request('/checkin', { method: 'POST' }),
  history: (limit = 100) => request(`/history?limit=${limit}`)
}
