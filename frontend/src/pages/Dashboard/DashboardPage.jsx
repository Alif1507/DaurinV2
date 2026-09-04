import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Camera,
  CheckCircle2,
  Droplets,
  RefreshCw,
  Scale,
  TrendingDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/Dashboard/DashboardShell'
import {
  CamideChart,
  ReportStatusChart,
  WasteCompositionChart,
  WasteTrendChart,
} from '../../components/Dashboard/DashboardCharts'
import { PanelEmpty, PanelError, PanelLoading } from '../../components/Dashboard/DashboardStates'
import useDashboardFilters from '../../hooks/useDashboardFilters'
import {
  getCamideSummary,
  getDashboardSummary,
  getLocationPerformance,
  getLocations,
  getRecentReports,
  getRecentWaste,
  getWasteTrend,
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

const presets = [
  { value: 'today', label: 'Hari ini' },
  { value: 'last_7', label: '7 hari' },
  { value: 'last_30', label: '30 hari' },
  { value: 'this_month', label: 'Bulan ini' },
  { value: 'custom', label: 'Kustom' },
]

function StatCard({ index, title, value, context, icon: Icon, tone = 'green', change }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__step">{index}</span>
      <span className="stat-card__icon"><Icon /></span>
      <div className="stat-card__copy"><span>{title}</span><strong>{value}</strong><small>{context}</small></div>
      {change !== undefined && (
        <span className={`stat-card__change${change !== null && change < 0 ? ' is-down' : ''}`}>
          {change === null ? 'Tanpa pembanding' : `${change > 0 ? '+' : ''}${formatNumber(change)}% periode lalu`}
        </span>
      )}
    </article>
  )
}

function DashboardFilters({ filterState, locations, onRefresh, isRefreshing }) {
  return (
    <section className="dashboard-filters" aria-label="Filter dashboard">
      <div className="dashboard-presets" role="group" aria-label="Rentang cepat">
        {presets.map((item) => (
          <button key={item.value} type="button" className={filterState.preset === item.value ? 'is-active' : ''} onClick={() => filterState.setPreset(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
      <label><span>Dari</span><input type="date" value={filterState.dateRange.start_date} onChange={(event) => filterState.setDate('start_date', event.target.value)} /></label>
      <label><span>Sampai</span><input type="date" value={filterState.dateRange.end_date} onChange={(event) => filterState.setDate('end_date', event.target.value)} /></label>
      <label className="dashboard-filters__location"><span>Lokasi</span><select value={filterState.locationId} onChange={(event) => filterState.setLocationId(event.target.value)}><option value="">Semua lokasi</option>{locations?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <button type="button" className="dashboard-refresh" onClick={onRefresh} disabled={isRefreshing}><RefreshCw className={isRefreshing ? 'is-spinning' : ''} /> <span>Perbarui</span></button>
    </section>
  )
}

function LocationPerformance({ query, onSelect }) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel__header"><div><span>Per area sekolah</span><h2>Kinerja lokasi</h2></div></header>
      {query.isLoading && <PanelLoading />}
      {query.isError && <PanelError message={query.error?.userMessage} onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && !query.data?.length && <PanelEmpty>Belum ada data lokasi untuk periode ini.</PanelEmpty>}
      {!query.isLoading && !query.isError && query.data?.length > 0 && (
        <div className="location-list">
          {query.data.slice(0, 6).map((item) => (
            <button type="button" key={item.location_id} onClick={() => onSelect(item.location_id)}>
              <span className="location-list__rank" />
              <span><strong>{item.location_name}</strong><small>{item.reports} laporan · {formatKg(item.total_waste)}</small></span>
              <span className="location-list__score"><strong>{formatPercent(item.resolution_rate)}</strong><small>selesai</small></span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function RecentReports({ query, locationNames }) {
  return (
    <section className="dashboard-panel dashboard-panel--table">
      <header className="dashboard-panel__header"><div><span>Aktivitas terbaru</span><h2>Laporan kebersihan</h2></div></header>
      {query.isLoading && <PanelLoading />}
      {query.isError && <PanelError message={query.error?.userMessage} onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && !query.data?.length && <PanelEmpty>Belum ada laporan kebersihan.</PanelEmpty>}
      {!query.isLoading && !query.isError && query.data?.length > 0 && (
        <div className="responsive-table">
          <table><thead><tr><th>Masalah</th><th>Lokasi</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>
            {query.data.map((report) => <tr key={report.id}><td><strong>{problemLabels[report.problem_type]}</strong><small>{report.description || 'Tanpa catatan'}</small></td><td>{locationNames[report.location_id] || 'Lokasi sekolah'}</td><td><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></td><td>{formatShortDate(report.created_at)}</td></tr>)}
          </tbody></table>
          <div className="mobile-records">{query.data.map((report) => <article key={report.id}><div><strong>{problemLabels[report.problem_type]}</strong><span className={`status-pill status-pill--${report.status}`}>{statusLabels[report.status]}</span></div><p>{report.description || 'Tanpa catatan'}</p><small>{locationNames[report.location_id] || 'Lokasi sekolah'} · {formatShortDate(report.created_at)}</small></article>)}</div>
        </div>
      )}
    </section>
  )
}

function RecentWaste({ query, locationNames }) {
  return (
    <section className="dashboard-panel dashboard-panel--table">
      <header className="dashboard-panel__header"><div><span>Penimbangan terbaru</span><h2>Catatan sampah</h2></div></header>
      {query.isLoading && <PanelLoading />}
      {query.isError && <PanelError message={query.error?.userMessage} onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && !query.data?.length && <PanelEmpty>Belum ada catatan sampah.</PanelEmpty>}
      {!query.isLoading && !query.isError && query.data?.length > 0 && (
        <div className="responsive-table">
          <table><thead><tr><th>Tanggal</th><th>Lokasi</th><th>Organik</th><th>Anorganik</th><th>Residu</th><th>Total</th></tr></thead><tbody>
            {query.data.map((record) => { const total = record.organic_weight + record.inorganic_weight + record.residual_weight; return <tr key={record.id}><td>{formatShortDate(record.record_date)}</td><td><strong>{locationNames[record.location_id] || 'Lokasi sekolah'}</strong></td><td>{formatKg(record.organic_weight)}</td><td>{formatKg(record.inorganic_weight)}</td><td>{formatKg(record.residual_weight)}</td><td><strong>{formatKg(total)}</strong></td></tr> })}
          </tbody></table>
          <div className="mobile-records">{query.data.map((record) => { const total = record.organic_weight + record.inorganic_weight + record.residual_weight; return <article key={record.id}><div><strong>{locationNames[record.location_id] || 'Lokasi sekolah'}</strong><strong>{formatKg(total)}</strong></div><p>Organik {formatKg(record.organic_weight)} · Anorganik {formatKg(record.inorganic_weight)} · Residu {formatKg(record.residual_weight)}</p><small>{formatShortDate(record.record_date)}</small></article> })}</div>
        </div>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const filterState = useDashboardFilters()
  const filters = filterState.filters
  const validRange = filters.start_date <= filters.end_date
  const commonOptions = { enabled: validRange, staleTime: 45000 }

  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, staleTime: 300000 })
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary', filters], queryFn: () => getDashboardSummary(filters), ...commonOptions })
  const wasteTrendQuery = useQuery({ queryKey: ['dashboard', 'waste-trend', filters], queryFn: () => getWasteTrend(filters), ...commonOptions })
  const camideQuery = useQuery({ queryKey: ['dashboard', 'camide', filters], queryFn: () => getCamideSummary(filters), ...commonOptions })
  const locationQuery = useQuery({ queryKey: ['dashboard', 'locations', filters.start_date, filters.end_date], queryFn: () => getLocationPerformance(filters), ...commonOptions })
  const reportsQuery = useQuery({ queryKey: ['reports', 'recent', filters], queryFn: () => getRecentReports(filters), ...commonOptions })
  const wasteQuery = useQuery({ queryKey: ['waste', 'recent', filters], queryFn: () => getRecentWaste(filters), ...commonOptions })

  const locationNames = useMemo(() => Object.fromEntries((locationsQuery.data || []).map((location) => [location.id, location.name])), [locationsQuery.data])
  const queries = [summaryQuery, wasteTrendQuery, camideQuery, locationQuery, reportsQuery, wasteQuery]
  const isRefreshing = queries.some((query) => query.isFetching)
  const hasConnectionError = queries.some((query) => query.isError)
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['waste'] }),
  ])

  const summary = summaryQuery.data
  return (
    <DashboardShell>
      <header className="dashboard-heading">
        <div><span className="dashboard-heading__eyebrow"><Activity /> Kondisi sekolah</span><h1>Pahami. Tindak.</h1><p>Satu pandangan untuk kebersihan, sampah, dan tindakan sekolah.</p></div>
        <div className={`dashboard-heading__status${hasConnectionError ? ' has-error' : ''}`}><span /><div><strong>{hasConnectionError ? 'Sebagian data terkendala' : 'Data terhubung'}</strong></div></div>
      </header>

      <DashboardFilters filterState={filterState} locations={locationsQuery.data} onRefresh={refresh} isRefreshing={isRefreshing} />
      {!validRange && <p className="dashboard-date-error" role="alert">Tanggal awal harus sebelum atau sama dengan tanggal akhir.</p>}

      <section className="stat-loop" aria-label="Ringkasan utama">
        {summaryQuery.isLoading && Array.from({ length: 4 }, (_, index) => <div className="stat-card stat-card--skeleton" key={index} />)}
        {summaryQuery.isError && <div className="stat-loop__error"><PanelError message={summaryQuery.error?.userMessage} onRetry={summaryQuery.refetch} /></div>}
        {summary && <>
          <StatCard index="01" title="Laporan" value={formatNumber(summary.reports.total, 0)} context={`${summary.reports.in_progress} sedang diproses`} icon={Droplets} change={summary.comparison.reports_change_percentage} />
          <StatCard index="02" title="Total sampah" value={formatKg(summary.waste.total)} context={`${formatKg(summary.waste.organic)} organik`} icon={Scale} tone="blue" change={summary.comparison.waste_change_percentage} />
          <StatCard index="03" title="Residu" value={formatPercent(summary.waste.residual_percentage)} context={`${formatKg(summary.waste.residual)} belum teralihkan`} icon={TrendingDown} tone="gray" change={summary.comparison.residual_change_percentage} />
          <StatCard index="04" title="Laporan selesai" value={formatPercent(summary.reports.resolution_rate)} context={`${summary.reports.resolved} telah ditangani`} icon={CheckCircle2} tone="deep" />
        </>}
      </section>

      <WasteTrendChart query={wasteTrendQuery} />

      <div className="dashboard-grid dashboard-grid--two">
        {summaryQuery.isLoading ? <><section className="dashboard-panel"><PanelLoading /></section><section className="dashboard-panel"><PanelLoading /></section></> : summaryQuery.isError ? null : <><WasteCompositionChart summary={summary} /><ReportStatusChart summary={summary} /></>}
      </div>

      <section className="camide-kpi-strip">
        <div><Camera /><span>CAMIDE pada periode ini</span><strong>{formatNumber(camideQuery.data?.total_identifications, 0)}</strong><small>identifikasi</small></div>
        <div><span>Keyakinan rata-rata</span><strong>{formatPercent((camideQuery.data?.average_confidence || 0) * 100)}</strong></div>
        <div><span>Perlu foto ulang</span><strong>{formatNumber(camideQuery.data?.low_confidence_count, 0)}</strong></div>
        <div><span>Paling sering</span><strong>{categoryLabels[camideQuery.data?.top_category] || '—'}</strong></div>
        <Link to="/camide">Buka CAMIDE</Link>
      </section>

      <div className="dashboard-grid dashboard-grid--two">
        <CamideChart query={camideQuery} />
        <LocationPerformance query={locationQuery} onSelect={filterState.setLocationId} />
      </div>

      <RecentReports query={reportsQuery} locationNames={locationNames} />
      <RecentWaste query={wasteQuery} locationNames={locationNames} />
    </DashboardShell>
  )
}
