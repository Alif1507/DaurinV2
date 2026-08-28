import { createClient } from '@supabase/supabase-js'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
let clientPromise

async function loadPublicConfig() {
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL
  const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (configuredUrl && configuredKey) {
    return { supabase_url: configuredUrl, supabase_anon_key: configuredKey }
  }

  const response = await fetch(`${API_URL}/auth/config`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail?.message || 'Konfigurasi login belum tersedia.')
  }
  return payload.data
}

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = loadPublicConfig().then((config) => createClient(
      config.supabase_url,
      config.supabase_anon_key,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    ))
  }
  return clientPromise
}
