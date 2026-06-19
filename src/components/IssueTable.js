'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Edit, Trash2, Search, ChevronDown, ChevronUp, Filter, Calendar, CheckSquare, Square, X, ChevronLeft, ChevronRight } from 'lucide-react'
import CustomSelect from './CustomSelect'

function getSLADays(issue) {
  if (issue['Status'] !== 'Pending' && issue['Status'] !== 'Pending 48H') return null
  const start = issue['Start Call']
  if (!start) return null
  const diff = (new Date() - new Date(start)) / (1000 * 60 * 60 * 24)
  return Math.floor(diff)
}

function getSLAStyle(issue) {
  const days = getSLADays(issue)
  if (days === null) return null
  if (days <= 1) return { bg: 'rgba(16,185,129,0.12)', color: '#34d399', label: `${days}d` }
  if (days <= 2) return { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', label: `${days}d` }
  return { bg: 'rgba(239,68,68,0.12)', color: '#f87171', label: `${days}d` }
}

const STATUS_STYLES = {
  'Closed': { background: 'rgba(16,185,129,0.12)', color: '#34d399' },
  'Pending': { background: 'rgba(249,115,22,0.12)', color: '#fb923c' },
  'Pending 48H': { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  'Escalated': { background: 'rgba(239,68,68,0.12)', color: '#f87171' },
}

const TAG_PALETTE = [
  { background: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  { background: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
  { background: 'rgba(14,165,233,0.1)', color: '#38bdf8' },
  { background: 'rgba(168,85,247,0.1)', color: '#c084fc' },
  { background: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  { background: 'rgba(6,182,212,0.1)', color: '#22d3ee' },
  { background: 'rgba(34,197,94,0.1)', color: '#4ade80' },
  { background: 'rgba(244,63,94,0.1)', color: '#fb7185' },
  { background: 'rgba(236,72,153,0.1)', color: '#f472b6' },
  { background: 'rgba(251,146,60,0.1)', color: '#fdba74' },
  { background: 'rgba(248,113,113,0.1)', color: '#fca5a5' },
  { background: 'rgba(52,211,153,0.1)', color: '#6ee7b7' },
]

function tagColor(val) {
  if (!val) return TAG_PALETTE[0]
  let h = 0
  for (let i = 0; i < val.length; i++) h = ((h << 5) - h + val.charCodeAt(i)) | 0
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]
}

const ALL_COLUMNS = ['Ticket', 'Customer Name', 'Contact Number', 'Issue code', 'Description', 'Branch', 'Mobile Type', 'Sold By', 'Handled by', 'Status']

export default function IssueTable({ issues, onDelete, onBulkUpdate, total, page, pageSize, onPageChange, onSearch, searchQuery }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [issueCodeFilter, setIssueCodeFilter] = useState('')
  const [handledByFilter, setHandledByFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkHandledBy, setBulkHandledBy] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const searchTimer = useRef(null)

  useEffect(() => {
    setSearch(searchQuery || '')
  }, [searchQuery])

  const isAdmin = session?.user?.isAdmin || false

  const filtered = useMemo(() => issues
    .filter((issue) => {
      if (!search) return true
      const q = search.toLowerCase()
      return ALL_COLUMNS.some(col => (issue[col] || '').toLowerCase().includes(q))
    })
    .filter((issue) => !statusFilter || issue['Status'] === statusFilter)
    .filter((issue) => !issueCodeFilter || issue['Issue code'] === issueCodeFilter)
    .filter((issue) => !handledByFilter || issue['Handled by'] === handledByFilter)
    .filter((issue) => !branchFilter || issue['Branch'] === branchFilter)
    .filter((issue) => {
      if (!dateFrom && !dateTo) return true
      const d = issue['Start Call'] || ''
      if (!d) return false
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
    .sort((a, b) => {
      if (!sortField) return 0
      const aVal = (a[sortField] || '').toString()
      const bVal = (b[sortField] || '').toString()
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }), [issues, search, statusFilter, issueCodeFilter, handledByFilter, branchFilter, dateFrom, dateTo, sortField, sortDir])

  const statuses = [...new Set(issues.map((i) => i['Status']).filter(Boolean))]
  const issueCodes = [...new Set(issues.map((i) => i['Issue code']).filter(Boolean))]
  const handledByList = [...new Set(issues.map((i) => i['Handled by']).filter(Boolean))]
  const branchList = [...new Set(issues.map((i) => i['Branch']).filter(Boolean))]

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(i => i.id)))
  }

  const clearSelection = () => setSelected(new Set())

  const applyBulk = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    const updates = {}
    if (bulkStatus) updates['Status'] = bulkStatus
    if (bulkHandledBy) updates['Handled by'] = bulkHandledBy
    if (Object.keys(updates).length === 0) return

    setBulkLoading(true)
    try {
      const res = await fetch('/api/sheets/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      })
      if (res.ok) {
        clearSelection()
        setBulkStatus('')
        setBulkHandledBy('')
        if (onBulkUpdate) onBulkUpdate()
      }
    } catch {}
    setBulkLoading(false)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="opacity-30" />
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  const visiblePages = useMemo(() => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [page, totalPages])

  const handleSearchInput = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      if (onSearch) onSearch(value)
    }, 400)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="w-[130px]"><CustomSelect value={statusFilter} onChange={setStatusFilter} options={statuses} placeholder="Status" /></div>
        <div className="w-[130px]"><CustomSelect value={issueCodeFilter} onChange={setIssueCodeFilter} options={issueCodes} placeholder="Code" /></div>
        <div className="w-[140px]"><CustomSelect value={handledByFilter} onChange={setHandledByFilter} options={handledByList} placeholder="Handled By" /></div>
        <div className="w-[130px]"><CustomSelect value={branchFilter} onChange={setBranchFilter} options={branchList} placeholder="Branch" /></div>
        <div className="flex items-center gap-1">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-2 rounded-xl text-sm w-[120px]"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-2 rounded-xl text-sm w-[120px]"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border animate-slide-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selected.size} selected</span>
          <button onClick={clearSelection} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
          <div className="h-5 w-px" style={{ background: 'var(--border-color)' }} />
          <div className="w-[150px]"><CustomSelect value={bulkStatus} onChange={setBulkStatus} options={statuses} placeholder="Set Status..." /></div>
          <div className="w-[160px]"><CustomSelect value={bulkHandledBy} onChange={setBulkHandledBy} options={handledByList} placeholder="Set Handled By..." /></div>
          <button onClick={applyBulk} disabled={bulkLoading || (!bulkStatus && !bulkHandledBy)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              opacity: bulkLoading || (!bulkStatus && !bulkHandledBy) ? 0.6 : 1,
            }}>
            {bulkLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="px-3 py-3.5 w-10">
                  <button onClick={toggleSelectAll} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                    {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                </th>
                {['Ticket', 'Customer Name', 'Contact Number', 'Issue code', 'Days', 'Status', 'Branch', 'Start Call', 'Handled by', 'Amount Refund', 'Source'].map(col => (
                  <th key={col} onClick={() => toggleSort(col)}
                    className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      {col}
                      <SortIcon field={col} />
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                    <td colSpan={12}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                      <Search size={32} className="opacity-20" />
                      <span className="text-sm">No issues found</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((issue, idx) => {
                const isSelected = selected.has(issue.id)
                return (
                  <tr key={issue.id}
                    className="transition-all duration-150 cursor-pointer"
                    style={{
                      background: isSelected ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)',
                      borderTop: '1px solid var(--border-color)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isSelected ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)'
                    }}
                  >
                    <td className="px-3 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(issue.id)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                        {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-xs font-bold" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--accent)' }}>
                      {issue['Ticket'] || '-'}
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="font-medium" style={{color: 'var(--text-primary)'}}>{issue['Customer Name'] || '-'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Contact Number'] || '-'}</td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide"
                        style={tagColor(issue['Issue code'])}>
                        {issue['Issue code'] || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      {(() => {
                        const start = issue['Start Call']
                        if (!start) return <span style={{ color: 'var(--text-muted)' }}>-</span>

                        const note = issue['Note'] || ''
                        const exMatch = note.match(/__EX_END__:(\S+)/)
                        const isExceptionActive = exMatch && new Date(exMatch[1]) >= new Date(new Date().toISOString().split('T')[0])

                        if (isExceptionActive) {
                          return (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold" style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>
                              ⏸
                            </span>
                          )
                        }

                        const diff = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24))
                        const color = issue['Status'] === 'Closed' ? '#34d399' : diff <= 1 ? '#34d399' : diff <= 2 ? '#fbbf24' : '#f87171'
                        const bg = issue['Status'] === 'Closed' ? 'rgba(16,185,129,0.1)' : diff <= 1 ? 'rgba(16,185,129,0.1)' : diff <= 2 ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)'
                        return (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold" style={{ background: bg, color }}>
                            {issue['Status'] === 'Closed' ? '✓' : `${diff}d`}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium"
                          style={STATUS_STYLES[issue['Status']] || { background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>
                          {issue['Status'] || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Branch'] || '-'}</td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Start Call'] || '-'}</td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide"
                        style={tagColor(issue['Handled by'])}>
                        {issue['Handled by'] || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      {issue['Amount Refund'] && issue['Amount Refund'].trim() !== '' ? (
                        <span className="inline-block px-2 py-1 rounded-lg text-xs font-mono font-bold"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                          {issue['Amount Refund']}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {issue._sheet || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-left">
                      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <button onClick={() => router.push(`/dashboard/${issue.id}/edit`)}
                          className="p-1.5 rounded-lg transition-all duration-200"
                          style={{ color: 'var(--text-muted)' }}>
                          <Edit size={14} />
                        </button>
                      {isAdmin && <button onClick={() => { if (confirm('Delete this issue?')) onDelete(issue.id) }}
                        className="p-1.5 rounded-lg transition-all duration-200"
                        style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {search ? (
            <>Found <span className="font-medium" style={{color: 'var(--text-primary)'}}>{filtered.length}</span> results</>
          ) : (
            <>Showing <span className="font-medium" style={{color: 'var(--text-primary)'}}>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}</span> of <span className="font-medium" style={{color: 'var(--text-primary)'}}>{total}</span> issues</>
          )}
        </div>
        {!search && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
            >
              First
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
            {visiblePages[0] > 1 && (
              <>
                <span className="px-2 py-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>...</span>
              </>
            )}
            {visiblePages.map(p => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: p === page ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: p === page ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {p}
              </button>
            ))}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                <span className="px-2 py-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>...</span>
              </>
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
