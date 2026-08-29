import { ChevronLeft, ChevronRight } from 'lucide-react'
import './DataPagination.css'

function visiblePages(page, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)
  const tokens = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) tokens.push(`gap-${value}`)
    tokens.push(value)
  })
  return tokens
}

export default function DataPagination({ page, pageSize, totalItems, totalPages, onPageChange, label = 'data' }) {
  if (totalItems <= pageSize) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <nav className="data-pagination" aria-label={`Pagination ${label}`}>
      <span className="data-pagination__range">Menampilkan <strong>{start}–{end}</strong> dari <strong>{totalItems}</strong> {label}</span>
      <div className="data-pagination__controls">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya"><ChevronLeft /></button>
        {visiblePages(page, totalPages).map((token) => typeof token === 'number'
          ? <button type="button" key={token} className={token === page ? 'is-active' : ''} onClick={() => onPageChange(token)} aria-current={token === page ? 'page' : undefined}>{token}</button>
          : <span key={token} aria-hidden="true">…</span>)}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Halaman berikutnya"><ChevronRight /></button>
      </div>
    </nav>
  )
}
