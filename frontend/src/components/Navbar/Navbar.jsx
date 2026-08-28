import { motion, useReducedMotion } from 'framer-motion'
import './Navbar.css'

const links = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Alur', href: '#alur' },
  { label: 'Edukasi', href: '#edukasi' },
  { label: 'CamIde', href: '#camide' },
  { label: 'Laporan Saya', href: '/my-reports' },
]

function DaurinLogo() {
  return (
    <svg viewBox="0 0 164 54" role="img" aria-label="Daurin">
      <g fill="none" strokeLinecap="round" strokeWidth="7">
        <path d="M13 25A19 19 0 0 1 43 12" stroke="#55ad51" />
        <path d="M43 12a19 19 0 0 1 4 28" stroke="#075735" />
        <path d="M47 40a19 19 0 0 1-30 1" stroke="#075735" />
      </g>
      <circle cx="10" cy="35" r="4.5" fill="#67bd55" />
      <path d="M27 21a12 12 0 0 1 11 8" fill="none" stroke="#075735" strokeLinecap="round" strokeWidth="6" />
      <text x="61" y="37" fill="#075735" fontFamily="Daurin Sans, Arial, sans-serif" fontSize="24" fontWeight="700">Daurin</text>
    </svg>
  )
}

export default function Navbar() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      className="navbar"
      initial={reduceMotion ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#top" className="navbar__brand" aria-label="Daurin home">
        <DaurinLogo />
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
        href="/report"
        className="navbar__cta"
        whileHover={reduceMotion ? undefined : { scale: 1.035, y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      >
        Laporkan
      </motion.a>
    </motion.header>
  )
}
