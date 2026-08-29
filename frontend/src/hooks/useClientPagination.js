import { useMemo, useState } from 'react'

export default function useClientPagination(items, pageSize, resetKey = '') {
  const currentResetKey = `${resetKey}:${items.length}`
  const [state, setState] = useState({ page: 1, resetKey: currentResetKey })
  const requestedPage = state.resetKey === currentResetKey ? state.page : 1
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  function setPage(nextPage) {
    const value = typeof nextPage === 'function' ? nextPage(page) : nextPage
    setState({ page: Math.min(Math.max(1, value), totalPages), resetKey: currentResetKey })
  }

  return { page, pageSize, totalPages, paginatedItems, setPage }
}
