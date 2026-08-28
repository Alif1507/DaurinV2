import { useCallback, useEffect, useState } from 'react'

export default function useCamera() {
  const [status, setStatus] = useState('idle')
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')

  const stopCamera = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop())
      return null
    })
    setStatus('idle')
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      setError('Browser ini tidak mendukung akses kamera.')
      return
    }

    setStatus('requesting')
    setError('')

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      setStream((current) => {
        current?.getTracks().forEach((track) => track.stop())
        return mediaStream
      })
      setStatus('active')
    } catch (cameraError) {
      const permissionDenied = cameraError?.name === 'NotAllowedError'
        || cameraError?.name === 'SecurityError'

      setStatus(permissionDenied ? 'denied' : 'error')
      setError(
        permissionDenied
          ? 'Kamera tidak dapat diakses. Kamu tetap bisa memilih foto dari perangkat.'
          : 'Kamera gagal dimulai. Coba lagi atau pilih foto dari perangkat.',
      )
    }
  }, [])

  useEffect(() => () => {
    stream?.getTracks().forEach((track) => track.stop())
  }, [stream])

  return { status, stream, error, startCamera, stopCamera }
}
