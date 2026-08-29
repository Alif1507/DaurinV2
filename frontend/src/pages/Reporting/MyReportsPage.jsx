import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, CheckCircle2, Clock3, Image, MapPin, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import ReportingShell from '../../components/Reporting/ReportingShell'
import { PanelError, PanelLoading } from '../../components/Dashboard/DashboardStates'
import { getMyReports, getReportingLocations } from '../../services/reporting.service'
import { problemLabels, statusLabels } from '../../utils/formatters'
import './Reporting.css'

const filters = [['all', 'Semua'], ['reported', 'Dilaporkan'], ['in_progress', 'Diproses'], ['resolved', 'Selesai']]
const statusStep = { reported: 1, in_progress: 2, resolved: 3 }

function formatReportDate(value) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function ReportProgress({ status }) {
  const activeStep = statusStep[status]
  return <div className="student-report-progress">{[['Dilaporkan', Clock3], ['Diproses', RotateCcw], ['Selesai', Check]].map(([label, Icon], index) => { const step = index + 1; return <div key={label} className={step <= activeStep ? 'is-complete' : ''}><span>{step < activeStep ? <Check /> : <Icon />}</span><small>{label}</small>{step < 3 && <i />}</div> })}</div>
}

export default function MyReportsPage() {
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const reportsQuery = useQuery({ queryKey: ['reporting', 'my-reports'], queryFn: () => getMyReports() })
  const locationsQuery = useQuery({ queryKey: ['reporting', 'locations'], queryFn: getReportingLocations })
  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((item) => [item.id, item.name])), [locationsQuery.data])
  const reports = useMemo(() => (reportsQuery.data || []).filter((report) => filter === 'all' || report.status === filter), [filter, reportsQuery.data])

  return (
    <ReportingShell active="history">
      <header className="reporting-hero reporting-hero--history"><div><span className="reporting-eyebrow"><CheckCircle2 /> Jejak laporanmu</span><h1>Lihat perubahan yang kamu mulai.</h1><p>Pantau laporan dari saat dikirim sampai petugas menyelesaikannya.</p></div><Link className="new-report-button" to="/report"><Plus /> Buat laporan baru</Link></header>
      {location.state?.createdReportId && <div className="report-created-notice" role="status"><CheckCircle2 /><div><strong>Laporan berhasil dikirim.</strong><span>Kamu dapat memantau perkembangannya di halaman ini.</span></div></div>}
      <section className="my-reports-toolbar"><div className="my-reports-filters" role="group" aria-label="Filter laporan">{filters.map(([value, label]) => <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? reportsQuery.data?.length || 0 : (reportsQuery.data || []).filter((report) => report.status === value).length}</span></button>)}</div></section>
      {reportsQuery.isLoading && <section className="student-report-state"><PanelLoading /></section>}
      {reportsQuery.isError && <section className="student-report-state"><PanelError message={reportsQuery.error?.userMessage} onRetry={reportsQuery.refetch} /></section>}
      {!reportsQuery.isLoading && !reportsQuery.isError && reports.length === 0 && <section className="student-report-empty"><Trash2 /><h2>Belum ada laporan di status ini.</h2><p>Pilih status lain atau buat laporan baru saat menemukan kondisi yang perlu ditangani.</p><Link to="/report"><Plus /> Buat laporan</Link></section>}
      <section className="student-report-list">{reports.map((report) => (
        <article className="student-report-card" key={report.id}>
          <header><div><span className="report-id">#{report.id.slice(-7).toUpperCase()}</span><h2>{problemLabels[report.problem_type]}</h2><p><MapPin /> {locationNames[report.location_id] || 'Lokasi sekolah'}<span />{formatReportDate(report.created_at)}</p></div><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></header>
          <p className="student-report-description">{report.description || 'Tidak ada deskripsi tambahan.'}</p>
          {(report.photo_name || report.photo_url || report.photo_path) && <span className="student-report-photo"><Image /> {report.photo_name || 'Foto terlampir'}</span>}
          <ReportProgress status={report.status} />
          {report.status === 'resolved' && (
            <div className="resolution-note">
              <CheckCircle2 />
              <div><strong>Catatan penyelesaian</strong><p>{report.resolution_note || 'Laporan telah diselesaikan oleh petugas sekolah.'}</p>{report.resolution_photo_url && <a className="resolution-proof-link" href={report.resolution_photo_url} target="_blank" rel="noreferrer"><img src={report.resolution_photo_url} alt="Bukti laporan telah ditangani" /><span><Image /> Lihat bukti dari staf</span></a>}</div>
            </div>
          )}
        </article>
      ))}</section>
    </ReportingShell>
  )
}
