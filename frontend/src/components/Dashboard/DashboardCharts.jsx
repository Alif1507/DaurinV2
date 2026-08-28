import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { categoryLabels, formatNumber, formatTrendLabel } from '../../utils/formatters'
import { PanelEmpty, PanelError, PanelLoading } from './DashboardStates'

const COLORS = {
  organic: '#55a956',
  inorganic: '#3d83a8',
  residual: '#626d67',
  b3: '#b5443c',
  reported: '#b5443c',
  in_progress: '#c98220',
  resolved: '#0d5c3b',
}

function ChartFrame({ title, eyebrow, action, query, emptyMessage, children, className = '' }) {
  return (
    <section className={`dashboard-panel ${className}`}>
      <header className="dashboard-panel__header">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
        {action}
      </header>
      {query.isLoading && <PanelLoading label={`Memuat ${title}`} />}
      {query.isError && <PanelError message={query.error?.userMessage} onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (!query.data || query.data.length === 0)
        ? <PanelEmpty>{emptyMessage}</PanelEmpty>
        : !query.isLoading && !query.isError ? children : null}
    </section>
  )
}

function ValueTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{formatTrendLabel(label)}</strong>
      {payload.map((item) => (
        <span key={item.dataKey} style={{ '--series-color': item.color }}>
          {item.name}: {formatNumber(item.value)}{suffix}
        </span>
      ))}
    </div>
  )
}

export function WasteTrendChart({ query }) {
  return (
    <ChartFrame
      className="dashboard-panel--hero-chart"
      title="Jejak sampah sekolah"
      eyebrow="Volume per hari"
      query={query}
      emptyMessage="Belum ada data sampah pada periode ini."
    >
      <div className="chart chart--wide">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={query.data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="organicFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.organic} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.organic} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#dfe8df" strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="label" tickFormatter={formatTrendLabel} axisLine={false} tickLine={false} tick={{ fill: '#718078', fontSize: 11 }} minTickGap={28} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718078', fontSize: 11 }} />
            <Tooltip content={<ValueTooltip suffix=" kg" />} />
            <Area type="monotone" dataKey="organic" name="Organik" stroke={COLORS.organic} fill="url(#organicFill)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="inorganic" name="Anorganik" stroke={COLORS.inorganic} fill="transparent" strokeWidth={2.5} />
            <Area type="monotone" dataKey="residual" name="Residu" stroke={COLORS.residual} fill="transparent" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {['organic', 'inorganic', 'residual'].map((key) => <span key={key} style={{ '--legend-color': COLORS[key] }}>{categoryLabels[key]}</span>)}
      </div>
    </ChartFrame>
  )
}

function DonutPanel({ title, eyebrow, data, emptyMessage, centerValue, centerLabel }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header"><div><span>{eyebrow}</span><h2>{title}</h2></div></header>
      {!total ? <PanelEmpty>{emptyMessage}</PanelEmpty> : (
        <div className="donut-layout">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="91%" paddingAngle={3} stroke="none">
                  {data.map((item) => <Cell key={item.key} fill={COLORS[item.key]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-chart__center"><strong>{centerValue}</strong><span>{centerLabel}</span></div>
          </div>
          <ul className="donut-legend">
            {data.map((item) => (
              <li key={item.key} style={{ '--legend-color': COLORS[item.key] }}>
                <span>{item.name}</span><strong>{formatNumber(item.value)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export function WasteCompositionChart({ summary }) {
  const waste = summary?.waste || {}
  const data = [
    { key: 'organic', name: 'Organik', value: waste.organic || 0 },
    { key: 'inorganic', name: 'Anorganik', value: waste.inorganic || 0 },
    { key: 'residual', name: 'Residu', value: waste.residual || 0 },
  ]
  return <DonutPanel title="Komposisi sampah" eyebrow="Berat dalam kilogram" data={data} emptyMessage="Belum ada komposisi sampah." centerValue={formatNumber(waste.total)} centerLabel="kg total" />
}

export function ReportStatusChart({ summary }) {
  const reports = summary?.reports || {}
  const data = [
    { key: 'reported', name: 'Dilaporkan', value: reports.reported || 0 },
    { key: 'in_progress', name: 'Diproses', value: reports.in_progress || 0 },
    { key: 'resolved', name: 'Selesai', value: reports.resolved || 0 },
  ]
  return <DonutPanel title="Status laporan" eyebrow="Tindak lanjut kebersihan" data={data} emptyMessage="Belum ada laporan kebersihan." centerValue={formatNumber(reports.total, 0)} centerLabel="laporan" />
}

export function CamideChart({ query }) {
  const data = query.data ? Object.entries(query.data.categories).map(([key, value]) => ({ key, name: categoryLabels[key], value })) : []
  return (
    <ChartFrame title="Pola identifikasi CAMIDE" eyebrow="Kategori yang paling sering terlihat" query={{ ...query, data }} emptyMessage="Belum ada identifikasi CAMIDE pada periode ini.">
      <div className="chart chart--bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 2, left: -28, bottom: 0 }}>
            <CartesianGrid stroke="#e4ebe4" strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#607068', fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#607068', fontSize: 11 }} />
            <Tooltip cursor={{ fill: '#eff5ef' }} formatter={(value) => [value, 'Identifikasi']} />
            <Bar dataKey="value" radius={[8, 8, 2, 2]}>
              {data.map((item) => <Cell key={item.key} fill={COLORS[item.key]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="dashboard-panel__note">Prediksi CAMIDE adalah bantuan identifikasi. Sampah B3 tetap mengikuti prosedur sekolah.</p>
    </ChartFrame>
  )
}
