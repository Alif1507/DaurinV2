import { useState } from 'react'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/Auth/AuthLayout'
import useAuth from '../../hooks/useAuth'
import '../Login/LoginPage.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!session) {
      setError('Tautan pemulihan tidak valid atau sudah kedaluwarsa.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (password !== confirmation) {
      setError('Konfirmasi password belum sama.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await updatePassword(password)
      await signOut()
      navigate('/login', { replace: true, state: { passwordUpdated: true } })
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout mode="reset" title="New Password" subtitle="Pilih password baru untuk akun Daurinmu.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label><span>Password baru</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Password Baru" required minLength={8} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
        <label><span>Konfirmasi password</span><input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="Konfirmasi Password" required minLength={8} /></label>
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        <div className="auth-switch"><span>Remember your password?</span><Link to="/login">Log In</Link></div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}><strong>{isSubmitting ? 'Saving...' : 'Save'}</strong><span><ArrowUpRight /></span></button>
      </form>
    </AuthLayout>
  )
}
