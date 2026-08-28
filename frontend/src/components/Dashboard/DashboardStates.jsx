export function PanelLoading({ label = 'Memuat data' }) {
  return <div className="dashboard-state dashboard-state--loading" aria-label={label}><span /><span /><span /></div>
}

export function PanelError({ message, onRetry }) {
  return (
    <div className="dashboard-state" role="alert">
      <strong>Bagian ini belum dapat dimuat.</strong>
      <p>{message || 'Periksa koneksi lalu coba lagi.'}</p>
      <button type="button" onClick={onRetry}>Coba lagi</button>
    </div>
  )
}

export function PanelEmpty({ children }) {
  return <div className="dashboard-state dashboard-state--empty">{children}</div>
}
