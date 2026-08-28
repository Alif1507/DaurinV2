import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, RefreshCw, ScanSearch, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import useCamera from '../../hooks/useCamera'
import { identifyWaste } from '../../services/camide.service'
import './Camide.css'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ease = [0.22, 1, 0.36, 1]
const recognizedTypes = [
  ['Organik', 'kulit pisang, sisa makanan, daun'],
  ['Plastik', 'botol, gelas, wadah plastik bersih'],
  ['Kertas', 'lembar kertas, koran, majalah'],
  ['Kardus', 'kotak dan karton kemasan'],
  ['Logam', 'kaleng dan tutup logam'],
  ['Baterai', 'baterai AA/AAA dan baterai kancing'],
  ['E-waste', 'kabel, charger, elektronik kecil'],
  ['Limbah medis', 'perban dan alat medis sekali pakai'],
  ['Tajam/Beracun', 'pecahan kaca dan kemasan bahan kimia'],
  ['Residu', 'tisu kotor, styrofoam, kemasan multilapis'],
]

function CamideLogo() {
  return (
    <div className="camide__logo" aria-label="CAMIDE">
      <span className="camide__logo-mark" aria-hidden="true"><ScanSearch /></span>
      <span>CAM</span><strong>IDE</strong>
    </div>
  )
}

export default function Camide() {
  const reduceMotion = useReducedMotion()
  const { status, stream, error: cameraError, startCamera } = useCamera()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!videoRef.current || !stream) return
    videoRef.current.srcObject = stream
    videoRef.current.play().catch(() => undefined)
  }, [stream])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function setCapture(blob) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCapturedBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setPrediction(null)
    setMessage('')
  }

  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setMessage('Kamera belum siap. Tunggu sebentar lalu coba lagi.')
      return
    }

    const maxWidth = 1600
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) setCapture(blob)
        else setMessage('Foto gagal diambil. Silakan coba lagi.')
      },
      'image/jpeg',
      0.88,
    )
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setCapturedBlob(null)
    setPrediction(null)
    setMessage('')
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ALLOWED_TYPES.has(file.type)) {
      setMessage('Pilih gambar JPEG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setMessage('Ukuran gambar maksimal 5 MB.')
      return
    }
    setCapture(file)
  }

  async function handleIdentify() {
    if (!capturedBlob || isPredicting) return
    setIsPredicting(true)
    setPrediction(null)
    setMessage('')

    try {
      const result = await identifyWaste(capturedBlob)
      setPrediction(result)
    } catch (identifyError) {
      setMessage(identifyError.message)
    } finally {
      setIsPredicting(false)
    }
  }

  const showPlaceholder = !stream && !previewUrl
  const resultLabel = isPredicting
    ? 'Mengidentifikasi...'
    : prediction
      ? prediction.is_confident
        ? prediction.object_is_confident ? prediction.object_label : `${prediction.label} — objek spesifik belum pasti`
        : 'Belum dapat dipastikan'
      : ''

  return (
    <section id="camide" className="camide" aria-labelledby="camide-title">
      <motion.div
        className="camide__inner"
        initial={reduceMotion ? false : { opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease }}
      >
        <h2 id="camide-title"><CamideLogo /></h2>
        <p className="camide__intro">Identifikasi jenis sampah melalui kamera dalam beberapa langkah.</p>

        <div className={`camide__preview${showPlaceholder ? ' is-placeholder' : ''}`}>
          {showPlaceholder && (
            <img
              className="camide__placeholder"
              src="/img/camide/Frame%2012.png"
              alt="Bingkai kamera CAMIDE"
            />
          )}

          {stream && !previewUrl && (
            <video ref={videoRef} className="camide__media" autoPlay playsInline muted />
          )}

          {previewUrl && (
            <img className="camide__media" src={previewUrl} alt="Foto sampah yang akan diidentifikasi" />
          )}

          {status === 'requesting' && (
            <div className="camide__status" role="status">
              <span className="camide__spinner" />
              Meminta akses kamera...
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="camide__canvas" aria-hidden="true" />

        <p className="camide__helper">
          Arahkan kamera ke satu objek sampah. Pastikan objek terlihat jelas dan hindari memotret wajah.
        </p>

        <div className="camide__controls" aria-label="Kontrol kamera">
          {!stream && (
            <button type="button" className="camide__control" onClick={startCamera} disabled={status === 'requesting'}>
              <Camera aria-hidden="true" />
              {status === 'requesting' ? 'Mengaktifkan...' : 'Aktifkan Kamera'}
            </button>
          )}

          {stream && !previewUrl && (
            <button type="button" className="camide__control camide__control--capture" onClick={captureFrame}>
              <Camera aria-hidden="true" /> Ambil Foto
            </button>
          )}

          {previewUrl && (
            <button type="button" className="camide__control" onClick={retake}>
              <RefreshCw aria-hidden="true" /> Foto Ulang
            </button>
          )}

          <button type="button" className="camide__control" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus aria-hidden="true" /> Pilih Foto
          </button>
          <input
            ref={fileInputRef}
            className="camide__file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFile}
          />
        </div>

        {(cameraError || message) && (
          <p className="camide__error" role="alert">{message || cameraError}</p>
        )}

        <div className="camide__result-row">
          <div className="camide__result" aria-live="polite">
            <p><span>Tipe terdeteksi :</span> <strong>{resultLabel}</strong></p>
            {prediction?.is_confident && (
              <>
                <div className="camide__result-meta">
                  <span>Kategori <strong>{prediction.label}</strong></span>
                  <span>Keyakinan kategori <strong>{(prediction.confidence * 100).toFixed(1)}%</strong></span>
                  {prediction.object_is_confident && <span>Keyakinan tipe <strong>{(prediction.object_confidence * 100).toFixed(1)}%</strong></span>}
                </div>
                <p className="camide__examples"><span>Contoh sejenis:</span> {prediction.examples.join(', ')}.</p>
                <p className="camide__guidance"><span>Cara menangani:</span> {prediction.disposal_guidance}</p>
              </>
            )}
            {prediction && !prediction.is_confident && (
              <small>Silakan foto ulang objek dengan lebih jelas.</small>
            )}
          </div>

          <motion.button
            type="button"
            className="camide__identify"
            disabled={!capturedBlob || isPredicting}
            onClick={handleIdentify}
            whileHover={reduceMotion || !capturedBlob ? undefined : { y: -2 }}
            whileTap={reduceMotion || !capturedBlob ? undefined : { scale: 0.98 }}
          >
            {isPredicting ? 'Mengidentifikasi...' : prediction ? 'Identifikasi Lagi' : 'Identifikasi'}
          </motion.button>
        </div>

        <p className="camide__privacy"><ShieldCheck aria-hidden="true" /> CAMIDE mengenali sampah, bukan orang.</p>

        <section className="camide__capabilities" aria-labelledby="camide-capabilities-title">
          <header>
            <span>Kemampuan model</span>
            <h3 id="camide-capabilities-title">Apa saja yang dapat dikenali?</h3>
            <p>CAMIDE mengenali 10 kelompok material berikut. Contoh membantu pengguna memahami cakupan kelas model.</p>
          </header>
          <div>{recognizedTypes.map(([type, examples], index) => <article key={type}><span>{String(index + 1).padStart(2, '0')}</span><strong>{type}</strong><small>{examples}</small></article>)}</div>
          <p className="camide__capability-note">Catatan: model mengenali kelompok material, jadi “kulit pisang” akan tampil sebagai sampah organik dan “botol plastik” sebagai plastik daur ulang.</p>
        </section>
      </motion.div>
    </section>
  )
}
