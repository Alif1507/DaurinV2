import { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/Auth/AuthLayout'
import useAuth from '../../hooks/useAuth'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session || !profile) return
    const requestedPath = location.state?.from?.pathname
    navigate(requestedPath || (['staff', 'admin'].includes(profile.role) ? '/dashboard' : '/my-reports'), { replace: true })
  }, [session, profile, navigate, location.state])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
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

  return (
    <AuthLayout mode="login" title="Selamat datang kembali." subtitle="Masuk untuk melanjutkan aksi bersihmu di sekolah.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Email" required /></label>
        <label><span>Password</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Password" required minLength={6} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>

        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}

        <div className="auth-switch"><span>Belum punya akun?</span><Link to="/register">Daftar</Link></div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}><strong>{isSubmitting ? 'Sedang masuk...' : 'Masuk'}</strong><span><ArrowUpRight /></span></button>
      </form>
    </AuthLayout>
  )
}
