import api from './api'

export async function getReportingLocations() {
  const response = await api.get('/locations')
  return response.data.data
}

export async function getMyReports(status = '') {
  const response = await api.get('/reports/me', { params: { page: 1, limit: 100, status: status || undefined } })
  return response.data.data
}

export async function createReport(payload) {
  const response = await api.post('/reports', payload)
  return response.data.data
}

export async function uploadReportImage(reportId, file) {
  const body = new FormData()
  body.append('file', file)
  const response = await api.post(`/reports/${reportId}/image`, body)
  return response.data.data
}
