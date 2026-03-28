const BASE = 'http://localhost:3000/api'

function getToken() {
  const token = localStorage.getItem('hn_token')
  if (token === 'undefined' || token === 'null') {
    localStorage.removeItem('hn_token')
    return null
  }
  return token
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(method, path, { body, json = true, formData } = {}) {
  const headers = authHeaders(json && !formData ? { 'Content-Type': 'application/json' } : {})
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData ? formData : (body ? JSON.stringify(body) : undefined),
  })
  let data
  try { data = await res.json() } catch { data = {} }
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Request failed'), { status: res.status, data })

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data
  }
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body) => request('POST', '/users/register', { body }),
    login: (body) => request('POST', '/users/login', { body }),
    me: () => request('GET', '/users/me'),
    logout: () => request('POST', '/users/logout'),
  },

  // ── Videos ────────────────────────────────────────────────────────
  videos: {
    getAll: () => request('GET', '/videos'),
    getById: (id) => request('GET', `/videos/${id}`),
    upload: (formData) => request('POST', '/videos/upload', { formData }),
    update: (id, payload, isFormData = false) => request('PATCH', `/videos/${id}`, isFormData ? { formData: payload } : { body: payload }),
    delete: (id) => request('DELETE', `/videos/${id}`),
    view: (id) => request('POST', `/videos/${id}/view`, { json: false }),
    liveHeartbeat: (streamKey, viewerId) => request('POST', `/videos/live/${streamKey}/heartbeat`, { body: viewerId ? { viewerId } : {} }),
    liveStats: (streamKey) => request('GET', `/videos/live/${streamKey}/stats`),
  },

  // ── Users ─────────────────────────────────────────────────────────
  users: {
    getVideos: (username) => request('GET', `/users/${username}/videos`),
    regenerateStreamKey: () => request('POST', '/users/streamkey/regenerate'),
  },
}
