import axios from 'axios'
import { getSupabase } from '../lib/supabase'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, ''),
  timeout: 20000,
})

api.interceptors.request.use(async (config) => {
  const supabase = await getSupabase()
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail?.message
      || (error.code === 'ECONNABORTED' ? 'Server terlalu lama merespons.' : 'Data tidak dapat dimuat.')
    error.userMessage = message
    return Promise.reject(error)
  },
)

export default api
