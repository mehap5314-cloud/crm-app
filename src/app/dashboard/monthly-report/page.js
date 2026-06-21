'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import CustomDatePicker from '@/components/CustomDatePicker'
import { Calendar, TrendingUp, RefreshCw, ShieldAlert, Filter, X } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const QUICK_FILTERS = [
  { label: 'This Year', getRange: () => { const y = new Date().getFullYear(); return [`${y}-01-01`, `${y}-12-31`] } },
  { label: 'Last 6 Months', getRange: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 6); return [s.toISOString().split('T')[0], e.toISOString().split('T')[0]] } },
  { label: 'Last 3 Months', getRange: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 3); return [s.toISOString().split('T')[0], e.toISOString().split('T')[0]] } },
  { label: 'All', getRange: () => ['', ''] },
]

export default function MonthlyReport() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeQuick, setActiveQuick] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/sheets?all=true').then(r => r.json()).then(d => {
      const all = Array.isArray(d.issues) ? d.issues : []
      setIssues(all.filter(i => i._sheet === 'Customer Issues'))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [status, router])

  const filtered = useMemo(() => {
    let list = issues
    if (dateFrom) list = list.filter(i => (i['Start Call'] || '') >= dateFrom)
    if (dateTo) list = list.filter(i => (i['Start Call'] || '') <= dateTo)
    return list
  }, [issues, dateFrom, dateTo])

  const monthly = useMemo(() => {
    const map = {}
    filtered.forEach(i => {
      const d = i['Start Call']
      if (!d) return
      const m = d.substring(0, 7)
      if (!map[m]) map[m] = { month: m, total: 0, closed: 0, pending: 0, pending48h: 0, escalated: 0, broken: 0, refund: 0, refundCount: 0 }
      map[m].total++
      const s = i['Status']
      if (s === 'Closed') map[m].closed++
      else if (s === 'Pending') map[m].pending++
      else if (s === 'Pending 48H') map[m].pending48h++
      else if (s === 'Escalated') map[m].escalated++
      if (i['Issue code'] === 'Broken') map[m].broken++
      const refund = parseFloat(i['Amount Refund']) || 0
      if (refund > 0) { map[m].refund += refund; map[m].refundCount++ }
    })
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
  }, [filtered])

  const overall = useMemo(() => monthly.reduce((acc, m) => {
    acc.total += m.total; acc.closed += m.closed; acc.pending += m.pending; acc.pending48h += m.pending48h; acc.escalated += m.escalated; acc.broken += m.broken; acc.refund += m.refund; acc.refundCount += m.refundCount
    return acc
  }, { total: 0, closed: 0, pending: 0, pending48h: 0, escalated: 0, broken: 0, refund: 0, refundCount: 0 }), [monthly])

  function applyQuick(f) {
    setActiveQuick(f.label)
    const [from, to] = f.getRange()
    setDateFrom(from)
    setDateTo(to)
  }

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setActiveQuick(null)
  }

  function monthLabel(m) {
    const [y, mo] = m.split('-')
    return `${MONTHS[parseInt(mo) - 1]} ${y}`
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  const isAdmin = session?.user?.isAdmin
  const isManager = session?.user?.isManager
  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <ShieldAlert size={20} className="text-amber-400" />
          <span className="text-sm text-amber-300">Admin access required</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <Calendar size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Monthly Report</h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Customer Issues · {monthly.length} months · {overall.total} issues</p>
              </div>
            </div>
            <button onClick={() => { setLoading(true); fetch('/api/sheets?all=true').then(r => r.json()).then(d => { const all = Array.isArray(d.issues) ? d.issues : []; setIssues(all.filter(i => i._sheet === 'Customer Issues')); setLoading(false) }).catch(() => setLoading(false)) }}
              className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ color: 'var(--text-secondary)' }}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Date Filter */}
          <div className="rounded-2xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Filter size={13} className="text-amber-400" />
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Date Range</span>
              {(dateFrom || dateTo) && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ml-auto" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_FILTERS.map(f => (
                <button key={f.label} onClick={() => applyQuick(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeQuick === f.label ? 'rgba(245,158,11,0.15)' : 'var(--bg-secondary)',
                    color: activeQuick === f.label ? '#f59e0b' : 'var(--text-secondary)',
                    border: activeQuick === f.label ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border-color)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-semibold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>From</label>
                <CustomDatePicker value={dateFrom} onChange={v => { setDateFrom(v); setActiveQuick(null) }} placeholder="Start date..." />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-semibold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>To</label>
                <CustomDatePicker value={dateTo} onChange={v => { setDateTo(v); setActiveQuick(null) }} placeholder="End date..." />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <RefreshCw size={32} className="text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Total</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#f59e0b' }}>{overall.total}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Closed</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#34d399' }}>{overall.closed}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Pending</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#fb923c' }}>{overall.pending}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>P.48H</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#fbbf24' }}>{overall.pending48h}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Esc.</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#f87171' }}>{overall.escalated}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Broken</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#f97316' }}>{overall.broken}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Refund</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#ef4444' }}>{overall.refundCount}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Refund EGP</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#fbbf24' }}>{overall.refund.toLocaleString()}</div>
                </div>
              </div>

              {monthly.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={32} className="opacity-20" />
                  <span className="text-sm">No data for this period</span>
                </div>
              ) : monthly.map((m, idx) => {
                const closedPct = m.total ? ((m.closed / m.total) * 100).toFixed(0) : 0
                return (
                  <div key={m.month} className="rounded-xl border overflow-hidden animate-fade-in" style={{ borderColor: 'var(--border-color)', animationDelay: `${idx * 60}ms` }}>
                    <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-amber-400" />
                        <span className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{monthLabel(m.month)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: '#34d399' }}>{m.closed} closed ({closedPct}%)</span>
                        <span className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full" style={{ width: `${closedPct}%`, background: '#34d399' }} />
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x rtl:divide-x-reverse" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Total</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#f59e0b' }}>{m.total}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Closed</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#34d399' }}>{m.closed}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Pending</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#fb923c' }}>{m.pending}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>P.48H</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#fbbf24' }}>{m.pending48h}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Esc.</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#f87171' }}>{m.escalated}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Broken</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#f97316' }}>{m.broken}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Refund</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#ef4444' }}>{m.refundCount}</div>
                      </div>
                      <div className="px-4 py-3 text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Refund EGP</div>
                        <div className="text-sm font-heading font-bold mt-0.5" style={{ color: '#fbbf24' }}>{m.refund.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
