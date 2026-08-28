import { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/Auth/AuthLayout'
import useAuth from '../../hooks/useAuth'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, signIn, sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(
    location.state?.passwordUpdated ? 'Password berhasil diperbarui. Silakan masuk kembali.' : '',
  )

  useEffect(() => {
    if (!session || !profile) return
    const requestedPath = location.state?.from?.pathname
    navigate(requestedPath || (['staff', 'admin'].includes(profile.role) ? '/dashboard' : '/my-reports'), { replace: true })
  }, [session, profile, navigate, location.state])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setNotice('')
    try {
      const signedInProfile = await signIn(email.trim(), password)
      const requestedPath = location.state?.from?.pathname
      const destination = requestedPath || (['staff', 'admin'].includes(signedInProfile.role) ? '/dashboard' : '/my-reports')
      navigate(destination, { replace: true })
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Masukkan email terlebih dahulu untuk menerima tautan pemulihan.')
      return
    }
    setIsResetting(true)
    setError('')
    try {
      await sendPasswordReset(email.trim())
      setNotice('Tautan pemulihan sudah dikirim. Periksa kotak masuk emailmu.')
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AuthLayout mode="login" title="Welcome Back!" subtitle="Masuk untuk melanjutkan perjalanan bersihmu.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Email" required /></label>
        <label><span>Password</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Password" required minLength={6} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>

        <button className="auth-forgot" type="button" onClick={handleForgotPassword} disabled={isResetting}>{isResetting ? 'Mengirim...' : 'Forgot Password?'}</button>
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        {notice && <p className="auth-message auth-message--success" role="status">{notice}</p>}

        <div className="auth-switch"><span>Don&apos;t have an account?</span><Link to="/register">Sign Up</Link></div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}><strong>{isSubmitting ? 'Logging In...' : 'Log In'}</strong><span><ArrowUpRight /></span></button>
      </form>
    </AuthLayout>
  )
}
