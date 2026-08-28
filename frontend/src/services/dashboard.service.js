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
export const getDashboardSummary = (params) => getData('/dashboard/summary', params)
export const getWasteTrend = (params) => getData('/dashboard/waste-trend', params)
export const getCamideSummary = (params) => getData('/dashboard/camide-summary', params)
export const getCamideTrend = (params) => getData('/dashboard/camide-trend', params)
export const getLocationPerformance = (params) => getData('/dashboard/locations', params)
export const getCamideRecent = () => Promise.resolve([])

export const getReports = (params = {}) => getData('/reports', { page: 1, limit: 100, ...params })

export const getWasteRecords = (params = {}) => getData('/waste-records', { page: 1, limit: 100, ...params })

export const getUsers = (params = {}) => getData('/users', { page: 1, limit: 100, ...params })

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
