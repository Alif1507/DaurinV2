import { ChevronLeft, ClipboardList, LogOut, Plus, School } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const roleLabels = { student: 'Siswa', teacher: 'Guru', staff: 'Staf', admin: 'Admin' }

function ReportingMark() {
  return <span className="reporting-mark" aria-hidden="true"><span /><span /><span /></span>
}

export default function ReportingShell({ children, active }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="reporting-shell">
      <header className="reporting-nav">
        <Link className="reporting-brand" to="/"><ReportingMark /><span><strong>Daurin</strong><small>Suara kebersihan sekolah</small></span></Link>
        <nav aria-label="Navigasi pelaporan">
          <Link className={active === 'new' ? 'is-active' : ''} to="/report"><Plus /> Buat laporan</Link>
          <Link className={active === 'history' ? 'is-active' : ''} to="/my-reports"><ClipboardList /> Laporan saya</Link>
        </nav>
        <div className="reporting-profile">
          <span>{profile?.full_name?.slice(0, 1).toUpperCase()}</span>
          <div><strong>{profile?.full_name}</strong><small>{roleLabels[profile?.role]}</small></div>
          <button type="button" onClick={signOut} aria-label="Keluar"><LogOut /></button>
        </div>
      </header>
      <main className="reporting-main">{children}</main>
      <footer className="reporting-footer"><Link to="/"><ChevronLeft /> Kembali ke situs utama</Link><span><School /> RE-SCHOOL · Laporan kebersihan bersama</span></footer>
    </div>
  )
}
