'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Calendar, TrendingUp, RefreshCw, ShieldAlert, HeadphonesIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MonthlyReport() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/sheets?all=true').then(r => r.json()).then(d => { setIssues(Array.isArray(d.issues) ? d.issues : []); setLoading(false) }).catch(() => setLoading(false))
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  const isAdmin = session?.user?.isAdmin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <ShieldAlert size={20} className="text-amber-400" />
          <span className="text-sm text-amber-300">Admin access required</span>
        </div>
      </div>
    )
  }

  const monthly = {}
  issues.forEach(i => {
    const d = i['Start Call']
    if (!d) return
    const m = d.substring(0, 7)
    if (!monthly[m]) monthly[m] = { month: m, total: 0, closed: 0, pending: 0, pending48h: 0, escalated: 0, broken: 0, refund: 0, refundCount: 0 }
    monthly[m].total++
    const s = i['Status']
    if (s === 'Closed') monthly[m].closed++
    else if (s === 'Pending') monthly[m].pending++
    else if (s === 'Pending 48H') monthly[m].pending48h++
    else if (s === 'Escalated') monthly[m].escalated++
    if (i['Issue code'] === 'Broken') monthly[m].broken++
    const refund = parseFloat(i['Amount Refund']) || 0
    if (refund > 0) { monthly[m].refund += refund; monthly[m].refundCount++ }
  })

  const sorted = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).reverse().slice(0, 12)
  const overall = sorted.reduce((acc, m) => {
    acc.total += m.total; acc.closed += m.closed; acc.pending += m.pending; acc.pending48h += m.pending48h; acc.escalated += m.escalated; acc.broken += m.broken; acc.refund += m.refund; acc.refundCount += m.refundCount
    return acc
  }, { total: 0, closed: 0, pending: 0, pending48h: 0, escalated: 0, broken: 0, refund: 0, refundCount: 0 })

  const maxTotal = Math.max(...sorted.map(m => m.total), 1)

  function monthLabel(m) {
    const [y, mo] = m.split('-')
    return `${MONTHS[parseInt(mo) - 1]} ${y}`
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              <Calendar size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Monthly Report</h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sorted.length} months · {overall.total} total issues</p>
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
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Pending 48H</div>
                  <div className="text-lg font-heading font-bold" style={{ color: '#fbbf24' }}>{overall.pending48h}</div>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Escalated</div>
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

              {sorted.map((m, idx) => {
                const closedPct = m.total ? ((m.closed / m.total) * 100).toFixed(0) : 0
                return (
                  <div key={m.month} className="rounded-xl border overflow-hidden animate-fade-in" style={{ borderColor: 'var(--border-color)', animationDelay: `${idx * 80}ms` }}>
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
