import { ArrowLeft, CircleUserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ mode, title, subtitle, children }) {
  return (
    <main className={`auth-scene auth-scene--${mode}`}>
      <Link to="/" className="auth-home" aria-label="Kembali ke situs Daurin">
        <ArrowLeft /><img src="/logo.png" alt="" /><span>Daurin</span>
      </Link>

      <div className="auth-art" aria-hidden="true">
        <span className="auth-art__blob auth-art__blob--one" />
        <span className="auth-art__blob auth-art__blob--two" />
        <img className="auth-art__logo" src="/logo.png" alt="" />
      </div>

      <section className="auth-card" aria-labelledby={`${mode}-title`}>
        <div className="auth-card__notch auth-card__notch--top" />
        <div className="auth-card__notch auth-card__notch--bottom" />
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
