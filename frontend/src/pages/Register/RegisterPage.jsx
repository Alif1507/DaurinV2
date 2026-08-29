import { useEffect, useState } from 'react'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/Auth/AuthLayout'
import useAuth from '../../hooks/useAuth'
import '../Login/LoginPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { session, profile, signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session && profile) navigate(['staff', 'admin'].includes(profile.role) ? '/dashboard' : '/my-reports', { replace: true })
  }, [session, profile, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Konfirmasi password belum sama.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp(fullName.trim(), email.trim(), password)
      navigate('/my-reports', { replace: true })
    } catch (signUpError) {
      setError(signUpError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="register" title="Buat akun Daurin." subtitle="Mulai melapor, memilah, dan menjaga sekolah bersama.">
      <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
        <label><span>Nama lengkap</span><input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Nama Lengkap" required minLength={2} maxLength={150} /></label>
        <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Email" required /></label>
        <label><span>Password</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Password" required minLength={8} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
        <label><span>Konfirmasi password</span><input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="Konfirmasi Password" required minLength={8} /></label>

        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        <div className="auth-switch"><span>Sudah punya akun?</span><Link to="/login">Masuk</Link></div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}><strong>{isSubmitting ? 'Membuat akun...' : 'Daftar'}</strong><span><ArrowUpRight /></span></button>
      </form>
    </AuthLayout>
  )
}
