'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { MessageSquare, RefreshCw, Search } from 'lucide-react'

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/feedback').then(r => r.json()).then(d => {
      setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [status, router])

  const filtered = search ? feedback.filter(f =>
    Object.values(f).some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  ) : feedback

  const statusColors = {
    'تم الرد': { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    'لم يتم الرد': { bg: 'rgba(249,115,22,0.12)', color: '#fb923c' },
    'رفض': { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <MessageSquare size={18} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Feedback</h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{feedback.length} records</p>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-64 pl-9 pr-3 py-2 rounded-xl text-sm border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Search..." />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><RefreshCw size={32} className="text-amber-500 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-sm" style={{ color: 'var(--text-muted)' }}>No feedback records found</div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Date</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Customer</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Phone</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Employee</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Branch</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Product</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Model</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Total</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Emp. Rating</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f, i) => (
                      <tr key={f.id || i} style={{ borderTop: '1px solid var(--border-color)' }}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        onClick={() => {/* detail view later */}}>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Date'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Customer'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap font-mono" style={{ color: 'var(--text-secondary)' }}>{f['Customer/Phone'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Employee'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Branch'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Product/Name'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Model'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs text-center font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Total'] || '-'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={
                            f['وضع المكالمه']?.includes('تم الرد') ? statusColors['تم الرد'] :
                            f['وضع المكالمه']?.includes('لم يتم') ? statusColors['لم يتم الرد'] :
                            f['وضع المكالمه']?.includes('رفض') || f['وضع المكالمه']?.includes('السبب') ? statusColors['رفض'] :
                            {}
                          }>{f['وضع المكالمه'] || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{f['تقييم الموظف'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{f['ملاحظات'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
