import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ReportingShell from '../../components/Reporting/ReportingShell'
import { createReport, getReportingLocations, uploadReportImage } from '../../services/reporting.service'
import './Reporting.css'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const problemOptions = [
  { value: 'full_bin', label: 'Tempat sampah penuh', help: 'Tidak bisa menampung lagi' },
  { value: 'scattered_waste', label: 'Sampah berserakan', help: 'Sampah berada di luar wadah' },
  { value: 'mixed_waste', label: 'Sampah tercampur', help: 'Jenis sampah tidak dipilah' },
  { value: 'dirty_area', label: 'Area kotor', help: 'Lantai atau ruang perlu dibersihkan' },
  { value: 'damaged_bin', label: 'Tempat sampah rusak', help: 'Wadah tidak dapat digunakan baik' },
  { value: 'other', label: 'Masalah lainnya', help: 'Kondisi lain yang perlu ditangani' },
]

export default function NewReportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const locationsQuery = useQuery({ queryKey: ['reporting', 'locations'], queryFn: getReportingLocations })
  const [locationId, setLocationId] = useState('')
  const [problemType, setProblemType] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  function selectPhoto(file) {
    setError('')
    if (!file) return
    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Gunakan foto JPEG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Ukuran foto maksimal 5 MB.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPhoto(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function removePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPhoto(null)
    setPreviewUrl('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!locationId || !problemType) {
      setError('Pilih lokasi dan jenis masalah sebelum mengirim laporan.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const report = await createReport({ location_id: locationId, problem_type: problemType, description: description.trim() || null })
      if (photo) await uploadReportImage(report.id, photo)
      await queryClient.invalidateQueries({ queryKey: ['reporting', 'my-reports'] })
      navigate('/my-reports', { replace: true, state: { createdReportId: report.id } })
    } catch (submitError) {
      setError(submitError.userMessage || submitError.message || 'Laporan belum dapat dikirim. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ReportingShell active="new">
      <header className="reporting-hero">
        <div><span className="reporting-eyebrow"><AlertTriangle /> Lapor kondisi sekolah</span><h1>Ada yang perlu dibereskan?</h1><p>Ceritakan kondisinya. Tim sekolah akan menerima laporanmu dengan lokasi dan konteks yang jelas.</p></div>
        <div className="reporting-promise"><ShieldCheck /><span><strong>Identitasmu terlindungi</strong><small>Laporan hanya terlihat olehmu dan petugas sekolah.</small></span></div>
      </header>

      <form className="report-form-layout" onSubmit={handleSubmit}>
        <div className="report-form">
          <section className="report-step">
            <div className="report-step__rail"><span>01</span><i /></div>
            <div className="report-step__content"><header><MapPin /><span><strong>Di mana masalahnya?</strong><small>Pilih lokasi yang paling tepat.</small></span></header><label className="report-field"><span>Lokasi sekolah</span><select value={locationId} onChange={(event) => setLocationId(event.target.value)} required><option value="">Pilih lokasi</option>{locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>{locationsQuery.isError && <p className="report-inline-error">Lokasi belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>}</div>
          </section>

          <section className="report-step">
            <div className="report-step__rail"><span>02</span><i /></div>
            <div className="report-step__content"><header><Trash2 /><span><strong>Apa yang kamu lihat?</strong><small>Pilih satu kondisi utama.</small></span></header><div className="problem-options">{problemOptions.map((problem) => <label key={problem.value} className={problemType === problem.value ? 'is-selected' : ''}><input type="radio" name="problem" value={problem.value} checked={problemType === problem.value} onChange={(event) => setProblemType(event.target.value)} /><span><strong>{problem.label}</strong><small>{problem.help}</small></span><CheckCircle2 /></label>)}</div></div>
          </section>

          <section className="report-step">
            <div className="report-step__rail"><span>03</span><i /></div>
            <div className="report-step__content"><header><MessageSquareText /><span><strong>Tambahkan cerita singkat</strong><small>Detail kecil membantu petugas bertindak tepat.</small></span></header><label className="report-field"><span>Deskripsi <em>opsional</em></span><textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 500))} rows="5" placeholder="Contoh: Sampah menumpuk di dekat pintu kantin sejak jam istirahat kedua." /><small>{description.length}/500 karakter</small></label></div>
          </section>

          <section className="report-step report-step--last">
            <div className="report-step__rail"><span>04</span></div>
            <div className="report-step__content"><header><Camera /><span><strong>Lampirkan bukti</strong><small>Foto opsional, tetapi sangat membantu.</small></span></header>{previewUrl ? <div className="photo-preview"><img src={previewUrl} alt="Pratinjau bukti laporan" /><button type="button" onClick={removePhoto} aria-label="Hapus foto"><X /></button><span>{photo?.name}</span></div> : <button className="photo-picker" type="button" onClick={() => fileInputRef.current?.click()}><ImagePlus /><span><strong>Pilih atau ambil foto</strong><small>JPEG, PNG, atau WebP · maksimal 5 MB</small></span></button>}<input ref={fileInputRef} className="report-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => { selectPhoto(event.target.files?.[0]); event.target.value = '' }} /></div>
          </section>

          {error && <p className="report-submit-error" role="alert">{error}</p>}
          <button className="report-submit" type="submit" disabled={isSubmitting || locationsQuery.isLoading}><span><strong>{isSubmitting ? 'Mengirim laporan...' : 'Kirim laporan'}</strong><small>{isSubmitting ? 'Foto dan detail sedang diproses' : 'Petugas sekolah akan menerima notifikasi'}</small></span><ArrowRight /></button>
        </div>

        <aside className="report-guide">
          <span className="reporting-eyebrow">Setelah dikirim</span><h2>Laporanmu tidak berhenti di sini.</h2>
          <ol><li><span>1</span><div><strong>Diterima</strong><small>Laporan masuk ke antrean petugas.</small></div></li><li><span>2</span><div><strong>Diproses</strong><small>Petugas mulai menangani lokasi.</small></div></li><li><span>3</span><div><strong>Selesai</strong><small>Kamu dapat membaca catatan penyelesaian.</small></div></li></ol>
          <p><ShieldCheck /> Hindari memotret wajah. Fokuskan kamera pada kondisi atau objek yang dilaporkan.</p>
        </aside>
      </form>
    </ReportingShell>
  )
}
