import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../contexts/auth-context'
import { getSupabase } from '../lib/supabase'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

async function requestProfile(accessToken) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail?.message || 'Profil pengguna tidak dapat dimuat.')
  }
  return payload.data
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshProfile = useCallback(async (activeSession = session) => {
    if (!activeSession?.access_token) {
      setProfile(null)
      return null
    }
    try {
      const nextProfile = await requestProfile(activeSession.access_token)
      setProfile(nextProfile)
      setError('')
      return nextProfile
    } catch (profileError) {
      setProfile(null)
      setError(profileError.message)
      throw profileError
    }
  }, [session])

  useEffect(() => {
    let mounted = true
    let subscription

    async function initialise() {
      try {
        const supabase = await getSupabase()
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session)
        if (data.session) {
          try {
            await requestProfile(data.session.access_token).then((nextProfile) => {
              if (mounted) setProfile(nextProfile)
            })
          } catch (profileError) {
            if (mounted) setError(profileError.message)
          }
        }

        const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) return
          setSession(nextSession)
          if (!nextSession) {
            setProfile(null)
            setError('')
          } else {
            requestProfile(nextSession.access_token)
              .then((nextProfile) => mounted && setProfile(nextProfile))
              .catch((profileError) => mounted && setError(profileError.message))
          }
        })
        subscription = listener.data.subscription
      } catch (initialError) {
        if (mounted) setError(initialError.message)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initialise()
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const supabase = await getSupabase()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw new Error('Email atau kata sandi tidak cocok.')
    setSession(data.session)
    const nextProfile = await requestProfile(data.session.access_token)
    setProfile(nextProfile)
    setError('')
    return nextProfile
  }, [])

  const signUp = useCallback(async (fullName, email, password) => {
    const supabase = await getSupabase()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already')) {
        throw new Error('Email ini sudah terdaftar. Silakan masuk.')
      }
      throw new Error(signUpError.message || 'Akun belum dapat dibuat.')
    }
    if (!data.session) {
      throw new Error('Pendaftaran langsung belum aktif. Hubungi administrator sekolah.')
    }
    setSession(data.session)
    const nextProfile = await requestProfile(data.session.access_token)
    setProfile(nextProfile)
    setError('')
    return nextProfile
  }, [])

  const signOut = useCallback(async () => {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setError('')
  }, [])

  const value = useMemo(() => ({
    session,
    profile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [session, profile, isLoading, error, signIn, signUp, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
