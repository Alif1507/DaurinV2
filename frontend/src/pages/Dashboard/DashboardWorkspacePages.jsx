import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Image,
  Leaf,
  MapPin,
  Pencil,
  Play,
  Plus,
  Recycle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/Dashboard/DashboardShell'
import { PanelError, PanelLoading } from '../../components/Dashboard/DashboardStates'
import useAuth from '../../hooks/useAuth'
import {
  createLocation,
  createWasteRecord,
  deleteLocation,
  deleteWasteRecord,
  getCamideRecent,
  getCamideSummary,
  getDashboardSummary,
  getLocationPerformance,
  getLocations,
  getReports,
  getUsers,
  getWasteRecords,
  resolveReport,
  startReport,
  updateLocation,
  updateWasteRecord,
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

function todayInputValue() {
  const today = new Date()
  const offset = today.getTimezoneOffset() * 60000
  return new Date(today.getTime() - offset).toISOString().slice(0, 10)
}

export function ReportsDashboardPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionFile, setResolutionFile] = useState(null)
  const [resolutionFileError, setResolutionFileError] = useState('')
  const [notice, setNotice] = useState('')
  const resolutionInputRef = useRef(null)
  const resolutionPreviewRef = useRef('')
  const reportsQuery = useQuery({ queryKey: ['reports', 'workspace'], queryFn: () => getReports() })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary', 'workspace'], queryFn: () => getDashboardSummary({}) })
  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((location) => [location.id, location.name])), [locationsQuery.data])
  const reports = useMemo(() => (reportsQuery.data || []).filter((report) => {
    const phrase = `${problemLabels[report.problem_type] || ''} ${report.description || ''} ${locationNames[report.location_id] || ''}`.toLowerCase()
    return (status === 'all' || report.status === status) && phrase.includes(search.toLowerCase())
  }), [locationNames, reportsQuery.data, search, status])
  const summary = summaryQuery.data?.reports
  const openReports = (reportsQuery.data || []).filter((report) => report.status !== 'resolved').length

  async function refreshReportViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reporting', 'my-reports'] }),
    ])
  }

  const startReportMutation = useMutation({
    mutationFn: startReport,
    onSuccess: async (report) => {
      await refreshReportViews()
      setNotice(`${problemLabels[report.problem_type]} mulai ditangani.`)
    },
  })

  const resolveReportMutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: async (report) => {
      await refreshReportViews()
      setSelectedReport(null)
      setResolutionNote('')
      clearResolutionFile()
      setNotice(`${problemLabels[report.problem_type]} ditandai selesai.`)
    },
  })

  function clearResolutionFile() {
    if (resolutionPreviewRef.current) URL.revokeObjectURL(resolutionPreviewRef.current)
    resolutionPreviewRef.current = ''
    setResolutionFile(null)
    setResolutionFileError('')
  }

  function selectResolutionFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setResolutionFileError('Gunakan foto JPEG, PNG, atau WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResolutionFileError('Ukuran foto maksimal 5 MB.')
      return
    }
    clearResolutionFile()
    const previewUrl = URL.createObjectURL(file)
    resolutionPreviewRef.current = previewUrl
    setResolutionFile({ file, previewUrl })
  }

  function openPhotoPreview(report, type) {
    const isResolution = type === 'resolution'
    setPreviewPhoto({
      url: isResolution ? report.resolution_photo_url : report.photo_url,
      eyebrow: isResolution ? 'BUKTI PENYELESAIAN' : 'FOTO LAPORAN',
      title: problemLabels[report.problem_type],
      location: locationNames[report.location_id] || 'Lokasi tidak aktif',
      date: formatDateTime(isResolution ? report.resolved_at : report.created_at),
      description: isResolution
        ? (report.resolution_note || 'Laporan telah diselesaikan oleh petugas sekolah.')
        : (report.description || 'Tidak ada keterangan tambahan untuk foto ini.'),
      alt: isResolution ? 'Bukti penyelesaian laporan' : 'Foto laporan',
    })
  }

  function openResolveDialog(report) {
    setNotice('')
    resolveReportMutation.reset()
    setResolutionNote('')
    clearResolutionFile()
    setSelectedReport(report)
  }

  function closeResolveDialog() {
    if (resolveReportMutation.isPending) return
    setSelectedReport(null)
    resolveReportMutation.reset()
    clearResolutionFile()
  }

  function submitResolution(event) {
    event.preventDefault()
    const note = resolutionNote.trim()
    if (!selectedReport || note.length < 2 || !resolutionFile) return
    resolveReportMutation.mutate({ reportId: selectedReport.id, resolutionNote: note, file: resolutionFile.file })
  }

  useEffect(() => {
    if (!selectedReport) return undefined
    resolutionInputRef.current?.focus()
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !resolveReportMutation.isPending) setSelectedReport(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedReport, resolveReportMutation.isPending])

  useEffect(() => {
    if (!previewPhoto) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event) => {
      if (event.key === 'Escape') setPreviewPhoto(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [previewPhoto])

  useEffect(() => () => {
    if (resolutionPreviewRef.current) URL.revokeObjectURL(resolutionPreviewRef.current)
  }, [])

  function renderReportPhotos(report, mobile = false) {
    const photos = [
      report.photo_url && { type: 'report', url: report.photo_url, label: 'Laporan' },
      report.resolution_photo_url && { type: 'resolution', url: report.resolution_photo_url, label: 'Bukti selesai' },
    ].filter(Boolean)
    if (!photos.length) {
      return <span className={`report-photo-empty${report.photo_path || report.resolution_photo_path ? ' is-unavailable' : ''}`}>{report.photo_path || report.resolution_photo_path ? 'Foto tidak tersedia' : 'Tidak ada foto'}</span>
    }
    return (
      <div className={mobile ? 'report-photo-stack report-photo-stack--mobile' : 'report-photo-stack'}>
        {photos.map((photo) => (
          <button className={mobile ? 'report-photo-mobile' : 'report-photo-trigger'} type="button" key={photo.type} onClick={() => openPhotoPreview(report, photo.type)} aria-label={`Lihat ${photo.label.toLowerCase()} ${problemLabels[report.problem_type]}`}>
            <img src={photo.url} alt="" />
            <span><Image /> {photo.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Trash2} eyebrow="Pusat tindak lanjut" title="Dari laporan ke tindakan." description="Urutkan masalah, lihat konteks lokasi, dan jaga setiap laporan sampai selesai." />
      <OperationsBand label="Antrean hari ini" title={`${openReports} laporan perlu perhatian`} detail="Prioritas disusun dari laporan baru dan yang masih diproses." items={[
        { label: 'Baru', value: formatNumber(summary?.reported, 0), note: 'menunggu staf' },
        { label: 'Diproses', value: formatNumber(summary?.in_progress, 0), note: 'sedang ditangani' },
        { label: 'Selesai', value: formatNumber(summary?.resolved, 0), note: 'periode ini' },
      ]} />
      {notice && <div className="location-created-notice staff-notice" role="status"><CheckCircle2 /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan"><X /></button></div>}
      {startReportMutation.isError && <p className="staff-action-error" role="alert">{startReportMutation.error?.userMessage || 'Laporan tidak dapat mulai ditangani.'}</p>}
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
          <header className="dashboard-panel__header"><div><span>Daftar kerja</span><h2>{reports.length} laporan ditemukan</h2></div><small className="workspace-caption">Ambil → tangani → selesaikan</small></header>
          {reports.length === 0 ? (
            <div className="workspace-empty"><span><ClipboardCheck /></span><div><h3>{(reportsQuery.data || []).length ? 'Tidak ada laporan pada filter ini' : 'Antrean laporan masih kosong'}</h3><p>{(reportsQuery.data || []).length ? 'Ubah filter atau pencarian untuk melihat laporan lain.' : 'Laporan dari siswa dan guru akan muncul di sini untuk mulai ditangani.'}</p></div>{(reportsQuery.data || []).length > 0 && <button type="button" onClick={() => { setSearch(''); setStatus('all') }}>Tampilkan semua</button>}</div>
          ) : (
            <div className="responsive-table">
              <table><thead><tr><th>Masalah</th><th>Lampiran</th><th>Lokasi</th><th>Waktu</th><th>Status</th><th>Langkah berikut</th></tr></thead><tbody>
                {reports.map((report) => <tr key={report.id}><td><strong>{problemLabels[report.problem_type]}</strong><small>{report.description || 'Tanpa keterangan tambahan'}</small></td><td>{renderReportPhotos(report)}</td><td>{locationNames[report.location_id] || 'Lokasi tidak aktif'}</td><td>{formatDateTime(report.created_at)}</td><td><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></td><td>{report.status === 'reported' ? <button className="staff-row-action" type="button" disabled={startReportMutation.isPending} onClick={() => { setNotice(''); startReportMutation.mutate(report.id) }}>{startReportMutation.isPending && startReportMutation.variables === report.id ? 'Mengambil...' : <><Play /> Mulai tangani</>}</button> : report.status === 'in_progress' ? <button className="staff-row-action staff-row-action--complete" type="button" onClick={() => openResolveDialog(report)}><CheckCircle2 /> Selesaikan</button> : <span className="next-step next-step--done"><CheckCircle2 /> Tuntas</span>}</td></tr>)}
              </tbody></table>
              <div className="mobile-records">{reports.map((report) => <article key={report.id}><div><strong>{problemLabels[report.problem_type]}</strong><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></div><p>{report.description || 'Tanpa keterangan tambahan'}</p><small>{locationNames[report.location_id] || 'Lokasi tidak aktif'} · {formatDateTime(report.created_at)}</small>{renderReportPhotos(report, true)}{report.status === 'reported' && <button className="staff-row-action" type="button" disabled={startReportMutation.isPending} onClick={() => startReportMutation.mutate(report.id)}><Play /> Mulai tangani</button>}{report.status === 'in_progress' && <button className="staff-row-action staff-row-action--complete" type="button" onClick={() => openResolveDialog(report)}><CheckCircle2 /> Selesaikan</button>}</article>)}</div>
            </div>
          )}
        </section>
      )}
      {previewPhoto && (
        <div className="report-photo-backdrop" onMouseDown={() => setPreviewPhoto(null)}>
          <section className="report-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="report-photo-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>{previewPhoto.eyebrow}</span><h2 id="report-photo-title">{previewPhoto.title}</h2><p>{previewPhoto.location} · {previewPhoto.date}</p></div><button type="button" onClick={() => setPreviewPhoto(null)} aria-label="Tutup preview foto" autoFocus><X /></button></header>
            <div className="report-photo-dialog__image"><img src={previewPhoto.url} alt={`${previewPhoto.alt} ${previewPhoto.title} di ${previewPhoto.location}`} /></div>
            <footer><p>{previewPhoto.description}</p><a href={previewPhoto.url} target="_blank" rel="noreferrer">Buka ukuran asli <ArrowUpRight /></a></footer>
          </section>
        </div>
      )}
      {selectedReport && (
        <div className="location-dialog-backdrop" onMouseDown={closeResolveDialog}>
          <section className="location-dialog operations-dialog" role="dialog" aria-modal="true" aria-labelledby="resolve-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>TINDAK LANJUT / SELESAI</span><h2 id="resolve-dialog-title">Catat hasil penanganan</h2><p>{problemLabels[selectedReport.problem_type]} · {locationNames[selectedReport.location_id] || 'Lokasi tidak aktif'}</p></div><button type="button" onClick={closeResolveDialog} disabled={resolveReportMutation.isPending} aria-label="Tutup formulir"><X /></button></header>
            <form onSubmit={submitResolution}>
              <div className="operation-context"><ClipboardCheck /><div><strong>Apa yang sudah dilakukan?</strong><span>Catatan ini dapat dilihat oleh pelapor sebagai hasil penyelesaian.</span></div></div>
              <label><span>Catatan penyelesaian <strong>*</strong></span><textarea ref={resolutionInputRef} value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} minLength="2" maxLength="500" rows="5" required placeholder="Contoh: Sampah sudah dikumpulkan dan area telah dibersihkan." /><small>{resolutionNote.length}/500 karakter</small></label>
              <label className="resolution-proof-field">
                <span>Foto bukti penyelesaian <strong>*</strong></span>
                <input className="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectResolutionFile} />
                {resolutionFile ? (
                  <span className="resolution-proof-preview"><img src={resolutionFile.previewUrl} alt="Preview bukti penyelesaian" /><span><strong>{resolutionFile.file.name}</strong><small>{(resolutionFile.file.size / 1024 / 1024).toFixed(2)} MB · Klik untuk mengganti</small></span><Camera /></span>
                ) : (
                  <span className="resolution-proof-empty"><Upload /><span><strong>Unggah foto kondisi setelah ditangani</strong><small>JPEG, PNG, atau WebP · maksimal 5 MB</small></span></span>
                )}
              </label>
              {resolutionFileError && <p className="location-form-error" role="alert">{resolutionFileError}</p>}
              {resolveReportMutation.isError && <p className="location-form-error" role="alert">{resolveReportMutation.error?.userMessage || 'Laporan tidak dapat diselesaikan.'}</p>}
              <footer><button type="button" onClick={closeResolveDialog} disabled={resolveReportMutation.isPending}>Batal</button><button className="location-add-button" type="submit" disabled={resolveReportMutation.isPending || resolutionNote.trim().length < 2 || !resolutionFile}>{resolveReportMutation.isPending ? 'Mengunggah bukti...' : <><CheckCircle2 /> Tandai selesai</>}</button></footer>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  )
}

export function WasteDashboardPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isWasteFormOpen, setIsWasteFormOpen] = useState(false)
  const [editingWasteRecord, setEditingWasteRecord] = useState(null)
  const [deletingWasteRecord, setDeletingWasteRecord] = useState(null)
  const [wasteNotice, setWasteNotice] = useState('')
  const [wasteForm, setWasteForm] = useState({ location_id: '', record_date: todayInputValue(), organic_weight: '', inorganic_weight: '', residual_weight: '', notes: '' })
  const wasteQuery = useQuery({ queryKey: ['waste', 'workspace'], queryFn: () => getWasteRecords() })
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const locations = useMemo(() => locationsQuery.data || [], [locationsQuery.data])
  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((location) => [location.id, location.name])), [locationsQuery.data])
  const records = useMemo(() => (wasteQuery.data || []).filter((record) => (locationNames[record.location_id] || '').toLowerCase().includes(search.toLowerCase())), [locationNames, search, wasteQuery.data])
  const totals = useMemo(() => records.reduce((acc, record) => ({
    organic: acc.organic + record.organic_weight,
    inorganic: acc.inorganic + record.inorganic_weight,
    residual: acc.residual + record.residual_weight,
  }), { organic: 0, inorganic: 0, residual: 0 }), [records])
  const grandTotal = totals.organic + totals.inorganic + totals.residual
  const formTotal = ['organic_weight', 'inorganic_weight', 'residual_weight'].reduce((sum, field) => sum + (Number(wasteForm[field]) || 0), 0)

  async function refreshWasteViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['waste'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  function resetWasteForm() {
    setWasteForm({ location_id: '', record_date: todayInputValue(), organic_weight: '', inorganic_weight: '', residual_weight: '', notes: '' })
  }

  const createWasteMutation = useMutation({
    mutationFn: createWasteRecord,
    onSuccess: async (record) => {
      await refreshWasteViews()
      resetWasteForm()
      setIsWasteFormOpen(false)
      setWasteNotice(`Penimbangan ${formatKg(record.organic_weight + record.inorganic_weight + record.residual_weight)} berhasil dicatat.`)
    },
  })

  const updateWasteMutation = useMutation({
    mutationFn: updateWasteRecord,
    onSuccess: async (record) => {
      await refreshWasteViews()
      resetWasteForm()
      setEditingWasteRecord(null)
      setIsWasteFormOpen(false)
      setWasteNotice(`Catatan ${formatShortDate(record.record_date)} berhasil diperbarui.`)
    },
  })

  const deleteWasteMutation = useMutation({
    mutationFn: deleteWasteRecord,
    onSuccess: async () => {
      const deletedRecord = deletingWasteRecord
      await refreshWasteViews()
      setDeletingWasteRecord(null)
      setWasteNotice(`Catatan ${formatShortDate(deletedRecord.record_date)} di ${locationNames[deletedRecord.location_id] || 'lokasi'} berhasil dihapus.`)
    },
  })

  function openWasteForm(record = null) {
    if (!locations.length) return
    setWasteNotice('')
    createWasteMutation.reset()
    updateWasteMutation.reset()
    setEditingWasteRecord(record)
    setWasteForm(record ? {
      location_id: record.location_id,
      record_date: record.record_date,
      organic_weight: String(record.organic_weight),
      inorganic_weight: String(record.inorganic_weight),
      residual_weight: String(record.residual_weight),
      notes: record.notes || '',
    } : {
      location_id: locations[0].id,
      record_date: todayInputValue(),
      organic_weight: '',
      inorganic_weight: '',
      residual_weight: '',
      notes: '',
    })
    setIsWasteFormOpen(true)
  }

  function closeWasteForm() {
    if (createWasteMutation.isPending || updateWasteMutation.isPending) return
    setIsWasteFormOpen(false)
    setEditingWasteRecord(null)
    createWasteMutation.reset()
    updateWasteMutation.reset()
  }

  function updateWasteField(field, value) {
    setWasteForm((current) => ({ ...current, [field]: value }))
  }

  function submitWasteRecord(event) {
    event.preventDefault()
    if (!wasteForm.location_id || formTotal <= 0) return
    const payload = {
      location_id: wasteForm.location_id,
      record_date: wasteForm.record_date,
      organic_weight: Number(wasteForm.organic_weight) || 0,
      inorganic_weight: Number(wasteForm.inorganic_weight) || 0,
      residual_weight: Number(wasteForm.residual_weight) || 0,
      notes: wasteForm.notes.trim() || null,
    }
    if (editingWasteRecord) {
      updateWasteMutation.mutate({ recordId: editingWasteRecord.id, payload })
      return
    }
    createWasteMutation.mutate(payload)
  }

  function canManageWasteRecord(record) {
    return profile?.role === 'admin' || record.recorded_by === profile?.id
  }

  function requestDeleteWasteRecord(record) {
    setWasteNotice('')
    deleteWasteMutation.reset()
    setDeletingWasteRecord(record)
  }

  useEffect(() => {
    if (!isWasteFormOpen) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !createWasteMutation.isPending && !updateWasteMutation.isPending) {
        setIsWasteFormOpen(false)
        setEditingWasteRecord(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isWasteFormOpen, createWasteMutation.isPending, updateWasteMutation.isPending])

  useEffect(() => {
    if (!deletingWasteRecord) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !deleteWasteMutation.isPending) setDeletingWasteRecord(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deletingWasteRecord, deleteWasteMutation.isPending])

  return (
    <DashboardShell>
      <WorkspaceHeader icon={Recycle} eyebrow="Ledger material" title="Setiap kilogram punya arah." description="Baca hasil penimbangan sebagai aliran material—mana yang kembali ke tanah, didaur ulang, atau masih menjadi residu." />
      <OperationsBand label="Neraca periode" title={`${formatKg(grandTotal)} tercatat`} detail="Komposisi dihitung dari catatan yang sedang ditampilkan." items={[
        { label: 'Organik', value: formatKg(totals.organic), note: `${formatPercent(grandTotal ? totals.organic / grandTotal * 100 : 0)} dari total` },
        { label: 'Anorganik', value: formatKg(totals.inorganic), note: `${formatPercent(grandTotal ? totals.inorganic / grandTotal * 100 : 0)} dari total` },
        { label: 'Residu', value: formatKg(totals.residual), note: `${formatPercent(grandTotal ? totals.residual / grandTotal * 100 : 0)} dari total` },
      ]} />
      {wasteNotice && <div className="location-created-notice staff-notice" role="status"><CheckCircle2 /><span>{wasteNotice}</span><button type="button" onClick={() => setWasteNotice('')} aria-label="Tutup pemberitahuan"><X /></button></div>}
      <div className="dashboard-grid dashboard-grid--two workspace-split">
        <section className="dashboard-panel material-balance">
          <header className="dashboard-panel__header"><div><span>Porsi material</span><h2>Komposisi penimbangan</h2></div></header>
          {[['organic', totals.organic], ['inorganic', totals.inorganic], ['residual', totals.residual]].map(([category, value]) => <div className="material-row" key={category}><div><span>{categoryLabels[category]}</span><strong>{formatKg(value)}</strong></div><span className={`material-bar material-bar--${category}`}><i style={{ width: `${grandTotal ? value / grandTotal * 100 : 0}%` }} /></span></div>)}
        </section>
        <section className="dashboard-panel diversion-card">
          <span className="diversion-card__icon"><Leaf /></span><span>Potensi dialihkan</span><strong>{formatPercent(grandTotal ? (totals.organic + totals.inorganic) / grandTotal * 100 : 0)}</strong><p>Organik dan anorganik mendominasi aliran. Jaga pemilahan di sumber agar tidak berubah menjadi residu.</p>
        </section>
      </div>
      <section className="workspace-toolbar"><SearchControl value={search} onChange={setSearch} placeholder="Cari lokasi penimbangan" /><div className="location-toolbar__actions"><span className="workspace-toolbar__note"><Scale /> {records.length} catatan</span><button className="location-add-button" type="button" onClick={() => openWasteForm()} disabled={!locations.length} title={locations.length ? undefined : 'Admin perlu menambahkan lokasi terlebih dahulu'}><Plus /> Catat penimbangan</button></div></section>
      {wasteQuery.isLoading && <LoadingPanel />}
      {wasteQuery.isError && <ErrorPanel query={wasteQuery} />}
      {!wasteQuery.isLoading && !wasteQuery.isError && (
        <section className="dashboard-panel dashboard-panel--table workspace-table-panel">
          <header className="dashboard-panel__header"><div><span>Riwayat timbang</span><h2>Catatan sampah</h2></div><small className="workspace-caption">Tambah · periksa · perbarui</small></header>
          {records.length === 0 ? (
            <div className="workspace-empty"><span><Scale /></span><div><h3>{(wasteQuery.data || []).length ? 'Lokasi tidak ditemukan' : 'Belum ada hasil penimbangan'}</h3><p>{(wasteQuery.data || []).length ? 'Hapus pencarian untuk melihat semua catatan.' : locations.length ? 'Catat berat sampah organik, anorganik, dan residu setelah pengumpulan.' : 'Admin perlu menambahkan lokasi sebelum staf dapat mencatat penimbangan.'}</p></div>{(wasteQuery.data || []).length ? <button type="button" onClick={() => setSearch('')}>Tampilkan semua</button> : locations.length > 0 && <button type="button" onClick={() => openWasteForm()}>Catat pertama</button>}</div>
          ) : (
            <div className="responsive-table">
              <table><thead><tr><th>Tanggal</th><th>Lokasi</th><th>Organik</th><th>Anorganik</th><th>Residu</th><th>Total</th><th>Aksi</th></tr></thead><tbody>{records.map((record) => { const total = record.organic_weight + record.inorganic_weight + record.residual_weight; const canManage = canManageWasteRecord(record); return <tr key={record.id}><td>{formatShortDate(record.record_date)}</td><td><strong>{locationNames[record.location_id]}</strong><small>{record.notes || 'Tanpa catatan'}</small></td><td>{formatKg(record.organic_weight)}</td><td>{formatKg(record.inorganic_weight)}</td><td>{formatKg(record.residual_weight)}</td><td><strong>{formatKg(total)}</strong></td><td>{canManage ? <div className="record-actions"><button type="button" onClick={() => openWasteForm(record)} aria-label={`Edit catatan ${formatShortDate(record.record_date)}`}><Pencil /> Edit</button><button type="button" className="is-danger" onClick={() => requestDeleteWasteRecord(record)} aria-label={`Hapus catatan ${formatShortDate(record.record_date)}`}><Trash2 /> Hapus</button></div> : <span className="record-readonly"><ShieldCheck /> Milik staf lain</span>}</td></tr> })}</tbody></table>
              <div className="mobile-records">{records.map((record) => { const canManage = canManageWasteRecord(record); return <article key={record.id}><div><strong>{locationNames[record.location_id]}</strong><strong>{formatKg(record.organic_weight + record.inorganic_weight + record.residual_weight)}</strong></div><p>Organik {formatKg(record.organic_weight)} · Anorganik {formatKg(record.inorganic_weight)} · Residu {formatKg(record.residual_weight)}</p>{record.notes && <p className="mobile-record-note">{record.notes}</p>}<small>{formatShortDate(record.record_date)}</small>{canManage && <div className="record-actions record-actions--mobile"><button type="button" onClick={() => openWasteForm(record)}><Pencil /> Edit</button><button type="button" className="is-danger" onClick={() => requestDeleteWasteRecord(record)}><Trash2 /> Hapus</button></div>}</article> })}</div>
            </div>
          )}
        </section>
      )}
      {isWasteFormOpen && (
        <div className="location-dialog-backdrop" onMouseDown={closeWasteForm}>
          <section className="location-dialog operations-dialog waste-dialog" role="dialog" aria-modal="true" aria-labelledby="waste-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>LEDGER MATERIAL / {editingWasteRecord ? 'EDIT' : 'BARU'}</span><h2 id="waste-dialog-title">{editingWasteRecord ? 'Perbarui hasil penimbangan' : 'Catat hasil penimbangan'}</h2><p>{editingWasteRecord ? 'Koreksi lokasi, tanggal, atau berat berdasarkan hasil timbang yang benar.' : 'Masukkan berat dalam kilogram sesuai hasil timbang di lokasi.'}</p></div><button type="button" onClick={closeWasteForm} disabled={createWasteMutation.isPending || updateWasteMutation.isPending} aria-label="Tutup formulir"><X /></button></header>
            <form onSubmit={submitWasteRecord}>
              <div className="waste-form-meta"><label><span>Lokasi <strong>*</strong></span><select value={wasteForm.location_id} onChange={(event) => updateWasteField('location_id', event.target.value)} required>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label><span>Tanggal <strong>*</strong></span><input type="date" value={wasteForm.record_date} max={todayInputValue()} onChange={(event) => updateWasteField('record_date', event.target.value)} required /></label></div>
              <fieldset className="waste-weight-grid"><legend>Berat per kategori</legend>{[['organic_weight', 'Organik'], ['inorganic_weight', 'Anorganik'], ['residual_weight', 'Residu']].map(([field, label]) => <label key={field}><span>{label}</span><span className="weight-input"><input type="number" value={wasteForm[field]} onChange={(event) => updateWasteField(field, event.target.value)} min="0" step="0.01" inputMode="decimal" placeholder="0" /><small>kg</small></span></label>)}</fieldset>
              <div className="waste-form-total"><span>Total penimbangan</span><strong>{formatKg(formTotal)}</strong></div>
              <label><span>Catatan <small>Opsional</small></span><textarea value={wasteForm.notes} onChange={(event) => updateWasteField('notes', event.target.value)} maxLength="500" rows="3" placeholder="Contoh: Pengumpulan sore dari tiga kelas." /><small>{wasteForm.notes.length}/500 karakter</small></label>
              {formTotal <= 0 && <p className="waste-form-hint">Isi minimal satu kategori dengan berat lebih dari 0 kg.</p>}
              {(createWasteMutation.isError || updateWasteMutation.isError) && <p className="location-form-error" role="alert">{createWasteMutation.error?.userMessage || updateWasteMutation.error?.userMessage || 'Penimbangan tidak dapat disimpan.'}</p>}
              <footer><button type="button" onClick={closeWasteForm} disabled={createWasteMutation.isPending || updateWasteMutation.isPending}>Batal</button><button className="location-add-button" type="submit" disabled={createWasteMutation.isPending || updateWasteMutation.isPending || !wasteForm.location_id || formTotal <= 0}>{createWasteMutation.isPending || updateWasteMutation.isPending ? 'Menyimpan...' : editingWasteRecord ? <><Pencil /> Simpan perubahan</> : <><Plus /> Simpan penimbangan</>}</button></footer>
            </form>
          </section>
        </div>
      )}
      {deletingWasteRecord && (
        <div className="location-dialog-backdrop" onMouseDown={() => !deleteWasteMutation.isPending && setDeletingWasteRecord(null)}>
          <section className="location-dialog location-delete-dialog waste-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="waste-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>LEDGER MATERIAL / HAPUS</span><h2 id="waste-delete-title">Hapus catatan penimbangan?</h2><p>{locationNames[deletingWasteRecord.location_id] || 'Lokasi'} · {formatShortDate(deletingWasteRecord.record_date)}</p></div><button type="button" onClick={() => setDeletingWasteRecord(null)} disabled={deleteWasteMutation.isPending} aria-label="Tutup konfirmasi"><X /></button></header>
            <div className="location-delete-dialog__body"><span><AlertTriangle /></span><div><strong>{formatKg(deletingWasteRecord.organic_weight + deletingWasteRecord.inorganic_weight + deletingWasteRecord.residual_weight)} akan dihapus permanen.</strong><p>Ringkasan dashboard dan komposisi sampah akan dihitung ulang setelah catatan dihapus.</p></div></div>
            {deleteWasteMutation.isError && <p className="location-form-error" role="alert">{deleteWasteMutation.error?.userMessage || 'Catatan penimbangan gagal dihapus.'}</p>}
            <footer><button type="button" onClick={() => setDeletingWasteRecord(null)} disabled={deleteWasteMutation.isPending}>Batal</button><button className="location-delete-button" type="button" onClick={() => deleteWasteMutation.mutate(deletingWasteRecord.id)} disabled={deleteWasteMutation.isPending}>{deleteWasteMutation.isPending ? 'Menghapus...' : <><Trash2 /> Hapus catatan</>}</button></footer>
          </section>
        </div>
      )}
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
      {!recentQuery.isLoading && !recentQuery.isError && (
        <section className="dashboard-panel dashboard-panel--table workspace-table-panel">
          <header className="dashboard-panel__header"><div><span>Jejak identifikasi</span><h2>Pembacaan terbaru</h2></div><span className="storage-safe-mark"><ShieldCheck /> Metadata saja</span></header>
          {(recentQuery.data || []).length === 0 ? (
            <div className="workspace-empty"><span><Bot /></span><div><h3>Belum ada hasil identifikasi</h3><p>Hasil CAMIDE berikutnya akan muncul sebagai metadata tanpa menyimpan atau menampilkan foto.</p></div><Link className="workspace-empty__link" to="/camide">Buka CAMIDE <ArrowUpRight /></Link></div>
          ) : (
            <div className="responsive-table">
              <table><thead><tr><th>Objek</th><th>Kategori</th><th>Status model</th><th>Keyakinan</th><th>Waktu</th></tr></thead><tbody>{(recentQuery.data || []).map((scan) => <tr key={scan.id}><td><strong>{scan.object_label || categoryLabels[scan.category] || 'Objek sampah'}</strong><small>{scan.object_key || scan.model_version || 'Klasifikasi CAMIDE'}</small></td><td><span className={`category-chip category-chip--${scan.category}`}>{categoryLabels[scan.category]}</span></td><td><span className={`camide-confidence-state${scan.is_confident ? '' : ' is-low'}`}><i /> {scan.is_confident ? 'Meyakinkan' : 'Perlu foto ulang'}</span></td><td><span className="confidence-meter"><i style={{ width: `${scan.confidence * 100}%` }} /><strong>{formatPercent(scan.confidence * 100)}</strong></span></td><td>{formatDateTime(scan.created_at)}</td></tr>)}</tbody></table>
              <div className="mobile-records">{(recentQuery.data || []).map((scan) => <article key={scan.id}><div><strong>{scan.object_label || categoryLabels[scan.category] || 'Objek sampah'}</strong><span className={`category-chip category-chip--${scan.category}`}>{categoryLabels[scan.category]}</span></div><p>{scan.is_confident ? 'Meyakinkan' : 'Perlu foto ulang'} · Keyakinan {formatPercent(scan.confidence * 100)}</p><small>{formatDateTime(scan.created_at)}</small></article>)}</div>
            </div>
          )}
        </section>
      )}
    </DashboardShell>
  )
}

export function LocationsDashboardPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [deletingLocation, setDeletingLocation] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createdNotice, setCreatedNotice] = useState('')
  const nameInputRef = useRef(null)
  const isAdmin = profile?.role === 'admin'
  const locationsQuery = useQuery({ queryKey: ['dashboard', 'locations', 'workspace'], queryFn: () => getLocationPerformance({}) })
  const registryLocationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const allLocations = useMemo(() => locationsQuery.data || [], [locationsQuery.data])
  const locationDetails = useMemo(() => Object.fromEntries((registryLocationsQuery.data || []).map((location) => [location.id, location])), [registryLocationsQuery.data])
  const locations = useMemo(() => allLocations.filter((location) => location.location_name.toLowerCase().includes(search.toLowerCase())), [allLocations, search])
  const totalReports = allLocations.reduce((sum, location) => sum + location.reports, 0)
  const totalWaste = allLocations.reduce((sum, location) => sum + location.total_waste, 0)
  const averageResolution = allLocations.length ? allLocations.reduce((sum, location) => sum + location.resolution_rate, 0) / allLocations.length : 0

  async function refreshLocations() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['locations'] }),
      queryClient.invalidateQueries({ queryKey: ['reporting', 'locations'] }),
    ])
  }

  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: async (location) => {
      await refreshLocations()
      setName('')
      setDescription('')
      setIsFormOpen(false)
      setCreatedNotice(`${location.name} berhasil ditambahkan dan siap dipakai untuk laporan.`)
    },
  })

  const updateLocationMutation = useMutation({
    mutationFn: updateLocation,
    onSuccess: async (location) => {
      await refreshLocations()
      setIsFormOpen(false)
      setEditingLocation(null)
      setCreatedNotice(`Perubahan ${location.name} berhasil disimpan.`)
    },
  })

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: async () => {
      const deletedName = deletingLocation?.location_name
      await refreshLocations()
      setDeletingLocation(null)
      setCreatedNotice(`${deletedName || 'Lokasi'} dihapus dari pilihan laporan baru.`)
    },
  })

  function openLocationForm(location = null) {
    setCreatedNotice('')
    createLocationMutation.reset()
    updateLocationMutation.reset()
    const detail = location ? locationDetails[location.location_id] : null
    setEditingLocation(location)
    setName(detail?.name || location?.location_name || '')
    setDescription(detail?.description || '')
    setIsFormOpen(true)
  }

  function closeLocationForm() {
    if (createLocationMutation.isPending || updateLocationMutation.isPending) return
    setIsFormOpen(false)
    setEditingLocation(null)
    createLocationMutation.reset()
    updateLocationMutation.reset()
  }

  function handleSaveLocation(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) return
    const payload = {
      name: trimmedName,
      description: description.trim() || null,
    }
    if (editingLocation) {
      updateLocationMutation.mutate({ locationId: editingLocation.location_id, payload })
      return
    }
    createLocationMutation.mutate(payload)
  }

  function requestDeleteLocation(location) {
    setCreatedNotice('')
    deleteLocationMutation.reset()
    setDeletingLocation(location)
  }

  useEffect(() => {
    if (!isFormOpen) return undefined
    nameInputRef.current?.focus()
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !createLocationMutation.isPending && !updateLocationMutation.isPending) {
        setIsFormOpen(false)
        setEditingLocation(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFormOpen, createLocationMutation.isPending, updateLocationMutation.isPending])

  useEffect(() => {
    if (!deletingLocation) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !deleteLocationMutation.isPending) setDeletingLocation(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deletingLocation, deleteLocationMutation.isPending])

  return (
    <DashboardShell>
      <WorkspaceHeader icon={MapPin} eyebrow="Peta tanggung jawab" title="Setiap ruang punya denyut." description="Bandingkan beban kebersihan antararea dan arahkan perhatian ke tempat yang paling membutuhkannya." />
      <OperationsBand label="Cakupan sekolah" title={`${allLocations.length} area dipantau`} detail="Papan skor menggabungkan volume sampah dan penyelesaian laporan." items={[
        { label: 'Laporan', value: formatNumber(totalReports, 0), note: 'seluruh area' },
        { label: 'Sampah', value: formatKg(totalWaste), note: 'tercatat' },
        { label: 'Tuntas rata-rata', value: formatPercent(averageResolution), note: 'lintas area' },
      ]} />
      {createdNotice && <div className="location-created-notice" role="status"><MapPin /> <span>{createdNotice}</span><button type="button" onClick={() => setCreatedNotice('')} aria-label="Tutup pemberitahuan"><X /></button></div>}
      <section className="workspace-toolbar">
        <SearchControl value={search} onChange={setSearch} placeholder="Cari ruang atau area" />
        <div className="location-toolbar__actions">
          <span className="workspace-toolbar__note"><Activity /> Diurutkan menurut perhatian</span>
          {isAdmin && <button className="location-add-button" type="button" onClick={() => openLocationForm()}><Plus /> Tambah lokasi</button>}
        </div>
      </section>
      {locationsQuery.isLoading && <LoadingPanel />}
      {locationsQuery.isError && <ErrorPanel query={locationsQuery} />}
      {!locationsQuery.isLoading && !locationsQuery.isError && allLocations.length === 0 && (
        <section className="location-empty">
          <span className="location-empty__marker"><Building2 /><i><MapPin /></i></span>
          <div><span>REGISTRI LOKASI</span><h2>Belum ada lokasi sekolah</h2><p>{isAdmin ? 'Daftarkan ruang kelas, kantin, taman, atau area lain agar pengguna dapat memilih lokasi saat membuat laporan.' : 'Lokasi hanya dapat ditambahkan oleh admin. Hubungi admin sekolah agar lokasi tersedia untuk laporan.'}</p></div>
          {isAdmin && <button className="location-add-button" type="button" onClick={() => openLocationForm()}><Plus /> Tambah lokasi pertama</button>}
        </section>
      )}
      {!locationsQuery.isLoading && !locationsQuery.isError && allLocations.length > 0 && locations.length === 0 && (
        <section className="location-empty location-empty--search"><Search /><div><h2>Lokasi tidak ditemukan</h2><p>Coba kata kunci lain atau tampilkan kembali semua lokasi.</p></div><button type="button" onClick={() => setSearch('')}>Hapus pencarian</button></section>
      )}
      {!locationsQuery.isLoading && !locationsQuery.isError && locations.length > 0 && (
        <section className="location-board">
          {locations.map((location, index) => {
            const hasActivity = location.reports > 0 || location.total_waste > 0
            const needsAttention = location.reports > 0 && location.resolution_rate < 50
            const healthLabel = !hasActivity ? 'Belum ada data' : needsAttention ? 'Perlu perhatian' : 'Terkendali'
            const healthClass = !hasActivity ? ' is-idle' : needsAttention ? ' is-warning' : ''
            return (
              <article className={`location-card${needsAttention ? ' needs-attention' : ''}`} key={location.location_id}>
                <div className="location-card__top"><span className="location-card__rank">{String(index + 1).padStart(2, '0')}</span><span className={`location-health${healthClass}`}><i /> {healthLabel}</span></div>
                <div className="location-card__icon"><MapPin /></div>
                <h2>{location.location_name}</h2>
                <div className="location-card__score"><strong>{formatPercent(location.resolution_rate)}</strong><span>laporan selesai</span></div>
                <div className="location-card__facts"><span><Trash2 /> <strong>{location.reports}</strong><small>laporan</small></span><span><Scale /> <strong>{formatKg(location.total_waste)}</strong><small>sampah</small></span></div>
                {isAdmin && <div className="location-card__actions"><button type="button" disabled={!locationDetails[location.location_id]} onClick={() => openLocationForm(location)}><Pencil /> Edit</button><button type="button" className="is-danger" onClick={() => requestDeleteLocation(location)}><Trash2 /> Hapus</button></div>}
                <span className="location-card__progress"><i style={{ width: `${location.resolution_rate}%` }} /></span>
              </article>
            )
          })}
        </section>
      )}
      {isFormOpen && (
        <div className="location-dialog-backdrop" onMouseDown={closeLocationForm}>
          <section className="location-dialog" role="dialog" aria-modal="true" aria-labelledby="location-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>REGISTRI LOKASI / {editingLocation ? 'EDIT' : 'BARU'}</span><h2 id="location-dialog-title">{editingLocation ? 'Edit detail lokasi' : 'Daftarkan ruang baru'}</h2><p>{editingLocation ? 'Perubahan nama langsung diterapkan pada pilihan lokasi laporan.' : 'Lokasi ini langsung tersedia sebagai pilihan pada formulir laporan.'}</p></div><button type="button" onClick={closeLocationForm} disabled={createLocationMutation.isPending || updateLocationMutation.isPending} aria-label="Tutup formulir"><X /></button></header>
            <form onSubmit={handleSaveLocation}>
              <label><span>Nama lokasi <strong>*</strong></span><input ref={nameInputRef} value={name} onChange={(event) => setName(event.target.value)} minLength="2" maxLength="150" required placeholder="Contoh: Kantin Utama" /></label>
              <label><span>Deskripsi <small>Opsional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength="1000" rows="4" placeholder="Contoh: Gedung B, lantai dasar" /><small>{description.length}/1000 karakter</small></label>
              {(createLocationMutation.isError || updateLocationMutation.isError) && <p className="location-form-error" role="alert">{createLocationMutation.error?.userMessage || updateLocationMutation.error?.userMessage || 'Perubahan lokasi gagal disimpan. Silakan coba lagi.'}</p>}
              <footer><button type="button" onClick={closeLocationForm} disabled={createLocationMutation.isPending || updateLocationMutation.isPending}>Batal</button><button className="location-add-button" type="submit" disabled={createLocationMutation.isPending || updateLocationMutation.isPending || name.trim().length < 2}>{createLocationMutation.isPending || updateLocationMutation.isPending ? 'Menyimpan...' : editingLocation ? <><Pencil /> Simpan perubahan</> : <><Plus /> Simpan lokasi</>}</button></footer>
            </form>
          </section>
        </div>
      )}
      {deletingLocation && (
        <div className="location-dialog-backdrop" onMouseDown={() => !deleteLocationMutation.isPending && setDeletingLocation(null)}>
          <section className="location-dialog location-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="location-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>REGISTRI LOKASI / HAPUS</span><h2 id="location-delete-title">Hapus {deletingLocation.location_name}?</h2><p>Laporan lama tetap tersimpan, tetapi lokasi ini tidak lagi muncul saat pengguna membuat laporan baru.</p></div><button type="button" onClick={() => setDeletingLocation(null)} disabled={deleteLocationMutation.isPending} aria-label="Tutup konfirmasi"><X /></button></header>
            <div className="location-delete-dialog__body"><span><AlertTriangle /></span><div><strong>Tindakan ini menyembunyikan lokasi.</strong><p>Data laporan dan catatan sampah yang sudah ada tidak akan ikut terhapus.</p></div></div>
            {deleteLocationMutation.isError && <p className="location-form-error" role="alert">{deleteLocationMutation.error?.userMessage || 'Lokasi gagal dihapus. Silakan coba lagi.'}</p>}
            <footer><button type="button" onClick={() => setDeletingLocation(null)} disabled={deleteLocationMutation.isPending}>Batal</button><button className="location-delete-button" type="button" onClick={() => deleteLocationMutation.mutate(deletingLocation.location_id)} disabled={deleteLocationMutation.isPending}>{deleteLocationMutation.isPending ? 'Menghapus...' : <><Trash2 /> Hapus lokasi</>}</button></footer>
          </section>
        </div>
      )}
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
