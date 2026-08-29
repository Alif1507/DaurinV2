import { useState } from 'react'
import {
  Camera,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Recycle,
  School,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const navigation = [
  { label: 'Ringkasan', icon: LayoutDashboard, to: '/dashboard', exact: true },
  { label: 'Laporan', icon: Trash2, to: '/dashboard/reports' },
  { label: 'Data sampah', icon: Recycle, to: '/dashboard/waste' },
  { label: 'CAMIDE', icon: Camera, to: '/dashboard/camide' },
  { label: 'Lokasi', icon: MapPin, to: '/dashboard/locations' },
  { label: 'Pengguna', icon: Users, to: '/dashboard/users', adminOnly: true },
]

export default function DashboardShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { profile, signOut } = useAuth()

  return (
    <div className="dashboard-shell">
      <button className="dashboard-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Buka navigasi"><Menu /></button>
      {menuOpen && <button type="button" className="dashboard-sidebar-backdrop" aria-label="Tutup navigasi" onClick={() => setMenuOpen(false)} />}
      <aside className={`dashboard-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="dashboard-sidebar__head">
          <Link className="dashboard-brand" to="/"><img className="dashboard-brand__logo" src="/logo.png" alt="" aria-hidden="true" /><strong>Daurin</strong></Link>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup navigasi"><X /></button>
        </div>
        <div className="dashboard-school"><School /><div><span>DAURIN</span><strong>Operations suite</strong></div></div>
        <span className="dashboard-nav__label">Ruang kerja</span>
        <nav className="dashboard-nav" aria-label="Navigasi dashboard">
          {navigation.filter((item) => !item.adminOnly || profile?.role === 'admin').map((item) => {
            const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
            const content = <><item.icon /><span>{item.label}</span>{isActive && <i />}</>
            return <Link key={item.label} className={isActive ? 'is-active' : ''} to={item.to} onClick={() => setMenuOpen(false)}>{content}</Link>
          })}
        </nav>
        <Link className="dashboard-sidebar__action" to="/report" onClick={() => setMenuOpen(false)}><Plus /> Buat laporan</Link>
        <div className="dashboard-user">
          <span className="dashboard-user__avatar">{profile?.full_name?.slice(0, 1).toUpperCase()}</span>
          <div><strong>{profile?.full_name}</strong><span>{profile?.role}</span></div>
          <button type="button" onClick={signOut} aria-label="Keluar"><LogOut /></button>
        </div>
        <Link className="dashboard-back" to="/"><ChevronLeft /> Kembali ke situs</Link>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  )
}
