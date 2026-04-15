const stripTrailingSlash = (value = '') => String(value).replace(/\/+$/, '')

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''))

const toPath = (value = '') => String(value).replace(/^\/+/, '')

const API_ORIGIN = stripTrailingSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
const MINIO_ORIGIN = stripTrailingSlash(import.meta.env.VITE_MINIO_BASE_URL || 'http://localhost:9000')
const LIVE_ORIGIN = stripTrailingSlash(import.meta.env.VITE_LIVE_BASE_URL || 'http://localhost:8080')

export const URLS = {
  API_BASE: `${API_ORIGIN}/api`,
  MINIO_BASE: MINIO_ORIGIN,
  LIVE_BASE: LIVE_ORIGIN,
}

export const buildUrl = (base, value) => {
  if (!value) return ''
  if (isAbsoluteUrl(value)) return value
  return `${stripTrailingSlash(base)}/${toPath(value)}`
}
