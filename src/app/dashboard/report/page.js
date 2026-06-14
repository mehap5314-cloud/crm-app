'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Printer, Download, AlertCircle, HeadphonesIcon } from 'lucide-react'

const STATUS_STYLES = {
  'Open': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  'In Progress': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  'Closed': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  'Pending': { bg: 'rgba(249,115,22,0.12)', text: '#fb923c' },
  'Cancelled': { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
}

export default function Report() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/sheets').then(r => r.json()).then(d => { setIssues(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [status, router])

  const todayIssues = issues.filter(i => (i['Start Call'] || '').startsWith(date))
  const total = todayIssues.length
  const open = todayIssues.filter(i => i['Status'] === 'Open').length
  const inProgress = todayIssues.filter(i => i['Status'] === 'In Progress').length
  const closed = todayIssues.filter(i => i['Status'] === 'Closed').length
  const pending = todayIssues.filter(i => i['Status'] === 'Pending').length

  const byBranch = {}
  todayIssues.forEach(i => { const b = i['Branch'] || 'Unknown'; byBranch[b] = (byBranch[b] || 0) + 1 })
  const branchList = Object.entries(byBranch).sort((a, b) => b[1] - a[1])

  const byHandledBy = {}
  todayIssues.forEach(i => { const h = i['Handled by'] || 'Unassigned'; byHandledBy[h] = (byHandledBy[h] || 0) + 1 })
  const handledByList = Object.entries(byHandledBy).sort((a, b) => b[1] - a[1])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <HeadphonesIcon size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Daily Report</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                <Printer size={15} /> Print
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="animate-fade-in space-y-6 print:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total', value: total, color: '#f59e0b' },
                  { label: 'Open', value: open, color: '#fbbf24' },
                  { label: 'In Progress', value: inProgress, color: '#60a5fa' },
                  { label: 'Closed', value: closed, color: '#34d399' },
                  { label: 'Pending', value: pending, color: '#fb923c' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>By Branch</h3>
                  <div className="space-y-2">
                    {branchList.map(([b, c]) => (
                      <div key={b} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-primary)' }}>{b}</span>
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{c}</span>
                      </div>
                    ))}
                    {branchList.length === 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No data</span>}
                  </div>
                </div>
                <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>By Handled By</h3>
                  <div className="space-y-2">
                    {handledByList.map(([h, c]) => (
                      <div key={h} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-primary)' }}>{h}</span>
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{c}</span>
                      </div>
                    ))}
                    {handledByList.length === 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No data</span>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['Customer Name', 'Contact Number', 'Issue code', 'Status', 'Branch', 'Handled by'].map(col => (
                          <th key={col} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todayIssues.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No issues for this date</td></tr>
                      ) : todayIssues.map(issue => (
                        <tr key={issue.id} style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                          <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{issue['Customer Name'] || '-'}</td>
                          <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{issue['Contact Number'] || '-'}</td>
                          <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{issue['Issue code'] || '-'}</td>
                          <td className="px-3 py-3"><span className="inline-block px-2 py-1 rounded-lg text-xs font-medium" style={STATUS_STYLES[issue['Status']] || { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }}>{issue['Status'] || 'Open'}</span></td>
                          <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{issue['Branch'] || '-'}</td>
                          <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{issue['Handled by'] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
