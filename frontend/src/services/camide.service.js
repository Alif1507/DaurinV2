import api from './api'

export async function identifyWaste(imageBlob) {
  const formData = new FormData()
  formData.append('file', imageBlob, 'waste-capture.jpg')

  try {
    const response = await api.post('/camide/identify', formData)
    return response.data.data
  } catch (requestError) {
    const error = new Error(
      requestError.response?.status === 401
        ? 'Silakan login sebelum menggunakan identifikasi CAMIDE.'
        : requestError.userMessage || 'Identifikasi gagal. Silakan coba lagi.',
    )
    error.status = requestError.response?.status
    error.code = requestError.response?.data?.detail?.code
    throw error
  }
}
