import api from './api'

function definedParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ''))
}

async function getData(path, params) {
  const response = await api.get(path, { params: definedParams(params) })
  return response.data.data
}

export const getCurrentUser = () => getData('/auth/me', {})
export const getLocations = () => getData('/locations', {})
export async function createLocation(payload) {
  const response = await api.post('/locations', payload)
  return response.data.data
}
export async function updateLocation({ locationId, payload }) {
  const response = await api.patch(`/locations/${locationId}`, payload)
  return response.data.data
}
export async function deleteLocation(locationId) {
  await api.delete(`/locations/${locationId}`)
  return locationId
}
export const getDashboardSummary = (params) => getData('/dashboard/summary', params)
export const getWasteTrend = (params) => getData('/dashboard/waste-trend', params)
export const getCamideSummary = (params) => getData('/dashboard/camide-summary', params)
export const getCamideTrend = (params) => getData('/dashboard/camide-trend', params)
export const getLocationPerformance = (params) => getData('/dashboard/locations', params)
export const getCamideRecent = (limit = 100) => getData('/camide/recent', { limit })

export const getReports = (params = {}) => getData('/reports', { page: 1, limit: 100, ...params })

export async function startReport(reportId) {
  const response = await api.patch(`/reports/${reportId}/start`)
  return response.data.data
}

export async function resolveReport({ reportId, resolutionNote, file }) {
  const body = new FormData()
  body.append('resolution_note', resolutionNote)
  body.append('file', file)
  const response = await api.patch(`/reports/${reportId}/resolve`, body)
  return response.data.data
}

export const getWasteRecords = (params = {}) => getData('/waste-records', { page: 1, limit: 100, ...params })

export async function createWasteRecord(payload) {
  const response = await api.post('/waste-records', payload)
  return response.data.data
}

export async function updateWasteRecord({ recordId, payload }) {
  const response = await api.patch(`/waste-records/${recordId}`, payload)
  return response.data.data
}

export async function deleteWasteRecord(recordId) {
  await api.delete(`/waste-records/${recordId}`)
  return recordId
}

export const getUsers = (params = {}) => getData('/users', { page: 1, limit: 100, ...params })

export async function updateUserRole({ userId, role }) {
  const response = await api.patch(`/users/${userId}`, { role })
  return response.data.data
}

export const getRecentReports = (params) => getData('/reports', {
    page: 1,
    limit: 6,
    date_from: params.start_date,
    date_to: params.end_date,
    location_id: params.location_id,
  })

export const getRecentWaste = (params) => getData('/waste-records', {
    page: 1,
    limit: 6,
    start_date: params.start_date,
    end_date: params.end_date,
    location_id: params.location_id,
  })
