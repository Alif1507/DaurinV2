import { useMemo, useState } from 'react'

function toISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function rangeForPreset(preset) {
  const end = new Date()
  const start = new Date(end)
  if (preset === 'today') return { start_date: toISODate(end), end_date: toISODate(end) }
  if (preset === 'last_7') start.setDate(end.getDate() - 6)
  else if (preset === 'this_month') start.setDate(1)
  else start.setDate(end.getDate() - 29)
  return { start_date: toISODate(start), end_date: toISODate(end) }
}

export default function useDashboardFilters() {
  const [preset, setPresetState] = useState('last_30')
  const [dateRange, setDateRange] = useState(() => rangeForPreset('last_30'))
  const [locationId, setLocationId] = useState('')

  const setPreset = (nextPreset) => {
    setPresetState(nextPreset)
    if (nextPreset !== 'custom') setDateRange(rangeForPreset(nextPreset))
  }

  const setDate = (field, value) => {
    setPresetState('custom')
    setDateRange((current) => ({ ...current, [field]: value }))
  }

  const filters = useMemo(() => ({
    ...dateRange,
    location_id: locationId || null,
    period: 'daily',
  }), [dateRange, locationId])

  return { preset, setPreset, dateRange, setDate, locationId, setLocationId, filters }
}
