export const formatNumber = (value, maximumFractionDigits = 1) => new Intl.NumberFormat('id-ID', {
  maximumFractionDigits,
}).format(Number(value || 0))

export const formatKg = (value) => `${formatNumber(value)} kg`
export const formatPercent = (value) => `${formatNumber(value)}%`

export function formatShortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatTrendLabel(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(new Date(`${value}-01T00:00:00`))
  }
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`))
}

export const problemLabels = {
  full_bin: 'Tempat Sampah Penuh',
  scattered_waste: 'Sampah Berserakan',
  mixed_waste: 'Sampah Tercampur',
  dirty_area: 'Area Kotor',
  damaged_bin: 'Tempat Sampah Rusak',
  other: 'Lainnya',
}

export const statusLabels = {
  reported: 'Dilaporkan',
  in_progress: 'Diproses',
  resolved: 'Selesai',
}

export const categoryLabels = {
  organic: 'Organik',
  inorganic: 'Anorganik',
  b3: 'B3',
  residual: 'Residu',
}
