'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import {
  BarChart3, TrendingUp, AlertCircle, HeadphonesIcon,
  RefreshCw, Users, CheckCircle, Clock, DollarSign,
  Smartphone, Building, Target, Activity, ShieldAlert
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-3xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function BarChartCard({ title, data, color, icon: Icon, maxBars }) {
  const items = maxBars ? data.slice(0, maxBars) : data
  const maxVal = Math.max(...items.map(d => d.value), 1)

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `${color}15` }}>
          {Icon && <Icon size={17} style={{ color }} />}
        </div>
        <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-primary)' }} className="truncate max-w-[200px]">{item.label}</span>
              <span style={{ color: 'var(--text-muted)' }} className="font-mono">{item.value}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  boxShadow: `0 0 8px ${color}44`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusDonut({ issues }) {
  const statuses = ['Open', 'In Progress', 'Closed', 'Pending', 'Cancelled']
  const colors = {
    'Open': { bg: '#fbbf24', ring: '#f59e0b' },
    'In Progress': { bg: '#60a5fa', ring: '#3b82f6' },
    'Closed': { bg: '#34d399', ring: '#10b981' },
    'Pending': { bg: '#fb923c', ring: '#f97316' },
    'Cancelled': { bg: '#f87171', ring: '#ef4444' },
  }
  const counts = {}
  statuses.forEach(s => counts[s] = 0)
  issues.forEach(i => { if (counts[i['Status']] !== undefined) counts[i['Status']]++ })
  const total = issues.length || 1

  let cumulative = 0
  const segments = statuses.filter(s => counts[s] > 0).map((s, idx) => {
    const pct = (counts[s] / total) * 100
    const start = cumulative
    cumulative += pct
    return { label: s, count: counts[s], pct, color: colors[s].ring, start, end: cumulative }
  })

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <Activity size={17} style={{ color: '#f59e0b' }} />
        </div>
        <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Status Distribution</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span style={{ color: 'var(--text-primary)' }}>{s.label}</span>
            <span style={{ color: 'var(--text-muted)' }} className="font-mono">{s.count} ({s.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
      <div className="mt-4 w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-secondary)' }}>
        {segments.map((s, i) => (
          <div key={i} className="h-full transition-all duration-1000" style={{ width: `${s.pct}%`, background: s.color, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }} />
        ))}
      </div>
    </div>
  )
}

function MonthlyTrend({ issues, color }) {
  const months = {}
  issues.forEach(i => {
    const d = i['Start Call']
    if (!d) return
    const m = d.substring(0, 7)
    months[m] = (months[m] || 0) + 1
  })
  const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b))
  const maxVal = Math.max(...sorted.map(([,v]) => v), 1)

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `${color}15` }}>
          <TrendingUp size={17} style={{ color }} />
        </div>
        <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Monthly Trend</h3>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {sorted.map(([month, count], i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{count}</span>
            <div className="w-full rounded-t-md transition-all duration-1000"
              style={{
                height: `${(count / maxVal) * 100}%`,
                background: `linear-gradient(180deg, ${color}, ${color}66)`,
                borderRadius: '4px 4px 0 0',
                minHeight: count > 0 ? '8px' : '0',
              }}
            />
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{month.slice(-2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function fetchIssues() {
    try {
      setLoading(true)
      const res = await fetch('/api/sheets')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setIssues(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated') fetchIssues()
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

  const total = issues.length
  const open = issues.filter(i => i['Status'] === 'Open').length
  const inProgress = issues.filter(i => i['Status'] === 'In Progress').length
  const closed = issues.filter(i => i['Status'] === 'Closed').length
  const refunded = issues.filter(i => i['Amount Refund'] && i['Amount Refund'].trim() !== '').length
  const broken = issues.filter(i => i['Issue code'] === 'Broken').length

  const branchData = {}
  issues.forEach(i => {
    const b = i['Branch'] || 'Unknown'
    branchData[b] = (branchData[b] || 0) + 1
  })
  const branchStats = Object.entries(branchData).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  const issueCodeData = {}
  issues.forEach(i => {
    const c = i['Issue code'] || 'Unknown'
    issueCodeData[c] = (issueCodeData[c] || 0) + 1
  })
  const issueCodeStats = Object.entries(issueCodeData).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  const handledByData = {}
  issues.forEach(i => {
    const h = i['Handled by'] || 'Unassigned'
    handledByData[h] = (handledByData[h] || 0) + 1
  })
  const handledByStats = Object.entries(handledByData).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  const complaintDestData = {}
  issues.forEach(i => {
    const c = i['Complaints Destination'] || 'Unknown'
    complaintDestData[c] = (complaintDestData[c] || 0) + 1
  })
  const complaintDestStats = Object.entries(complaintDestData).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  const totalRefund = issues.reduce((sum, i) => {
    const v = parseFloat(i['Amount Refund']) || 0
    return sum + v
  }, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-4 mb-8 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                    <BarChart3 size={20} className="text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Analytics</h1>
                </div>
                <p className="text-sm mr-[52px]" style={{ color: 'var(--text-secondary)' }}>
                  Comprehensive customer issue analysis
                </p>
              </div>
              <button onClick={fetchIssues}
                className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading analytics...</span>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard icon={HeadphonesIcon} label="Total Issues" value={total} color="#f59e0b" />
                  <StatCard icon={AlertCircle} label="Open" value={open} sub={`${total ? ((open/total)*100).toFixed(0) : 0}% of total`} color="#fbbf24" />
                  <StatCard icon={Activity} label="In Progress" value={inProgress} sub={`${total ? ((inProgress/total)*100).toFixed(0) : 0}% of total`} color="#60a5fa" />
                  <StatCard icon={CheckCircle} label="Closed" value={closed} sub={`${total ? ((closed/total)*100).toFixed(0) : 0}% of total`} color="#34d399" />
                  <StatCard icon={Smartphone} label="Broken" value={broken} sub={`${total ? ((broken/total)*100).toFixed(0) : 0}% of total`} color="#f97316" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard icon={DollarSign} label="Total Refund" value={`EGP ${totalRefund.toLocaleString()}`} color="#ef4444" />
                  <StatCard icon={Users} label="Refunded Issues" value={refunded} color="#ef4444" />
                  <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>
                        <Target size={20} style={{ color: '#818cf8' }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Resolution Rate</span>
                      <span className="text-3xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {total ? `${((closed / total) * 100).toFixed(0)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatusDonut issues={issues} />
                  <MonthlyTrend issues={issues} color="#f59e0b" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChartCard title="Issues by Branch" data={branchStats} color="#f59e0b" icon={Building} maxBars={10} />
                  <BarChartCard title="Issues by Code" data={issueCodeStats} color="#60a5fa" icon={Activity} maxBars={10} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChartCard title="Handled By" data={handledByStats} color="#34d399" icon={Users} maxBars={10} />
                  <BarChartCard title="Complaints Destination" data={complaintDestStats} color="#818cf8" icon={Target} maxBars={10} />
                </div>

                <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={12} />
                    Data refreshes on page load &middot; {issues.length} records analyzed
                  </div>
                </div>
              </div>
            )}
          </main>
      </div>
    </div>
  )
}
