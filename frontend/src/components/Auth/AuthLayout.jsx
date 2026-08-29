import { ArrowLeft, CircleUserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ mode, title, subtitle, children }) {
  const usesLoginArtwork = mode === 'login'

  return (
    <main className={`auth-scene auth-scene--${mode}`}>
      <Link to="/" className="auth-home" aria-label="Kembali ke situs Daurin">
        <ArrowLeft /><img src="/logo.png" alt="" /><span>Daurin</span>
      </Link>

      <div className="auth-art" aria-hidden="true">
        <img className="auth-art__ribbon" src={`/img/auth/${usesLoginArtwork ? 'ribbon-login-v2' : 'ribbon-register-v2'}.png`} alt="" />
        <div className="auth-art__identity">
          <img src="/logo.png" alt="" />
        </div>
      </div>

      <section className="auth-card" aria-labelledby={`${mode}-title`}>
        <span className="auth-card__avatar" aria-hidden="true"><CircleUserRound /></span>
        <div className="auth-card__content">
          <header>
            <h1 id={`${mode}-title`}>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </header>
          {children}
        </div>
      </section>
    </main>
  )
}
