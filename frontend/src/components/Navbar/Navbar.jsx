import { motion, useReducedMotion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import './Navbar.css'

const links = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Alur', href: '#alur' },
  { label: 'Edukasi', href: '#edukasi' },
  { label: 'CamIde', href: '#camide' },
  { label: 'Laporan Saya', href: '/my-reports' },
]

export default function Navbar() {
  const reduceMotion = useReducedMotion()
  const { profile } = useAuth()
  const canOpenDashboard = ['admin', 'staff'].includes(profile?.role)

  return (
    <motion.header
      className="navbar"
      initial={reduceMotion ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#top" className="navbar__brand" aria-label="Daurin home">
        <img src="/logo.png" alt="" aria-hidden="true" />
        <span>Daurin</span>
      </a>

      <nav className="navbar__links" aria-label="Navigasi utama">
        {links.map((link, index) => (
          <motion.a
            key={link.label}
            href={link.href}
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.07, duration: 0.55 }}
          >
            {link.label}
          </motion.a>
        ))}
      </nav>

      <motion.a
        href={canOpenDashboard ? '/dashboard' : '/report'}
        className="navbar__cta"
        whileHover={reduceMotion ? undefined : { scale: 1.035, y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      >
        {canOpenDashboard && <LayoutDashboard aria-hidden="true" />}
        {canOpenDashboard ? 'Dashboard' : 'Laporkan'}
      </motion.a>
    </motion.header>
  )
}
