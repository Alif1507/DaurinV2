import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  Bot,
  Leaf,
  MapPin,
  Recycle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/Dashboard/DashboardShell'
import { PanelError, PanelLoading } from '../../components/Dashboard/DashboardStates'
import {
  getCamideRecent,
  getCamideSummary,
  getDashboardSummary,
  getLocationPerformance,
  getLocations,
  getReports,
  getUsers,
  getWasteRecords,
} from '../../services/dashboard.service'
import {
  categoryLabels,
  formatKg,
  formatNumber,
  formatPercent,
  formatShortDate,
  problemLabels,
  statusLabels,
} from '../../utils/formatters'
import './DashboardPage.css'

const roleLabels = {
  admin: 'Admin',
  staff: 'Staf',
  teacher: 'Guru',
  student: 'Siswa',
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function WorkspaceHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <header className="dashboard-heading workspace-heading">
      <div>
        <span className="dashboard-heading__eyebrow"><Icon /> {eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="dashboard-heading__status"><span /><div><strong>Data terhubung</strong><small>FastAPI + Supabase</small></div></div>
    </header>
  )
}

function OperationsBand({ label, title, detail, items }) {
  return (
    <section className="operations-band">
      <div className="operations-band__lead"><span>{label}</span><strong>{title}</strong><small>{detail}</small></div>
      <div className="operations-band__metrics">
        {items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}
      </div>
    </section>
  )
}

function SearchControl({ value, onChange, placeholder }) {
  return (
    <label className="workspace-search">
      <Search />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function LoadingPanel() {
  return <section className="dashboard-panel"><PanelLoading /></section>
}

function ErrorPanel({ query }) {
  return <section className="dashboard-panel"><PanelError message={query.error?.userMessage} onRetry={query.refetch} /></section>
}

export function ReportsDashboardPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const reportsQuery = useQuery({ queryKey: ['reports', 'workspace'], queryFn: () => getReports() })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary', 'workspace'], queryFn: () => getDashboardSummary({}) })
  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((location) => [location.id, location.name])), [locationsQuery.data])
  const reports = useMemo(() => (reportsQuery.data || []).filter((report) => {
    const phrase = `${problemLabels[report.problem_type] || ''} ${report.description || ''} ${locationNames[report.location_id] || ''}`.toLowerCase()
    return (status === 'all' || report.status === status) && phrase.includes(search.toLowerCase())
  }), [locationNames, reportsQuery.data, search, status])
  const summary = summaryQuery.data?.reports

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Trash2} eyebrow="Pusat tindak lanjut" title="Dari laporan ke tindakan." description="Urutkan masalah, lihat konteks lokasi, dan jaga setiap laporan sampai selesai." />
      <OperationsBand label="Antrean hari ini" title="20 laporan perlu perhatian" detail="Prioritas disusun dari laporan baru dan yang masih diproses." items={[
        { label: 'Baru', value: formatNumber(summary?.reported, 0), note: 'menunggu staf' },
        { label: 'Diproses', value: formatNumber(summary?.in_progress, 0), note: 'sedang ditangani' },
        { label: 'Selesai', value: formatNumber(summary?.resolved, 0), note: 'periode ini' },
      ]} />
      <section className="workspace-toolbar">
        <SearchControl value={search} onChange={setSearch} placeholder="Cari masalah atau lokasi" />
        <div className="workspace-segments" role="group" aria-label="Filter status laporan">
          {[['all', 'Semua'], ['reported', 'Dilaporkan'], ['in_progress', 'Diproses'], ['resolved', 'Selesai']].map(([value, label]) => <button key={value} type="button" className={status === value ? 'is-active' : ''} onClick={() => setStatus(value)}>{label}</button>)}
        </div>
      </section>
      {reportsQuery.isLoading && <LoadingPanel />}
      {reportsQuery.isError && <ErrorPanel query={reportsQuery} />}
      {!reportsQuery.isLoading && !reportsQuery.isError && (
        <section className="dashboard-panel dashboard-panel--table workspace-table-panel">
          <header className="dashboard-panel__header"><div><span>Daftar kerja</span><h2>{reports.length} laporan ditemukan</h2></div><small className="workspace-caption">Urut terbaru</small></header>
          <div className="responsive-table">
            <table><thead><tr><th>Masalah</th><th>Lokasi</th><th>Waktu</th><th>Status</th><th>Langkah berikut</th></tr></thead><tbody>
              {reports.map((report) => <tr key={report.id}><td><strong>{problemLabels[report.problem_type]}</strong><small>{report.description}</small></td><td>{locationNames[report.location_id]}</td><td>{formatDateTime(report.created_at)}</td><td><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></td><td><span className="next-step">{report.status === 'reported' ? 'Tugaskan staf' : report.status === 'in_progress' ? 'Pantau progres' : 'Arsipkan'}</span></td></tr>)}
            </tbody></table>
            <div className="mobile-records">{reports.map((report) => <article key={report.id}><div><strong>{problemLabels[report.problem_type]}</strong><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></div><p>{report.description}</p><small>{locationNames[report.location_id]} · {formatDateTime(report.created_at)}</small></article>)}</div>
          </div>
        </section>
      )}
    </DashboardShell>
  )
}

export function WasteDashboardPage() {
  const [search, setSearch] = useState('')
  const wasteQuery = useQuery({ queryKey: ['waste', 'workspace'], queryFn: () => getWasteRecords() })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((location) => [location.id, location.name])), [locationsQuery.data])
  const records = useMemo(() => (wasteQuery.data || []).filter((record) => (locationNames[record.location_id] || '').toLowerCase().includes(search.toLowerCase())), [locationNames, search, wasteQuery.data])
  const totals = useMemo(() => records.reduce((acc, record) => ({
    organic: acc.organic + record.organic_weight,
    inorganic: acc.inorganic + record.inorganic_weight,
    residual: acc.residual + record.residual_weight,
  }), { organic: 0, inorganic: 0, residual: 0 }), [records])
  const grandTotal = totals.organic + totals.inorganic + totals.residual

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Recycle} eyebrow="Ledger material" title="Setiap kilogram punya arah." description="Baca hasil penimbangan sebagai aliran material—mana yang kembali ke tanah, didaur ulang, atau masih menjadi residu." />
      <OperationsBand label="Neraca periode" title={`${formatKg(grandTotal)} tercatat`} detail="Komposisi dihitung dari catatan yang sedang ditampilkan." items={[
        { label: 'Organik', value: formatKg(totals.organic), note: `${formatPercent(grandTotal ? totals.organic / grandTotal * 100 : 0)} dari total` },
        { label: 'Anorganik', value: formatKg(totals.inorganic), note: `${formatPercent(grandTotal ? totals.inorganic / grandTotal * 100 : 0)} dari total` },
        { label: 'Residu', value: formatKg(totals.residual), note: `${formatPercent(grandTotal ? totals.residual / grandTotal * 100 : 0)} dari total` },
      ]} />
      <div className="dashboard-grid dashboard-grid--two workspace-split">
        <section className="dashboard-panel material-balance">
          <header className="dashboard-panel__header"><div><span>Porsi material</span><h2>Komposisi penimbangan</h2></div></header>
          {[['organic', totals.organic], ['inorganic', totals.inorganic], ['residual', totals.residual]].map(([category, value]) => <div className="material-row" key={category}><div><span>{categoryLabels[category]}</span><strong>{formatKg(value)}</strong></div><span className={`material-bar material-bar--${category}`}><i style={{ width: `${grandTotal ? value / grandTotal * 100 : 0}%` }} /></span></div>)}
        </section>
        <section className="dashboard-panel diversion-card">
          <span className="diversion-card__icon"><Leaf /></span><span>Potensi dialihkan</span><strong>{formatPercent(grandTotal ? (totals.organic + totals.inorganic) / grandTotal * 100 : 0)}</strong><p>Organik dan anorganik mendominasi aliran. Jaga pemilahan di sumber agar tidak berubah menjadi residu.</p>
        </section>
      </div>
      <section className="workspace-toolbar"><SearchControl value={search} onChange={setSearch} placeholder="Cari lokasi penimbangan" /><span className="workspace-toolbar__note"><Scale /> {records.length} catatan</span></section>
      {wasteQuery.isLoading && <LoadingPanel />}
      {wasteQuery.isError && <ErrorPanel query={wasteQuery} />}
      {!wasteQuery.isLoading && !wasteQuery.isError && <section className="dashboard-panel dashboard-panel--table workspace-table-panel"><header className="dashboard-panel__header"><div><span>Riwayat timbang</span><h2>Catatan sampah</h2></div></header><div className="responsive-table"><table><thead><tr><th>Tanggal</th><th>Lokasi</th><th>Organik</th><th>Anorganik</th><th>Residu</th><th>Total</th></tr></thead><tbody>{records.map((record) => { const total = record.organic_weight + record.inorganic_weight + record.residual_weight; return <tr key={record.id}><td>{formatShortDate(record.record_date)}</td><td><strong>{locationNames[record.location_id]}</strong></td><td>{formatKg(record.organic_weight)}</td><td>{formatKg(record.inorganic_weight)}</td><td>{formatKg(record.residual_weight)}</td><td><strong>{formatKg(total)}</strong></td></tr> })}</tbody></table><div className="mobile-records">{records.map((record) => <article key={record.id}><div><strong>{locationNames[record.location_id]}</strong><strong>{formatKg(record.organic_weight + record.inorganic_weight + record.residual_weight)}</strong></div><p>Organik {formatKg(record.organic_weight)} · Anorganik {formatKg(record.inorganic_weight)} · Residu {formatKg(record.residual_weight)}</p><small>{formatShortDate(record.record_date)}</small></article>)}</div></div></section>}
    </DashboardShell>
  )
}

export function CamideDashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'camide', 'workspace'], queryFn: () => getCamideSummary({}) })
  const recentQuery = useQuery({ queryKey: ['camide', 'recent'], queryFn: getCamideRecent })
  const summary = summaryQuery.data
  const categories = summary ? Object.entries(summary.categories) : []

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Bot} eyebrow="Pengenalan visual" title="Mesin melihat. Sekolah belajar." description="Pantau pola identifikasi CAMIDE dan temukan kategori yang masih sering membingungkan pengguna." />
      <OperationsBand label="Sinyal model" title={`${formatNumber(summary?.total_identifications, 0)} gambar dibaca`} detail="Ringkasan kualitas identifikasi pada periode aktif." items={[
        { label: 'Keyakinan', value: formatPercent((summary?.average_confidence || 0) * 100), note: 'rata-rata model' },
        { label: 'Foto ulang', value: formatNumber(summary?.low_confidence_count, 0), note: 'keyakinan rendah' },
        { label: 'Dominan', value: categoryLabels[summary?.top_category] || '—', note: 'kategori teratas' },
      ]} />
      {summaryQuery.isLoading && <LoadingPanel />}
      {summaryQuery.isError && <ErrorPanel query={summaryQuery} />}
      {summary && <div className="dashboard-grid dashboard-grid--two workspace-split">
        <section className="dashboard-panel camide-matrix"><header className="dashboard-panel__header"><div><span>Matriks kategori</span><h2>Apa yang dilihat CAMIDE</h2></div></header><div className="category-matrix">{categories.map(([key, value]) => <article key={key} className={`category-tile category-tile--${key}`}><span>{categoryLabels[key]}</span><strong>{formatNumber(value, 0)}</strong><small>{formatPercent(summary.total_identifications ? value / summary.total_identifications * 100 : 0)} dari hasil</small><i style={{ '--category-fill': `${summary.total_identifications ? value / summary.total_identifications * 100 : 0}%` }} /></article>)}</div></section>
        <section className="dashboard-panel model-note"><span className="model-note__glyph"><Sparkles /></span><span>Ambang operasional</span><strong>80%</strong><p>Hasil di bawah ambang diarahkan untuk foto ulang. Sampah B3 tetap mengikuti prosedur petugas sekolah.</p><Link to="/camide">Buka kamera CAMIDE <ArrowUpRight /></Link></section>
      </div>}
      {recentQuery.isLoading && <LoadingPanel />}
      {recentQuery.isError && <ErrorPanel query={recentQuery} />}
      {!recentQuery.isLoading && !recentQuery.isError && <section className="dashboard-panel dashboard-panel--table workspace-table-panel"><header className="dashboard-panel__header"><div><span>Jejak identifikasi</span><h2>Pembacaan terbaru</h2></div><span className="live-mark"><i /> Live preview</span></header><div className="responsive-table"><table><thead><tr><th>Objek</th><th>Kategori</th><th>Lokasi</th><th>Keyakinan</th><th>Waktu</th></tr></thead><tbody>{(recentQuery.data || []).map((scan) => <tr key={scan.id}><td><strong>{scan.item}</strong></td><td><span className={`category-chip category-chip--${scan.category}`}>{categoryLabels[scan.category]}</span></td><td>{scan.location}</td><td><span className="confidence-meter"><i style={{ width: `${scan.confidence * 100}%` }} /><strong>{formatPercent(scan.confidence * 100)}</strong></span></td><td>{formatDateTime(scan.created_at)}</td></tr>)}</tbody></table><div className="mobile-records">{(recentQuery.data || []).map((scan) => <article key={scan.id}><div><strong>{scan.item}</strong><span className={`category-chip category-chip--${scan.category}`}>{categoryLabels[scan.category]}</span></div><p>{scan.location} · Keyakinan {formatPercent(scan.confidence * 100)}</p><small>{formatDateTime(scan.created_at)}</small></article>)}</div></div></section>}
    </DashboardShell>
  )
}

export function LocationsDashboardPage() {
  const [search, setSearch] = useState('')
  const locationsQuery = useQuery({ queryKey: ['dashboard', 'locations', 'workspace'], queryFn: () => getLocationPerformance({}) })
  const locations = useMemo(() => (locationsQuery.data || []).filter((location) => location.location_name.toLowerCase().includes(search.toLowerCase())), [locationsQuery.data, search])
  const totalReports = locations.reduce((sum, location) => sum + location.reports, 0)
  const totalWaste = locations.reduce((sum, location) => sum + location.total_waste, 0)
  const averageResolution = locations.length ? locations.reduce((sum, location) => sum + location.resolution_rate, 0) / locations.length : 0

  return (
    <DashboardShell>
      <WorkspaceHeader icon={MapPin} eyebrow="Peta tanggung jawab" title="Setiap ruang punya denyut." description="Bandingkan beban kebersihan antararea dan arahkan perhatian ke tempat yang paling membutuhkannya." />
      <OperationsBand label="Cakupan sekolah" title={`${locations.length} area dipantau`} detail="Papan skor menggabungkan volume sampah dan penyelesaian laporan." items={[
        { label: 'Laporan', value: formatNumber(totalReports, 0), note: 'seluruh area' },
        { label: 'Sampah', value: formatKg(totalWaste), note: 'tercatat' },
        { label: 'Tuntas rata-rata', value: formatPercent(averageResolution), note: 'lintas area' },
      ]} />
      <section className="workspace-toolbar"><SearchControl value={search} onChange={setSearch} placeholder="Cari ruang atau area" /><span className="workspace-toolbar__note"><Activity /> Diurutkan menurut perhatian</span></section>
      {locationsQuery.isLoading && <LoadingPanel />}
      {locationsQuery.isError && <ErrorPanel query={locationsQuery} />}
      {!locationsQuery.isLoading && !locationsQuery.isError && <section className="location-board">{locations.map((location, index) => { const attention = location.resolution_rate < 50; return <article className={`location-card${attention ? ' needs-attention' : ''}`} key={location.location_id}><div className="location-card__top"><span className="location-card__rank">{String(index + 1).padStart(2, '0')}</span><span className={`location-health${attention ? ' is-warning' : ''}`}><i /> {attention ? 'Perlu perhatian' : 'Terkendali'}</span></div><div className="location-card__icon"><MapPin /></div><h2>{location.location_name}</h2><div className="location-card__score"><strong>{formatPercent(location.resolution_rate)}</strong><span>laporan selesai</span></div><div className="location-card__facts"><span><Trash2 /> <strong>{location.reports}</strong><small>laporan</small></span><span><Scale /> <strong>{formatKg(location.total_waste)}</strong><small>sampah</small></span></div><span className="location-card__progress"><i style={{ width: `${location.resolution_rate}%` }} /></span></article> })}</section>}
    </DashboardShell>
  )
}

export function UsersDashboardPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const usersQuery = useQuery({ queryKey: ['users', 'workspace'], queryFn: () => getUsers() })
  const users = useMemo(() => (usersQuery.data || []).filter((user) => {
    const matchesRole = role === 'all' || user.role === role
    return matchesRole && `${user.full_name} ${user.email}`.toLowerCase().includes(search.toLowerCase())
  }), [role, search, usersQuery.data])
  const allUsers = usersQuery.data || []
  const activeUsers = allUsers.filter((user) => user.is_active).length

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Users} eyebrow="Direktori sekolah" title="Akses mengikuti tanggung jawab." description="Lihat siapa yang memakai sistem dan pastikan setiap peran memiliki akses yang sesuai." />
      <OperationsBand label="Kesehatan akses" title={`${activeUsers} akun aktif`} detail="Status akun dan pembagian peran dalam satu pandangan." items={[
        { label: 'Admin + staf', value: formatNumber(allUsers.filter((user) => ['admin', 'staff'].includes(user.role)).length, 0), note: 'pengelola' },
        { label: 'Guru', value: formatNumber(allUsers.filter((user) => user.role === 'teacher').length, 0), note: 'pendamping' },
        { label: 'Siswa', value: formatNumber(allUsers.filter((user) => user.role === 'student').length, 0), note: 'pelapor' },
      ]} />
      <section className="workspace-toolbar">
        <SearchControl value={search} onChange={setSearch} placeholder="Cari nama atau email" />
        <div className="workspace-segments" role="group" aria-label="Filter peran pengguna">{[['all', 'Semua'], ['admin', 'Admin'], ['staff', 'Staf'], ['teacher', 'Guru'], ['student', 'Siswa']].map(([value, label]) => <button key={value} type="button" className={role === value ? 'is-active' : ''} onClick={() => setRole(value)}>{label}</button>)}</div>
      </section>
      {usersQuery.isLoading && <LoadingPanel />}
      {usersQuery.isError && <ErrorPanel query={usersQuery} />}
      {!usersQuery.isLoading && !usersQuery.isError && <section className="dashboard-panel dashboard-panel--table workspace-table-panel"><header className="dashboard-panel__header"><div><span>Daftar akses</span><h2>{users.length} pengguna</h2></div><span className="permission-note"><ShieldCheck /> Peran terverifikasi</span></header><div className="responsive-table"><table><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Aktivitas terakhir</th><th>Akses utama</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="user-cell"><i>{user.full_name.slice(0, 1)}</i><span><strong>{user.full_name}</strong><small>{user.email}</small></span></span></td><td><span className={`role-chip role-chip--${user.role}`}>{roleLabels[user.role]}</span></td><td><span className={`account-state${user.is_active ? '' : ' is-inactive'}`}><i /> {user.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td>{formatDateTime(user.last_seen)}</td><td>{user.role === 'admin' ? 'Semua pengaturan' : user.role === 'staff' ? 'Operasional' : user.role === 'teacher' ? 'Pantau & lapor' : 'Lapor & CAMIDE'}</td></tr>)}</tbody></table><div className="mobile-records">{users.map((user) => <article key={user.id}><div><strong>{user.full_name}</strong><span className={`role-chip role-chip--${user.role}`}>{roleLabels[user.role]}</span></div><p>{user.email}</p><small>{user.is_active ? 'Aktif' : 'Nonaktif'} · Terakhir {formatDateTime(user.last_seen)}</small></article>)}</div></div></section>}
    </DashboardShell>
  )
}
