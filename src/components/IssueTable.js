'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Edit, Trash2, Search, ChevronDown, ChevronUp, Filter, Calendar, CheckSquare, Square, X } from 'lucide-react'

const STATUS_STYLES = {
  'Open': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  'In Progress': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  'Closed': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  'Pending': { bg: 'rgba(249,115,22,0.12)', text: '#fb923c' },
  'Cancelled': { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
}

const ROW_FLAGS = [
  { test: (issue) => issue['Amount Refund'] && issue['Amount Refund'].trim() !== '', bg: 'rgba(239,68,68,0.08)', border: '3px solid #ef4444' },
  { test: (issue) => issue['Issue code'] === 'Broken', bg: 'rgba(245,158,11,0.1)', border: '3px solid #f59e0b' },
]

function getRowFlags(issue) {
  let found = null
  for (const flag of ROW_FLAGS) {
    if (flag.test(issue)) { found = flag; break }
  }
  return found
}

const ALL_COLUMNS = ['Customer Name', 'Contact Number', 'Issue code', 'Description', 'Branch', 'Mobile Type', 'Sold By', 'Handled by', 'Status']

export default function IssueTable({ issues, onDelete, onBulkUpdate }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
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

  const isAdmin = session?.user?.isAdmin || false

  const filtered = issues
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
    })

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

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search all fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={issueCodeFilter} onChange={e => setIssueCodeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Code</option>
          {issueCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={handledByFilter} onChange={e => setHandledByFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Handled By</option>
          {handledByList.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Branch</option>
          {branchList.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
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
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="">Set Status...</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={bulkHandledBy} onChange={e => setBulkHandledBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="">Set Handled By...</option>
            {handledByList.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
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
                {['Customer Name', 'Contact Number', 'Issue code', 'Status', 'Branch', 'Start Call', 'Handled by', 'Source'].map(col => (
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
                  <td colSpan={10}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                      <Search size={32} className="opacity-20" />
                      <span className="text-sm">No issues found</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((issue, idx) => {
                const flag = getRowFlags(issue)
                const isSelected = selected.has(issue.id)
                return (
                  <tr key={issue.id}
                    className="transition-all duration-150 cursor-pointer"
                    style={{
                      background: isSelected ? 'rgba(245,158,11,0.06)' : flag ? flag.bg : 'var(--bg-card)',
                      borderTop: '1px solid var(--border-color)',
                      borderRight: flag ? flag.border : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isSelected ? 'rgba(245,158,11,0.06)' : flag ? flag.bg : 'var(--bg-card)'
                    }}
                  >
                    <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(issue.id)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                        {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="font-medium" style={{color: 'var(--text-primary)'}}>{issue['Customer Name'] || '-'}</span>
                    </td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Contact Number'] || '-'}</td>
                    <td className="px-3 py-3.5 font-mono text-xs" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-muted)' }}>{issue['Issue code'] || '-'}</td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium"
                        style={STATUS_STYLES[issue['Status']] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }}>
                        {issue['Status'] || 'Open'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Branch'] || '-'}</td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Start Call'] || '-'}</td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)} style={{ color: 'var(--text-secondary)' }}>{issue['Handled by'] || '-'}</td>
                    <td className="px-3 py-3.5" onClick={() => router.push(`/dashboard/${issue.id}`)}>
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {issue._sheet || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
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
      <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Showing {filtered.length} of {issues.length} issues
      </div>
    </div>
  )
}
